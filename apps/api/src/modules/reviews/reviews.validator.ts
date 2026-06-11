import { z } from 'zod';

/**
 * Reviews Validators.
 *
 * Reviews enforce these rules:
 *   - Rating MUST be integer 1-5
 *   - Title and body are optional (star-only reviews allowed)
 *   - One review per user per product (enforced by UNIQUE constraint)
 *   - Only verified purchasers can review (enforced in service)
 */

/**
 * Create review validator.
 *
 * Includes productId so we can reference the right product.
 * The service verifies the user purchased this product.
 */
export const createReviewSchema = z
  .object({
    productId: z.string().uuid('Invalid product ID'),

    rating: z
      .number()
      .int('Rating must be a whole number')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5'),

    title: z
      .string()
      .max(200, 'Title is too long')
      .trim()
      .optional()
      .or(z.literal('')),

    body: z
      .string()
      .max(2000, 'Review is too long')
      .trim()
      .optional()
      .or(z.literal('')),
  })
  .strict();

/**
 * Update review validator.
 *
 * Cannot change which product the review is for.
 * Can only update rating, title, body.
 */
export const updateReviewSchema = z
  .object({
    rating: z
      .number()
      .int('Rating must be a whole number')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5')
      .optional(),

    title: z
      .string()
      .max(200, 'Title is too long')
      .trim()
      .optional()
      .or(z.literal('')),

    body: z
      .string()
      .max(2000, 'Review is too long')
      .trim()
      .optional()
      .or(z.literal('')),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

/**
 * Review ID validator (for URL params).
 */
export const reviewIdSchema = z.object({
  id: z.string().uuid('Invalid review ID'),
});

/**
 * Product ID validator (for /reviews/product/:productId).
 */
export const productIdParamSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
});

/**
 * List reviews query validator.
 */
export const listReviewsQuerySchema = z.object({
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

  // Filter: only verified-purchase reviews
  verifiedOnly: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((val) => val === 'true'),

  // Sort
  sortBy: z
    .enum(['newest', 'oldest', 'highest', 'lowest', 'helpful'])
    .optional()
    .default('newest'),
});

/**
 * TypeScript types inferred from schemas.
 */
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;