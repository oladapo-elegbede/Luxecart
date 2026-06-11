import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/HttpError';
import { sendSuccess } from '../../shared/helpers/response';
import {
  createReviewSchema,
  updateReviewSchema,
  reviewIdSchema,
  productIdParamSchema,
  listReviewsQuerySchema,
} from './reviews.validator';
import {
  listReviewsForProduct,
  listMyReviews,
  createReview,
  updateReview,
  deleteReview,
} from './reviews.service';

/**
 * Reviews Controller.
 *
 * PUBLIC endpoints (no auth):
 *   - listReviewsForProduct
 *
 * AUTHENTICATED endpoints:
 *   - listMyReviews
 *   - createNewReview
 *   - updateMyReview
 *   - deleteMyReview
 */

/**
 * GET /api/v1/reviews/product/:productId
 * PUBLIC. List all reviews for a product.
 */
export async function getProductReviews(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const paramParsed = productIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new ValidationError('Invalid product ID');
    }

    const queryParsed = listReviewsQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
      const errors = queryParsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Invalid query parameters', errors);
    }

    const result = await listReviewsForProduct(
      paramParsed.data.productId,
      queryParsed.data
    );

    sendSuccess(res, {
      message: 'Reviews retrieved successfully',
      data: { reviews: result.reviews },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/reviews/me
 * Get the current user's reviews.
 */
export async function getMyReviews(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = listReviewsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError('Invalid query parameters');
    }

    const result = await listMyReviews(req.user.userId, parsed.data);

    sendSuccess(res, {
      message: 'Your reviews retrieved successfully',
      data: { reviews: result.reviews },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/reviews
 * Create a new review.
 */
export async function createNewReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    await createReview(req.user.userId, parsed.data);

    sendSuccess(res, {
      message: 'Review created successfully',
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/reviews/:id
 * Update an existing review.
 */
export async function updateMyReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const paramParsed = reviewIdSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new ValidationError('Invalid review ID');
    }

    const bodyParsed = updateReviewSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      const errors = bodyParsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    await updateReview(
      req.user.userId,
      paramParsed.data.id,
      bodyParsed.data
    );

    sendSuccess(res, {
      message: 'Review updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/reviews/:id
 * Delete a review.
 */
export async function deleteMyReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = reviewIdSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid review ID');
    }

    await deleteReview(req.user.userId, parsed.data.id);

    sendSuccess(res, {
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}