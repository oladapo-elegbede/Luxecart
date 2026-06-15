'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, Lock, CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getStripe } from '@/lib/stripe';
import { confirmPayment } from '@/lib/api/payments';
import { getErrorMessage } from '@/lib/api-client';

/**
 * Payment Form Component
 *
 * Wraps Stripe Elements for secure card collection and payment confirmation.
 *
 * ARCHITECTURE:
 *   <PaymentForm>             ← Public wrapper, sets up <Elements> provider
 *     <Elements>              ← Stripe context (Promise<Stripe>)
 *       <PaymentFormInner>    ← Actual form with useStripe()/useElements()
 *         <PaymentElement />  ← Stripe's secure card input
 *
 * WHY THIS SPLIT?
 * `useStripe()` and `useElements()` hooks must be called INSIDE the
 * <Elements> provider tree. We can't put them in the same component
 * as the provider itself.
 *
 * SECURITY:
 * Card details NEVER touch our server. Stripe.js encrypts them and
 * sends them directly to Stripe's PCI-compliant servers. We only
 * receive a token-like PaymentIntent ID for confirmation.
 */

interface PaymentFormProps {
  /** Stripe clientSecret returned from POST /payments/create-intent */
  clientSecret: string;
  /** Order ID — used to redirect to success page after payment */
  orderId: string;
  /** Payment Intent ID — sent to backend for verification */
  paymentIntentId: string;
  /** Total amount in dollars (for display on button) */
  amount: number;
}

/**
 * Public PaymentForm — sets up the Stripe Elements provider.
 *
 * Loads Stripe.js once and wraps the inner form with <Elements>.
 */
export function PaymentForm({
  clientSecret,
  orderId,
  paymentIntentId,
  amount,
}: PaymentFormProps) {
  const stripePromise = React.useMemo(() => getStripe(), []);

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0f172a',
            borderRadius: '8px',
          },
        },
      }}
    >
      <PaymentFormInner
        orderId={orderId}
        paymentIntentId={paymentIntentId}
        amount={amount}
      />
    </Elements>
  );
}

/**
 * Inner form — has access to Stripe hooks.
 *
 * FLOW:
 *   1. User enters card details in <PaymentElement>
 *   2. Clicks "Pay" button
 *   3. We call stripe.confirmPayment() — Stripe handles 3D Secure if needed
 *   4. On success: notify our backend → backend marks order PAID
 *   5. Redirect to /orders/[id]/success
 */
function PaymentFormInner({
  orderId,
  paymentIntentId,
  amount,
}: {
  orderId: string;
  paymentIntentId: string;
  amount: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [cardError, setCardError] = React.useState<string | null>(null);

  /**
   * Mutation to notify our backend that payment succeeded.
   * Backend re-verifies with Stripe and updates the order.
   */
  const confirmMutation = useMutation({
    mutationFn: confirmPayment,
    onSuccess: (order) => {
      toast.success(`Payment successful! Order ${order.orderNumber} confirmed.`);
      // Invalidate cached order so the success page shows fresh data
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      router.push(`/orders/${orderId}/success`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      setIsProcessing(false);
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js still loading — should never happen given button disabled state
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    // Step 1: Confirm payment with Stripe
    // This tokenizes the card, runs 3D Secure if needed, and processes the charge.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Stay on this page unless 3DS redirect is required
    });

    if (error) {
      // Card was declined, invalid, or other Stripe-side error
      const message = error.message ?? 'Payment failed. Please try again.';
      setCardError(message);
      toast.error(message);
      setIsProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Step 2: Notify our backend to mark order as PAID
      confirmMutation.mutate({ paymentIntentId });
    } else if (paymentIntent && paymentIntent.status === 'processing') {
      toast.info(
        'Your payment is being processed. We will email you when it completes.'
      );
      router.push(`/orders/${orderId}/success`);
    } else {
      // Unexpected state — show generic error
      setCardError('Payment did not complete. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CreditCard className="h-4 w-4" />
          Payment Details
        </div>

        <Separator />

        {/* Stripe's secure card input — handles cards, wallets, etc. */}
        <div className="min-h-[200px]">
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />
        </div>

        {cardError && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
            {cardError}
          </div>
        )}
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing payment…
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
        <Lock className="h-3 w-3" />
        Secured by Stripe — your card details never touch our servers.
      </p>
    </form>
  );
}