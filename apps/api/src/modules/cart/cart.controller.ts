import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/HttpError';
import { sendSuccess } from '../../shared/helpers/response';
import {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemIdSchema,
} from './cart.validator';
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from './cart.service';

/**
 * Cart Controller.
 *
 * All endpoints require authentication.
 * The cart belongs to the currently logged-in user (req.user.userId).
 */

/**
 * GET /api/v1/cart
 * Get the user's cart with all items, product info, and computed totals.
 */
export async function getMyCart(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const cart = await getCart(req.user.userId);

    sendSuccess(res, {
      message: 'Cart retrieved successfully',
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/cart/items
 * Add an item to the cart.
 *
 * If the same (product, variant) is already in the cart,
 * the quantity is incremented (no duplicate rows).
 */
export async function addToCart(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = addCartItemSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    await addItemToCart(req.user.userId, parsed.data);

    // Return the updated cart so frontend has fresh data
    const cart = await getCart(req.user.userId);

    sendSuccess(res, {
      message: 'Item added to cart successfully',
      statusCode: 201,
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/cart/items/:itemId
 * Update the quantity of an existing cart item.
 */
export async function updateMyCartItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const paramParsed = cartItemIdSchema.safeParse(req.params);
    if (!paramParsed.success) {
      throw new ValidationError('Invalid cart item ID');
    }

    const bodyParsed = updateCartItemSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      const errors = bodyParsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    await updateCartItem(
      req.user.userId,
      paramParsed.data.itemId,
      bodyParsed.data
    );

    const cart = await getCart(req.user.userId);

    sendSuccess(res, {
      message: 'Cart item updated successfully',
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/cart/items/:itemId
 * Remove a single item from the cart.
 */
export async function removeMyCartItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = cartItemIdSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError('Invalid cart item ID');
    }

    await removeCartItem(req.user.userId, parsed.data.itemId);

    const cart = await getCart(req.user.userId);

    sendSuccess(res, {
      message: 'Item removed from cart successfully',
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/cart
 * Clear all items from the cart.
 */
export async function clearMyCart(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    await clearCart(req.user.userId);

    const cart = await getCart(req.user.userId);

    sendSuccess(res, {
      message: 'Cart cleared successfully',
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
}