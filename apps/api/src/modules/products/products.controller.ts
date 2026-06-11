import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/HttpError';
import { sendSuccess } from '../../shared/helpers/response';
import {
  listProductsQuerySchema,
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  productSlugSchema,
} from './products.validator';
import {
  listProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from './products.service';

/**
 * Products Controller.
 *
 * Public endpoints (no middleware): browsing, search
 * Admin endpoints (auth + authorize): create, update, delete
 */

/**
 * GET /api/v1/products
 * Public endpoint. List products with filters/search/sort/pagination.
 *
 * Visibility:
 *   - If logged in as ADMIN: sees all statuses
 *   - Otherwise: only ACTIVE products
 *
 * The auth middleware doesn't run on this route (it's public),
 * so req.user will be undefined for public callers.
 */
export async function listAllProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = listProductsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Invalid query parameters', errors);
    }

    // Note: req.user is undefined here (public route, no auth middleware)
    // Admin-specific filtering is handled by the /admin/products endpoint
    const result = await listProducts(parsed.data, false);

    sendSuccess(res, {
      message: 'Products retrieved successfully',
      data: { products: result.products },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/products/:slug
 * Public endpoint. Get full product details by slug.
 */
export async function getOneProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = productSlugSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid product slug');
    }

    const product = await getProductBySlug(parsed.data.slug);

    sendSuccess(res, {
      message: 'Product retrieved successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/products
 * ADMIN ONLY. Create a new product.
 */
export async function createNewProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    const product = await createProduct(parsed.data);

    sendSuccess(res, {
      message: 'Product created successfully',
      statusCode: 201,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/products/:id
 * ADMIN ONLY. Update a product.
 */
export async function updateExistingProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const paramParsed = productIdSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new ValidationError('Invalid product ID');
    }

    const bodyParsed = updateProductSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      const errors = bodyParsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    const product = await updateProduct(paramParsed.data.id, bodyParsed.data);

    sendSuccess(res, {
      message: 'Product updated successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/products/:id
 * ADMIN ONLY. Soft-delete a product (sets status to ARCHIVED).
 */
export async function deleteExistingProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = productIdSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid product ID');
    }

    await deleteProduct(parsed.data.id);

    sendSuccess(res, {
      message: 'Product archived successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/products/admin/:id
 * ADMIN ONLY. Get a product by ID (includes DRAFT and ARCHIVED).
 * Used by admin product edit screens.
 */
export async function getProductByIdAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = productIdSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid product ID');
    }

    const product = await getProductById(parsed.data.id);

    sendSuccess(res, {
      message: 'Product retrieved successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}