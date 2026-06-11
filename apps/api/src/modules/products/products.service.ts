import { prisma } from '../../config/database';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../shared/errors/HttpError';
import { paginate } from '../../shared/helpers/response';
import type {
  ListProductsQuery,
  CreateProductInput,
  UpdateProductInput,
} from './products.validator';
import type { Prisma, Product } from '@prisma/client';

/**
 * Products Service.
 *
 * Handles the most complex queries in our system.
 *
 * PUBLIC FUNCTIONS (no auth):
 *   - listProducts        — Browsing/search with filters
 *   - getProductBySlug    — Product detail page
 *
 * ADMIN FUNCTIONS:
 *   - getProductById      — Admin view (sees DRAFT too)
 *   - createProduct
 *   - updateProduct
 *   - deleteProduct       — Soft delete (set status to ARCHIVED)
 */

/**
 * List products with filters, search, sort, and pagination.
 *
 * isAdmin parameter controls visibility:
 *   - Public callers: only see ACTIVE products
 *   - Admin callers: see all statuses (can override with ?status= filter)
 *
 * Returns products PLUS pagination metadata.
 */
export async function listProducts(
  query: ListProductsQuery,
  isAdmin: boolean = false
) {
  const { search, category, minPrice, maxPrice, minRating, inStock, status, sortBy, page, limit } = query;

  // ─────────────────────────────────────────
  // Build WHERE clause
  // ─────────────────────────────────────────
  const where: Prisma.ProductWhereInput = {};

  // Status filter
  if (isAdmin) {
    // Admin can filter by any status, or see all
    if (status) {
      where.status = status;
    }
  } else {
    // Public ONLY sees ACTIVE products
    where.status = 'ACTIVE';
  }

  // Search: case-insensitive match in name OR description
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Category filter (by slug, joined via relation)
  if (category) {
    where.category = { slug: category };
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // Rating filter (denormalized on products table)
  if (minRating !== undefined) {
    where.averageRating = { gte: minRating };
  }

  // In-stock filter
  if (inStock) {
    where.stock = { gt: 0 };
  }

  // ─────────────────────────────────────────
  // Build ORDER BY clause
  // ─────────────────────────────────────────
  const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
    switch (sortBy) {
      case 'price_asc':
        return { price: 'asc' };
      case 'price_desc':
        return { price: 'desc' };
      case 'oldest':
        return { createdAt: 'asc' };
      case 'popular':
        return { soldCount: 'desc' };
      case 'rating':
        return { averageRating: 'desc' };
      case 'name_asc':
        return { name: 'asc' };
      case 'name_desc':
        return { name: 'desc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  })();

  // ─────────────────────────────────────────
  // Execute queries (in parallel for speed)
  // ─────────────────────────────────────────
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { position: 'asc' },
          take: 1, // Only first image for list view
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: paginate({ total, page, limit }),
  };
}

/**
 * Get a single product by slug (public endpoint).
 *
 * Returns the FULL product details:
 *   - All images (ordered)
 *   - All variants
 *   - Category info
 *
 * Increments view count (fire-and-forget, no await).
 * Only returns ACTIVE products to public callers.
 */
export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      images: {
        orderBy: { position: 'asc' },
      },
      variants: {
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!product || product.status !== 'ACTIVE') {
    throw new NotFoundError('Product');
  }

  // Increment view count async (don't block response)
  prisma.product
    .update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch((err) => {
      console.error('Failed to increment view count:', err);
    });

  return product;
}

/**
 * Get a product by ID (admin only).
 *
 * Returns the product even if DRAFT or ARCHIVED.
 * Includes everything for admin editing screen.
 */
export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { position: 'asc' } },
      variants: { orderBy: { name: 'asc' } },
    },
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  return product;
}

/**
 * Create a new product (admin only).
 *
 * Validates:
 *   - Slug uniqueness
 *   - SKU uniqueness
 *   - Category exists
 */
export async function createProduct(
  input: CreateProductInput
): Promise<Product> {
  // Slug uniqueness check
  const existingSlug = await prisma.product.findUnique({
    where: { slug: input.slug },
  });
  if (existingSlug) {
    throw new ConflictError(`Product with slug "${input.slug}" already exists`);
  }

  // SKU uniqueness check
  const existingSku = await prisma.product.findUnique({
    where: { sku: input.sku },
  });
  if (existingSku) {
    throw new ConflictError(`Product with SKU "${input.sku}" already exists`);
  }

  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
  });
  if (!category) {
    throw new ValidationError('Category does not exist');
  }

  return prisma.product.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      shortDescription:
        input.shortDescription === '' ? null : input.shortDescription ?? null,
      sku: input.sku,
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? null,
      stock: input.stock,
      lowStockThreshold: input.lowStockThreshold,
      categoryId: input.categoryId,
      status: input.status,
      weight: input.weight ?? null,
      tags: input.tags,
    },
  });
}

/**
 * Update an existing product (admin only).
 *
 * Same uniqueness validation as create.
 * Returns the updated product.
 */
export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<Product> {
  // Verify product exists
  await getProductById(id);

  // If slug changed, check uniqueness
  if (input.slug !== undefined) {
    const existing = await prisma.product.findUnique({
      where: { slug: input.slug },
    });
    if (existing && existing.id !== id) {
      throw new ConflictError(
        `Product with slug "${input.slug}" already exists`
      );
    }
  }

  // If SKU changed, check uniqueness
  if (input.sku !== undefined) {
    const existing = await prisma.product.findUnique({
      where: { sku: input.sku },
    });
    if (existing && existing.id !== id) {
      throw new ConflictError(`Product with SKU "${input.sku}" already exists`);
    }
  }

  // If categoryId changed, verify it exists
  if (input.categoryId !== undefined) {
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) {
      throw new ValidationError('Category does not exist');
    }
  }

  // Build update data
  const data: Prisma.ProductUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.shortDescription !== undefined) {
    data.shortDescription =
      input.shortDescription === '' ? null : input.shortDescription;
  }
  if (input.sku !== undefined) data.sku = input.sku;
  if (input.price !== undefined) data.price = input.price;
  if (input.compareAtPrice !== undefined) {
    data.compareAtPrice = input.compareAtPrice;
  }
  if (input.stock !== undefined) data.stock = input.stock;
  if (input.lowStockThreshold !== undefined) {
    data.lowStockThreshold = input.lowStockThreshold;
  }
  if (input.categoryId !== undefined) {
    data.category = { connect: { id: input.categoryId } };
  }
  if (input.status !== undefined) data.status = input.status;
  if (input.weight !== undefined) data.weight = input.weight;
  if (input.tags !== undefined) data.tags = input.tags;

  return prisma.product.update({
    where: { id },
    data,
  });
}

/**
 * Soft delete a product (admin only).
 *
 * Sets status to ARCHIVED instead of actual deletion.
 * Why? Past orders still reference this product. True deletion would
 * break order history and reviews.
 *
 * To "undelete", admin updates status back to ACTIVE.
 */
export async function deleteProduct(id: string): Promise<void> {
  await getProductById(id); // verify exists

  await prisma.product.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  });
}