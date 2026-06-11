import { z } from 'zod';

/**
 * Cart Validators.
 *
 * Cart operations are simple:
 *   - Add an item (productId + optional variantId + quantity)
 *   - Update quantity of an existing item
 *   - Remove an item by item ID
 *
 * variantId is optional because some products don't have variants
 * (e.g., a book doesn't come in sizes).
 */

/**
 * Add item to cart validator.
 *
 * If the same (productId, variantId) combination already exists,
 * we increment the quantity instead of creating a duplicate row.
 * The service handles that logic.
 */
export const addCartItemSchema = z
  .object({
    productId: z.string().uuid('Invalid product ID'),

    variantId: z.string().uuid('Invalid variant ID').optional().nullable(),

    quantity: z
      .number()
      .int('Quantity must be an integer')
      .min(1, 'Quantity must be at least 1')
      .max(999, 'Quantity cannot exceed 999')
      .optional()
      .default(1),
  })
  .strict();

/**
 * Update cart item quantity validator.
 *
 * Only quantity can be changed.
 * To change variant/product, remove the item and add a new one.
 */
export const updateCartItemSchema = z
  .object({
    quantity: z
      .number()
      .int('Quantity must be an integer')
      .min(1, 'Quantity must be at least 1')
      .max(999, 'Quantity cannot exceed 999'),
  })
  .strict();

/**
 * Cart item ID validator (for URL params).
 */
export const cartItemIdSchema = z.object({
  itemId: z.string().uuid('Invalid cart item ID'),
});

/**
 * TypeScript types inferred from schemas.
 */
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;