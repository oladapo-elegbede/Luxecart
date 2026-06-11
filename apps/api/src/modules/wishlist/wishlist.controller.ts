import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/HttpError';
import { sendSuccess } from '../../shared/helpers/response';
import {
  addWishlistItemSchema,
  wishlistItemIdSchema,
} from './wishlist.validator';
import {
  getWishlist,
  addItemToWishlist,
  removeWishlistItem,
  clearWishlist,
} from './wishlist.service';

/**
 * Wishlist Controller.
 *
 * All endpoints require authentication.
 * Each user has exactly one wishlist (1:1 relationship).
 */

/**
 * GET /api/v1/wishlist
 * Get the user's wishlist with all items and product details.
 */
export async function getMyWishlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const wishlist = await getWishlist(req.user.userId);

    sendSuccess(res, {
      message: 'Wishlist retrieved successfully',
      data: { wishlist },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/wishlist/items
 * Add a product to the wishlist.
 *
 * Returns 409 Conflict if product is already in wishlist.
 */
export async function addToWishlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = addWishlistItemSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    await addItemToWishlist(req.user.userId, parsed.data);

    // Return updated wishlist
    const wishlist = await getWishlist(req.user.userId);

    sendSuccess(res, {
      message: 'Item added to wishlist successfully',
      statusCode: 201,
      data: { wishlist },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/wishlist/items/:itemId
 * Remove an item from the wishlist.
 */
export async function removeFromWishlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = wishlistItemIdSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid wishlist item ID');
    }

    await removeWishlistItem(req.user.userId, parsed.data.itemId);

    const wishlist = await getWishlist(req.user.userId);

    sendSuccess(res, {
      message: 'Item removed from wishlist successfully',
      data: { wishlist },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/wishlist
 * Clear all items from the wishlist.
 */
export async function clearMyWishlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    await clearWishlist(req.user.userId);

    const wishlist = await getWishlist(req.user.userId);

    sendSuccess(res, {
      message: 'Wishlist cleared successfully',
      data: { wishlist },
    });
  } catch (error) {
    next(error);
  }
}