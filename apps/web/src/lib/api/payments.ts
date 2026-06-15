import { api } from '@/lib/api-client';
import type { ApiSuccessResponse, Order } from '@/types';

/**
 * Payments API Helpers.
 *
 * Functions for talking to the backend's /payments endpoints.
 * All endpoints require authentication.
 *
 * FLOW (high level):
 *   1. User clicks "Pay" on checkout
 *   2. Frontend calls createPaymentIntent(orderId) → gets clientSecret
 *   3. Stripe Elements collects card details
 *   4. Stripe.js confirms payment with clientSecret
 *   5. Frontend calls confirmPayment(paymentIntentId) → backend marks order PAID
 */

// ─── Types ──────────────────────────────────────────────────

export interface CreatePaymentIntentInput {
  orderId: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface ConfirmPaymentInput {
  paymentIntentId: string;
}

// ─── API Functions ──────────────────────────────────────────

/**
 * Create a Stripe PaymentIntent for an existing order.
 *
 * The returned `clientSecret` is used by Stripe.js to collect card
 * details and confirm the payment directly with Stripe's servers.
 *
 * Idempotent — calling this twice for the same order returns the
 * same intent if one is still pending.
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<CreatePaymentIntentResponse> {
  const { data } = await api.post<
    ApiSuccessResponse<CreatePaymentIntentResponse>
  >('/payments/create-intent', input);

  return data.data;
}

/**
 * Notify backend that a payment was confirmed via Stripe.
 *
 * Backend re-verifies with Stripe (never trusts the client) and
 * updates the order status to PAID + PROCESSING.
 *
 * Returns the updated order.
 */
export async function confirmPayment(
  input: ConfirmPaymentInput
): Promise<Order> {
  const { data } = await api.post<ApiSuccessResponse<{ order: Order }>>(
    '/payments/confirm',
    input
  );
  return data.data.order;
}