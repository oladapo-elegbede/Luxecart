import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  createIntent,
  confirmPaymentEndpoint,
} from './payments.controller';

/**
 * Payments Routes.
 *
 * All routes prefixed with /payments in app.ts.
 * ALL routes here require authentication (the user must be logged in
 * to pay for an order).
 *
 * REST design:
 *   POST   /payments/create-intent   Create a Stripe PaymentIntent for an order
 *   POST   /payments/confirm         Verify payment + mark order as paid
 *
 * SEPARATE WEBHOOK ROUTE:
 * The Stripe webhook endpoint (POST /webhooks/stripe) is registered
 * directly in app.ts because it requires special raw-body middleware
 * for signature verification — it CANNOT use the standard express.json()
 * parser that the rest of our API uses.
 */

const router: ExpressRouter = Router();

/**
 * POST /api/v1/payments/create-intent
 *
 * Body: { orderId: string }
 * Returns: { clientSecret, paymentIntentId }
 *
 * Frontend uses the clientSecret with Stripe.js to collect card details.
 */
router.post('/create-intent', authenticate, createIntent);

/**
 * POST /api/v1/payments/confirm
 *
 * Body: { paymentIntentId: string }
 * Returns: { order }
 *
 * Called by frontend AFTER Stripe.js confirms the card.
 * We re-verify with Stripe and update the order status.
 */
router.post('/confirm', authenticate, confirmPaymentEndpoint);

export default router;