import { prisma } from '../../config/database';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
  ConflictError,
} from '../../shared/errors/HttpError';
import type { AddWishlistItemInput } from './wishlist.validator';

/**
 * Wishlist Service.
 *
 * Business logic for the wishlist (saved-for-later items).
 *
 * KEY BEHAVIORS:
 *   1. Auto-create wishlist if user doesn't have one
 *   2. Prevent duplicate products (UNIQUE constraint in schema)
 *   3. IDOR protection on item removal
 *   4. Items show full product info for UI display
 */

/**
 * Get user's wishlist with all items and product details.
 *
 * Creates an empty wishlist if the user doesn't have one yet.
 * Returns rich data: items with product info, image, category.
 */
export async function getWishlist(userId: string) {
  let wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { position: 'asc' },
                take: 1,
              },
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { position: 'asc' },
                  take: 1,
                },
                category: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  return {
    ...wishlist,
    itemCount: wishlist.items.length,
  };
}

/**
 * Add a product to the wishlist.
 *
 * Validation:
 *   1. Product must exist
 *   2. Product must not already be in wishlist (UNIQUE constraint)
 *
 * Unlike cart, we don't auto-merge — if duplicate, we throw a clear error
 * so the frontend can show "Already in wishlist".
 */
export async function addItemToWishlist(
  userId: string,
  input: AddWishlistItemInput
): Promise<void> {
  // 1. Verify product exists (status check is lenient — can wishlist anything)
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  if (product.status === 'ARCHIVED') {
    throw new ValidationError('This product is no longer available');
  }

  // 2. Get or create wishlist
  let wishlist = await prisma.wishlist.findUnique({
    where: { userId },
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId },
    });
  }

  // 3. Check for duplicate
  const existing = await prisma.wishlistItem.findFirst({
    where: {
      wishlistId: wishlist.id,
      productId: input.productId,
    },
  });

  if (existing) {
    throw new ConflictError('This product is already in your wishlist');
  }

  // 4. Add the item
  await prisma.wishlistItem.create({
    data: {
      wishlistId: wishlist.id,
      productId: input.productId,
    },
  });
}

/**
 * Remove a single item from the wishlist.
 *
 * IDOR-protected: only the wishlist owner can remove items.
 */
export async function removeWishlistItem(
  userId: string,
  itemId: string
): Promise<void> {
  const item = await prisma.wishlistItem.findUnique({
    where: { id: itemId },
    include: { wishlist: true },
  });

  if (!item) {
    throw new NotFoundError('Wishlist item');
  }

  if (item.wishlist.userId !== userId) {
    throw new AuthorizationError('This item is not in your wishlist');
  }

  await prisma.wishlistItem.delete({
    where: { id: itemId },
  });
}

/**
 * Clear all items from the user's wishlist.
 *
 * Does NOT delete the wishlist itself — just empties it.
 */
export async function clearWishlist(userId: string): Promise<void> {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
  });

  if (!wishlist) {
    return;
  }

  await prisma.wishlistItem.deleteMany({
    where: { wishlistId: wishlist.id },
  });
}