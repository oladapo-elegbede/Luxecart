import Stripe from 'stripe';
import { env } from './env';

/**
 * Stripe Client Singleton.
 *
 * Centralized Stripe SDK instance configured with our secret key.
 *
 * USAGE:
 *   import { stripe } from '@/config/stripe';
 *   const intent = await stripe.paymentIntents.create({...});
 *
 * WHY A SINGLETON?
 * Stripe maintains an internal connection pool to their API.
 * Creating multiple instances wastes resources.
 *
 * API VERSION:
 * We let the SDK use its bundled default API version, which always
 * matches the SDK version we installed. This avoids version mismatch
 * errors during upgrades.
 *
 * WHY DEFAULT IMPORT (`import Stripe from 'stripe'`)?
 * The Stripe SDK uses TypeScript "declaration merging" — the default
 * export is BOTH a class (for `new Stripe(...)`) AND a namespace
 * (for `Stripe.PaymentIntent`, `Stripe.Event`, etc.). The named
 * import `{ Stripe }` only gives the type, breaking `new Stripe()`.
 *
 * TYPE ANNOTATION:
 * We use `InstanceType<typeof Stripe>` because `Stripe` is a class
 * constructor, not a usable type alias directly. This pattern gives
 * TypeScript a portable named reference for declaration files.
 */
export const stripe: InstanceType<typeof Stripe> = new Stripe(
  env.STRIPE_SECRET_KEY,
  {
    typescript: true,
    appInfo: {
      name: 'LuxeCart',
      version: '0.0.1',
    },
  }
);

/**
 * Currency we use for all transactions.
 * Stripe represents money in the smallest unit (cents for USD).
 */
export const STRIPE_CURRENCY = 'usd';

/**
 * Convert a dollar amount to cents.
 * Stripe API works in cents (integers).
 *
 * Example: dollarsToCents(19.99) → 1999
 */
export function dollarsToCents(dollars: number | string): number {
  const amount = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
  return Math.round(amount * 100);
}

/**
 * Convert cents back to dollars for display.
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}