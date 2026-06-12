"use client";

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Package, Truck, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Footer } from '@/components/common/footer';
import { getOrder } from '@/lib/api/orders';

/**
 * Order Success Page.
 *
 * URL: /orders/[id]/success
 *
 * Shown after successful order placement.
 * Displays:
 *   - Animated success checkmark
 *   - Order number (prominent, copyable)
 *   - Shipping address confirmation
 *   - Item list with totals
 *   - "What's next" timeline
 *   - CTAs: Continue Shopping, View My Orders
 */

export default function OrderSuccessPage() {
  const params = useParams<{ id: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', params.id],
    queryFn: () => getOrder(params.id),
    enabled: !!params.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Button asChild className="mt-6">
          <Link href="/orders">My Orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 max-w-3xl">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40 mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Thank you for your order!
          </h1>
          <p className="text-muted-foreground mt-2">
            Your order has been placed successfully. We&apos;ll send you a confirmation email shortly.
          </p>
        </div>

        {/* Order number card */}
        <Card className="p-6 mb-6 text-center bg-muted/30">
          <p className="text-sm text-muted-foreground mb-1">Order Number</p>
          <p className="text-2xl font-bold tracking-wider font-mono">
            {order.orderNumber}
          </p>
        </Card>

        {/* Order details */}
        <Card className="p-6 space-y-6">
          {/* Shipping address */}
          <div>
            <h2 className="font-semibold mb-2">Shipping to</h2>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p className="text-foreground font-medium">
                {order.shippingFirstName} {order.shippingLastName}
              </p>
              <p>
                {order.shippingAddressLine1}
                {order.shippingAddressLine2 && <>, {order.shippingAddressLine2}</>}
              </p>
              <p>
                {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
              </p>
              <p>{order.shippingCountry}</p>
              {order.shippingPhone && <p>{order.shippingPhone}</p>}
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div>
            <h2 className="font-semibold mb-3">Items ordered</h2>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.productImage && (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-2">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.variantName}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Qty {item.quantity} × ${parseFloat(item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-medium whitespace-nowrap">
                    ${parseFloat(item.total).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${parseFloat(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {parseFloat(order.shippingCost) === 0
                  ? 'FREE'
                  : `$${parseFloat(order.shippingCost).toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>${parseFloat(order.tax).toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>${parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* What's next */}
        <Card className="p-6 mt-6">
          <h2 className="font-semibold mb-4">What happens next?</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Order processing</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll prepare your items for shipment within 1-2 business days.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Truck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Shipping notification</p>
                <p className="text-sm text-muted-foreground">
                  You&apos;ll receive tracking info via email when your order ships.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link href="/products">Continue Shopping</Link>
          </Button>
          <Button asChild size="lg" className="flex-1">
            <Link href={`/orders/${order.id}`}>View Order Details</Link>
          </Button>
        </div>
      </div>

      <Footer />
    </>
  );
}