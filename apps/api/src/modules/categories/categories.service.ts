import { prisma } from '../../config/database';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../shared/errors/HttpError';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  ListCategoriesQuery,
} from './categories.validator';
import type { Category } from '@prisma/client';

/**
 * Categories Service.
 *
 * Business logic for category management.
 *
 * PUBLIC FUNCTIONS (no auth):
 *   - listCategories
 *   - getCategoryBySlug
 *
 * ADMIN FUNCTIONS (auth + authorize required):
 *   - createCategory
 *   - updateCategory
 *   - deleteCategory
 */

/**
 * List categories with optional filtering.
 *
 * Filters:
 *   - parent='null' → top-level only (no parent)
 *   - parent='<uuid>' → children of specific category
 *   - undefined parent → all categories (flat list)
 *   - activeOnly='false' → include archived (default: true)
 *
 * Always sorted by displayOrder, then name.
 * Includes children count for parent categories (useful for UI badges).
 */
export async function listCategories(
  query: ListCategoriesQuery
): Promise<Category[]> {
  const activeOnly = query.activeOnly !== 'false'; // default true

  // Build where clause based on filters
  const where: { parentId?: string | null; isActive?: boolean } = {};

  if (query.parent === 'null') {
    where.parentId = null;
  } else if (query.parent) {
    where.parentId = query.parent;
  }

  if (activeOnly) {
    where.isActive = true;
  }

  return prisma.category.findMany({
    where,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}

/**
 * Get a single category by slug (public endpoint).
 *
 * Used for URLs like /categories/electronics
 * Returns the category PLUS its children and product count.
 */
export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: {
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      },
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new NotFoundError('Category');
  }

  // Don't show inactive categories on public endpoints
  if (!category.isActive) {
    throw new NotFoundError('Category');
  }

  return category;
}

/**
 * Get a category by ID (admin use).
 *
 * Returns inactive categories too (admin can see everything).
 */
export async function getCategoryById(id: string): Promise<Category> {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new NotFoundError('Category');
  }

  return category;
}

/**
 * Create a new category (ADMIN ONLY).
 *
 * Validation:
 * - Slug must be unique
 * - parentId (if provided) must exist
 * - Cannot create circular references (a category cannot be its own ancestor)
 */
export async function createCategory(
  input: CreateCategoryInput
): Promise<Category> {
  // Check slug uniqueness
  const existingSlug = await prisma.category.findUnique({
    where: { slug: input.slug },
  });

  if (existingSlug) {
    throw new ConflictError(`Category with slug "${input.slug}" already exists`);
  }

  // If parentId provided, verify it exists
  if (input.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: input.parentId },
    });

    if (!parent) {
      throw new ValidationError('Parent category does not exist');
    }
  }

  return prisma.category.create({
    data: {
      name: input.name,
      slug: input.slug,
      description:
        input.description === '' ? null : input.description ?? null,
      imageUrl: input.imageUrl === '' ? null : input.imageUrl ?? null,
      parentId: input.parentId ?? null,
      displayOrder: input.displayOrder ?? 0,
      isActive: input.isActive ?? true,
    },
  });
}

/**
 * Update an existing category (ADMIN ONLY).
 *
 * Validation:
 * - Slug (if changed) must be unique
 * - parentId (if changed) must exist
 * - Cannot set parent to self (would create circular reference)
 * - Cannot set parent to a descendant (would create circular reference)
 */
export async function updateCategory(
  id: string,
  input: UpdateCategoryInput
): Promise<Category> {
  // Verify category exists
  await getCategoryById(id);

  // If slug changed, check uniqueness
  if (input.slug !== undefined) {
    const existing = await prisma.category.findUnique({
      where: { slug: input.slug },
    });
    if (existing && existing.id !== id) {
      throw new ConflictError(
        `Category with slug "${input.slug}" already exists`
      );
    }
  }

  // If parentId changed, verify it
  if (input.parentId !== undefined && input.parentId !== null) {
    // Cannot set self as parent
    if (input.parentId === id) {
      throw new ValidationError('A category cannot be its own parent');
    }

    // Verify parent exists
    const parent = await prisma.category.findUnique({
      where: { id: input.parentId },
    });
    if (!parent) {
      throw new ValidationError('Parent category does not exist');
    }

    // Prevent circular reference (parent cannot be a descendant)
    const isDescendant = await isDescendantOf(input.parentId, id);
    if (isDescendant) {
      throw new ValidationError(
        'Cannot set a descendant category as parent (circular reference)'
      );
    }
  }

  // Build update data
  const data: Record<string, string | boolean | number | null> = {};
  if (input.name !== undefined) data['name'] = input.name;
  if (input.slug !== undefined) data['slug'] = input.slug;
  if (input.description !== undefined) {
    data['description'] = input.description === '' ? null : input.description;
  }
  if (input.imageUrl !== undefined) {
    data['imageUrl'] = input.imageUrl === '' ? null : input.imageUrl;
  }
  if (input.parentId !== undefined) data['parentId'] = input.parentId;
  if (input.displayOrder !== undefined) data['displayOrder'] = input.displayOrder;
  if (input.isActive !== undefined) data['isActive'] = input.isActive;

  return prisma.category.update({
    where: { id },
    data,
  });
}

/**
 * Delete a category (ADMIN ONLY).
 *
 * Safety checks:
 * - Cannot delete if category has products (would orphan them)
 * - Cannot delete if category has child categories
 *
 * Admins must reassign or delete those first.
 * This prevents accidental data loss.
 */
export async function deleteCategory(id: string): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true, children: true },
      },
    },
  });

  if (!category) {
    throw new NotFoundError('Category');
  }

  if (category._count.products > 0) {
    throw new ConflictError(
      `Cannot delete category with ${category._count.products} product(s). Move or delete the products first.`
    );
  }

  if (category._count.children > 0) {
    throw new ConflictError(
      `Cannot delete category with ${category._count.children} subcategory(ies). Delete subcategories first.`
    );
  }

  await prisma.category.delete({
    where: { id },
  });
}

/**
 * Internal helper: Check if a category is a descendant of another.
 *
 * Walks UP from candidateId, checking if we hit ancestorId.
 * Limited to 10 levels deep to prevent infinite loops on bad data.
 *
 * Used to prevent circular references in the category tree.
 */
async function isDescendantOf(
  candidateId: string,
  ancestorId: string
): Promise<boolean> {
  let currentId: string | null = candidateId;
  let depth = 0;
  const maxDepth = 10;

  while (currentId && depth < maxDepth) {
    if (currentId === ancestorId) {
      return true;
    }

    const current: { parentId: string | null } | null =
      await prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

    if (!current) break;
    currentId = current.parentId;
    depth++;
  }

  return false;
}