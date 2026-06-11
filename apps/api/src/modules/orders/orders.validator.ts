import { z } from 'zod';

/**
 * Orders Validators.
 *
 * Order creation needs:
 *   - shippingAddressId: Which saved address to ship to
 *   - notes: Optional customer notes
 *
 * We do NOT take the items in the request — we read them from the cart.
 * This prevents tampering (no submitting "100 items at $0.01 each").
 *
 * Tax, shipping cost, and totals are calculated server-side.
 * Never trust the client to send prices.
 */

/**
 * Create order validator.
 *
 * shippingAddressId references the user's saved addresses.
 * The service verifies the address belongs to the user (IDOR check).
 */
export const createOrderSchema = z
  .object({
    shippingAddressId: z.string().uuid('Invalid shipping address ID'),

    notes: z
      .string()
      .max(1000, 'Notes are too long')
      .trim()
      .optional()
      .or(z.literal('')),
  })
  .strict();

/**
 * Order ID validator (for URL params).
 */
export const orderIdSchema = z.object({
  id: z.string().uuid('Invalid order ID'),
});

/**
 * List orders query validator.
 *
 * Supports pagination and status filtering.
 */
export const listOrdersQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
    .optional(),

  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .max(10000)
    .optional()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(20),
});

/**
 * TypeScript types inferred from the schemas.
 */
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;