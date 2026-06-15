import { z } from 'zod';

/**
 * Payments Module — Input Validation Schemas
 *
 * All incoming request data is validated against these Zod schemas
 * BEFORE it reaches the service layer. This guarantees that by the
 * time our business logic runs, the data shape is correct.
 *
 * WHY ZOD?
 * - Runtime validation (TypeScript only checks at compile time)
 * - Auto-generates TypeScript types from schemas (single source of truth)
 * - Clear, human-readable error messages
 */

/**
 * Schema: Create Payment Intent
 *
 * Used when a user is ready to pay for an order.
 * The frontend sends the orderId; we create a Stripe PaymentIntent
 * for that order's total amount.
 *
 * VALIDATION RULES:
 * - orderId must be a non-empty string (CUID format from Prisma)
 */
export const createPaymentIntentSchema = z.object({
  body: z.object({
    orderId: z
      .string({
        required_error: 'orderId is required',
        invalid_type_error: 'orderId must be a string',
      })
      .min(1, 'orderId cannot be empty'),
  }),
});

/**
 * Schema: Confirm Payment
 *
 * Used after Stripe.js confirms the card on the frontend.
 * The frontend sends back the paymentIntentId so we can verify
 * the payment status with Stripe and update the order.
 *
 * VALIDATION RULES:
 * - paymentIntentId must start with 'pi_' (Stripe's format)
 */
export const confirmPaymentSchema = z.object({
  body: z.object({
    paymentIntentId: z
      .string({
        required_error: 'paymentIntentId is required',
        invalid_type_error: 'paymentIntentId must be a string',
      })
      .min(1, 'paymentIntentId cannot be empty')
      .startsWith('pi_', 'paymentIntentId must be a valid Stripe Payment Intent ID'),
  }),
});

/**
 * TypeScript Types — auto-generated from schemas above.
 *
 * Use these in the service/controller for type-safe access:
 *   const { orderId } = req.body as CreatePaymentIntentInput['body'];
 */
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;