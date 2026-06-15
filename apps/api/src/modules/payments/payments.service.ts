import { prisma } from '../../config/database';
import {
  stripe,
  STRIPE_CURRENCY,
  dollarsToCents,
} from '../../config/stripe';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from '../../shared/errors/HttpError';

/**
 * Payments Service — Business Logic Layer
 *
 * STRIPE V22 TYPE WORKAROUND:
 * Stripe v22's main entry exports `StripeConstructor`, which doesn't
 * expose the namespace types (`PaymentIntent`, `Event`, etc.) at the
 * top level. We define minimal local types here for what we actually
 * use. The Stripe SDK runtime returns properly-shaped objects regardless.
 *
 * If you need full Stripe types later, see:
 *   apps/api/node_modules/stripe/cjs/stripe.core.d.ts (namespace Stripe)
 */

// ─── Local Stripe Type Aliases ────────────────────────────────
// Minimal shapes for the Stripe objects we actually touch.

interface StripePaymentIntent {
  id: string;
  status:
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'requires_capture'
    | 'canceled'
    | 'succeeded';
  client_secret: string | null;
  amount: number;
  currency: string;
  latest_charge?: string | { id: string } | null;
  last_payment_error?: { message?: string } | null;
}

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: StripePaymentIntent | unknown;
  };
}

// ─── Public Service Functions ─────────────────────────────────

export async function createPaymentIntent(
  userId: string,
  orderId: string
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true },
  });

  if (!order) throw new NotFoundError('Order');
  if (order.userId !== userId)
    throw new AuthorizationError('You do not have access to this order');
  if (order.paymentStatus === 'PAID')
    throw new ValidationError('This order has already been paid');
  if (order.status === 'CANCELLED')
    throw new ValidationError('Cannot pay for a cancelled order');

  const existingPendingPayment = order.payments.find(
    (p) => p.status === 'PENDING'
  );

  if (existingPendingPayment) {
    try {
      const existingIntent = (await stripe.paymentIntents.retrieve(
        existingPendingPayment.stripePaymentId
      )) as StripePaymentIntent;
      if (
        existingIntent.status === 'requires_payment_method' ||
        existingIntent.status === 'requires_confirmation' ||
        existingIntent.status === 'requires_action'
      ) {
        return {
          clientSecret: existingIntent.client_secret!,
          paymentIntentId: existingIntent.id,
        };
      }
    } catch {
      // fall through and create a new intent
    }
  }

  const paymentIntent = (await stripe.paymentIntents.create({
    amount: dollarsToCents(Number(order.total)),
    currency: STRIPE_CURRENCY,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      itemCount: order.items.length.toString(),
    },
    // Restrict to non-redirect payment methods (e.g. cards) so we can
    // confirm via API without needing a return_url. Klarna/Affirm/etc
    // require redirects and would block server-side confirmation flows.
    // When we add the frontend with Stripe Elements, we can revisit
    // this to enable more payment methods with proper return URLs.
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never',
    },
  })) as StripePaymentIntent;

  await prisma.payment.create({
    data: {
      orderId: order.id,
      stripePaymentId: paymentIntent.id,
      amount: order.total,
      currency: STRIPE_CURRENCY.toUpperCase(),
      status: 'PENDING',
    },
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

export async function confirmPayment(userId: string, paymentIntentId: string) {
  const paymentIntent = (await stripe.paymentIntents.retrieve(
    paymentIntentId
  )) as StripePaymentIntent;

  const payment = await prisma.payment.findUnique({
    where: { stripePaymentId: paymentIntentId },
    include: { order: true },
  });

  if (!payment) throw new NotFoundError('Payment');
  if (payment.order.userId !== userId)
    throw new AuthorizationError('You do not have access to this payment');

  if (paymentIntent.status === 'succeeded') {
    return await markOrderAsPaid(payment.orderId, paymentIntent);
  }

  if (paymentIntent.status === 'processing') {
    return payment.order;
  }

  await markPaymentAsFailed(
    paymentIntent.id,
    paymentIntent.last_payment_error?.message ??
      `Status: ${paymentIntent.status}`
  );

  throw new ValidationError(
    `Payment ${paymentIntent.status}. Please try again.`
  );
}

export async function handleWebhookEvent(event: StripeEvent): Promise<void> {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as StripePaymentIntent;
      await handlePaymentSucceeded(paymentIntent);
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as StripePaymentIntent;
      await handlePaymentFailed(paymentIntent);
      break;
    }
    case 'payment_intent.canceled': {
      const paymentIntent = event.data.object as StripePaymentIntent;
      await handlePaymentFailed(paymentIntent);
      break;
    }
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }
}

// ─── INTERNAL HELPERS ──────────────────────────────────────────

async function markOrderAsPaid(
  orderId: string,
  paymentIntent: StripePaymentIntent
) {
  const charge = paymentIntent.latest_charge;
  let last4: string | null = null;
  let cardBrand: string | null = null;
  let paymentMethod: string | null = null;

  if (typeof charge === 'string') {
    try {
      const chargeObj = (await stripe.charges.retrieve(charge)) as {
        payment_method_details?: {
          card?: { last4?: string; brand?: string };
          type?: string;
        };
      };
      last4 = chargeObj.payment_method_details?.card?.last4 ?? null;
      cardBrand = chargeObj.payment_method_details?.card?.brand ?? null;
      paymentMethod = chargeObj.payment_method_details?.type ?? null;
    } catch {
      // card details are nice-to-have, not critical
    }
  }

  const [, updatedOrder] = await prisma.$transaction([
    prisma.payment.update({
      where: { stripePaymentId: paymentIntent.id },
      data: {
        status: 'SUCCEEDED',
        last4,
        cardBrand,
        paymentMethod,
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        status: 'PROCESSING',
      },
    }),
  ]);

  return updatedOrder;
}

async function markPaymentAsFailed(
  stripePaymentId: string,
  reason: string
): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentId },
  });
  if (!payment) return;

  await prisma.$transaction([
    prisma.payment.update({
      where: { stripePaymentId },
      data: { status: 'FAILED', failureReason: reason },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: 'FAILED' },
    }),
  ]);
}

async function handlePaymentSucceeded(
  paymentIntent: StripePaymentIntent
): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentId: paymentIntent.id },
  });
  if (!payment) {
    console.warn(
      `[Stripe Webhook] No payment record for PaymentIntent ${paymentIntent.id}`
    );
    return;
  }
  if (payment.status === 'SUCCEEDED') return;
  await markOrderAsPaid(payment.orderId, paymentIntent);
}

async function handlePaymentFailed(
  paymentIntent: StripePaymentIntent
): Promise<void> {
  const reason =
    paymentIntent.last_payment_error?.message ??
    `Payment ${paymentIntent.status}`;
  await markPaymentAsFailed(paymentIntent.id, reason);
}

// Export types so controller can use them too
export type { StripeEvent, StripePaymentIntent };