import { loadStripe, type Stripe } from '@stripe/stripe-js';

/**
 * Stripe.js Client Singleton.
 *
 * Lazy-loads Stripe.js once and caches the Promise so subsequent
 * calls return the same instance.
 *
 * WHY A SINGLETON?
 * Stripe.js is ~10KB and loads asynchronously from Stripe's CDN.
 * Loading it multiple times wastes bandwidth and creates duplicate
 * Stripe instances in memory.
 *
 * WHY NEXT_PUBLIC_ PREFIX?
 * Next.js only exposes environment variables to the browser if they
 * start with NEXT_PUBLIC_. This is a safety feature so secrets don't
 * accidentally leak to client code.
 *
 * SAFETY NOTE:
 * The PUBLISHABLE key is designed to be exposed in browser code.
 * It can only create payment intents, not access account data.
 * The SECRET key (sk_) must NEVER appear in frontend code.
 *
 * USAGE:
 *   import { getStripe } from '@/lib/stripe';
 *   const stripe = await getStripe();
 */

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Returns a cached Stripe.js instance Promise.
 * First call triggers the load; subsequent calls return the cached Promise.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      throw new Error(
        'Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable. ' +
        'Add it to apps/web/.env.local and restart the dev server.'
      );
    }

    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
}