import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/HttpError';
import { sendSuccess } from '../../shared/helpers/response';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  categorySlugSchema,
  listCategoriesQuerySchema,
} from './categories.validator';
import {
  listCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categories.service';

/**
 * Categories Controller.
 *
 * Thin HTTP layer for category operations.
 *
 * PUBLIC endpoints (no middleware):
 *   - listAllCategories
 *   - getOneCategory
 *
 * ADMIN endpoints (auth + authorize middleware in routes):
 *   - createNewCategory
 *   - updateExistingCategory
 *   - deleteExistingCategory
 */

/**
 * GET /api/v1/categories
 * Public endpoint. List categories with optional filtering.
 *
 * Query params:
 *   ?parent=null         → top-level categories only
 *   ?parent=<uuid>       → children of a specific category
 *   ?activeOnly=false    → include archived (default: true)
 */
export async function listAllCategories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = listCategoriesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Invalid query parameters', errors);
    }

    const categories = await listCategories(parsed.data);

    sendSuccess(res, {
      message: 'Categories retrieved successfully',
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/categories/:slug
 * Public endpoint. Get a category by its URL slug.
 * Returns the category, its children, and product count.
 */
export async function getOneCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = categorySlugSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid category slug');
    }

    const category = await getCategoryBySlug(parsed.data.slug);

    sendSuccess(res, {
      message: 'Category retrieved successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/categories
 * ADMIN ONLY. Create a new category.
 */
export async function createNewCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    const category = await createCategory(parsed.data);

    sendSuccess(res, {
      message: 'Category created successfully',
      statusCode: 201,
      data: { category },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/categories/:id
 * ADMIN ONLY. Update an existing category.
 */
export async function updateExistingCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const paramParsed = categoryIdSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new ValidationError('Invalid category ID');
    }

    const bodyParsed = updateCategorySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      const errors = bodyParsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    const category = await updateCategory(paramParsed.data.id, bodyParsed.data);

    sendSuccess(res, {
      message: 'Category updated successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/categories/:id
 * ADMIN ONLY. Delete a category.
 * Will fail if category has products or children (prevents data loss).
 */
export async function deleteExistingCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = categoryIdSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid category ID');
    }

    await deleteCategory(parsed.data.id);

    sendSuccess(res, {
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}