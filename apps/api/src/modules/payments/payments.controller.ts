import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/errors/HttpError';
import { sendSuccess } from '../../shared/helpers/response';
import { env } from '../../config/env';
import { stripe } from '../../config/stripe';
import {
  createPaymentIntentSchema,
  confirmPaymentSchema,
} from './payments.validator';
import {
  createPaymentIntent,
  confirmPayment,
  handleWebhookEvent,
  type StripeEvent,
} from './payments.service';

/**
 * Payments Controller.
 *
 * Thin HTTP wrappers around the payments service.
 *
 * ENDPOINTS:
 * - POST /payments/create-intent  (auth required) — Start a payment
 * - POST /payments/confirm        (auth required) — Verify a payment
 * - POST /webhooks/stripe         (signature-verified) — Stripe → us
 *
 * SECURITY:
 * - User endpoints require JWT (handled by route middleware)
 * - Webhook endpoint is unauthenticated by JWT but signature-verified
 *   to ensure the request really came from Stripe.
 */

/**
 * POST /api/v1/payments/create-intent
 *
 * Creates a Stripe PaymentIntent for an order so the frontend can
 * collect card details and confirm payment with Stripe directly.
 *
 * REQUEST BODY:
 *   { orderId: string }
 *
 * RESPONSE:
 *   { clientSecret: string, paymentIntentId: string }
 *
 * The `clientSecret` is what the frontend's Stripe.js uses to
 * complete the payment.
 */
export async function createIntent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = createPaymentIntentSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Invalid payment request', errors);
    }

    const result = await createPaymentIntent(
      req.user.userId,
      parsed.data.body.orderId
    );

    sendSuccess(res, {
      message: 'Payment intent created successfully',
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/payments/confirm
 *
 * Called by the frontend after Stripe.js has confirmed the card.
 * We re-verify with Stripe and update the order to PAID/PROCESSING.
 *
 * REQUEST BODY:
 *   { paymentIntentId: string }
 *
 * RESPONSE:
 *   { order: Order }
 *
 * WHY DO WE RE-VERIFY?
 * Never trust the client. The frontend might be compromised or buggy.
 * We always ask Stripe directly for the source of truth.
 */
export async function confirmPaymentEndpoint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const parsed = confirmPaymentSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      const errors = parsed.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Invalid confirmation request', errors);
    }

    const order = await confirmPayment(
      req.user.userId,
      parsed.data.body.paymentIntentId
    );

    sendSuccess(res, {
      message: 'Payment confirmed successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/webhooks/stripe
 *
 * Receives async notifications from Stripe about payment events.
 *
 * CRITICAL REQUIREMENTS:
 * 1. The route must use express.raw() middleware (NOT json parser)
 *    because we need the exact raw body to verify the signature.
 * 2. The 'stripe-signature' header contains the HMAC signature.
 * 3. We use STRIPE_WEBHOOK_SECRET to verify it's really from Stripe.
 *
 * WHY NO JWT AUTH?
 * Stripe doesn't have a user account in our system. The signature
 * verification IS the authentication — it proves the request came
 * from Stripe and was not tampered with in transit.
 *
 * RESPONSE:
 * - 200 with { received: true } means "we got it, don't retry"
 * - 400 means "bad signature, you're not Stripe"
 * - Any other error → Stripe will retry the webhook automatically
 */
export async function stripeWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Missing stripe-signature header',
      });
      return;
    }

    let event: StripeEvent;
    try {
      // req.body must be the raw Buffer here (NOT parsed JSON).
      // express.raw() middleware on the route ensures this.
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      ) as unknown as StripeEvent;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Stripe Webhook] Signature verification failed: ${message}`);
      res.status(400).json({
        success: false,
        message: `Webhook signature verification failed: ${message}`,
      });
      return;
    }

    // Signature verified — process the event
    await handleWebhookEvent(event);

    // Acknowledge receipt so Stripe doesn't retry
    res.status(200).json({ received: true });
  } catch (error) {
    // Service-level error — let Stripe retry via 5xx response
    next(error);
  }
}