import { z } from 'zod';

/**
 * Admin Validators.
 *
 * All admin endpoints require ADMIN role.
 * Validators here handle:
 *   - Listing users with search and pagination
 *   - Listing orders with filters
 *   - Updating user status (suspend/unsuspend)
 *   - Updating order status (admin can change ANY status)
 */

/**
 * List users query validator.
 *
 * Admin can search by email or name + filter by role.
 */
export const listUsersQuerySchema = z.object({
  search: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(200)
    .trim()
    .optional(),

  role: z.enum(['CUSTOMER', 'ADMIN']).optional(),

  isSuspended: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .max(10000)
    .optional()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20),
});

/**
 * List orders query validator.
 *
 * Admin can filter by status, payment status, and user.
 */
export const listAllOrdersQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
    .optional(),

  paymentStatus: z
    .enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'])
    .optional(),

  userId: z.string().uuid().optional(),

  search: z
    .string()
    .min(1)
    .max(200)
    .trim()
    .optional(),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .max(10000)
    .optional()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20),
});

/**
 * Update user status validator (admin action).
 *
 * Admin can suspend or unsuspend a user.
 */
export const updateUserStatusSchema = z
  .object({
    isSuspended: z.boolean(),
  })
  .strict();

/**
 * Update order status validator (admin action).
 *
 * Admin can change order status (e.g., PENDING → PROCESSING → SHIPPED → DELIVERED).
 * Tracking number can be added when shipping.
 */
export const updateOrderStatusSchema = z
  .object({
    status: z.enum([
      'PENDING',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ]),

    trackingNumber: z
      .string()
      .max(100, 'Tracking number is too long')
      .trim()
      .optional()
      .or(z.literal('')),
  })
  .strict();

/**
 * User ID validator (for URL params).
 */
export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

/**
 * Order ID validator (for URL params).
 */
export const orderIdParamSchema = z.object({
  id: z.string().uuid('Invalid order ID'),
});

/**
 * TypeScript types inferred from schemas.
 */
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type ListAllOrdersQuery = z.infer<typeof listAllOrdersQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;