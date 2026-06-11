import { z } from 'zod';

/**
 * Wishlist Validators.
 *
 * Wishlist is simpler than cart:
 *   - No quantity (each product is just "wanted" once)
 *   - No variants (wishlist tracks the product as a whole)
 *   - No stock validation (can wishlist out-of-stock items)
 */

/**
 * Add item to wishlist validator.
 */
export const addWishlistItemSchema = z
  .object({
    productId: z.string().uuid('Invalid product ID'),
  })
  .strict();

/**
 * Wishlist item ID validator (for URL params).
 */
export const wishlistItemIdSchema = z.object({
  itemId: z.string().uuid('Invalid wishlist item ID'),
});

/**
 * TypeScript type inferred from the schema.
 */
export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>;