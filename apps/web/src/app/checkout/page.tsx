"use client";

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  MapPin,
  ShoppingBag,
  Loader2,
  Plus,
  Check,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Footer } from '@/components/common/footer';
import { useAuthStore } from '@/stores/auth-store';
import { getCart } from '@/lib/api/cart';
import { listAddresses } from '@/lib/api/addresses';
import { createOrder } from '@/lib/api/orders';
import { getErrorMessage } from '@/lib/api-client';

/**
 * Checkout Page.
 *
 * Final step before placing an order.
 *
 * Layout (2 columns on desktop, stacked on mobile):
 *   LEFT: Shipping address selector + notes
 *   RIGHT: Order summary with item list and totals
 *
 * Bottom: Place Order button
 *
 * Flow:
 *   1. Validate cart is not empty
 *   2. User selects shipping address (or adds new one)
 *   3. User reviews items and totals
 *   4. Clicks Place Order
 *   5. Order created via backend → cart cleared → redirect to success page
 */

const SHIPPING_THRESHOLD = 100;
const FLAT_SHIPPING = 9.99;
const TAX_RATE = 0.08;

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState('');

  // Redirect if not authenticated
  React.useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [isHydrated, isAuthenticated, router]);

  // Fetch cart
  const { data: cart, isLoading: isLoadingCart } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: isAuthenticated,
  });

  // Fetch addresses
  const { data: addresses, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: listAddresses,
    enabled: isAuthenticated,
  });

  // Auto-select default address when addresses load
  React.useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  const placeOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      toast.success(`Order ${order.orderNumber} placed successfully!`);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      router.push(`/orders/${order.id}/success`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      toast.error('Please select a shipping address');
      return;
    }
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    placeOrderMutation.mutate({
      shippingAddressId: selectedAddressId,
      notes: notes.trim() || undefined,
    });
  };

  // Calculate totals (for display only — backend recalculates)
  const subtotal = cart ? parseFloat(cart.subtotal) : 0;
  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + shippingCost + tax).toFixed(2);

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty cart guard
  if (cart && cart.items.length === 0) {
    return (
      <>
        <div className="container mx-auto px-4 py-24 text-center max-w-md">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground mt-2">
            Add some products to your cart before checking out.
          </p>
          <Button asChild className="mt-6">
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* LEFT: Address + Notes */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/addresses">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add New
                  </Link>
                </Button>
              </div>

              {isLoadingAddresses ? (
                <Card className="p-6 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </Card>
              ) : addresses && addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((address) => {
                    const isSelected = selectedAddressId === address.id;
                    return (
                      <button
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-foreground/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">
                                {address.firstName} {address.lastName}
                              </p>
                              {address.isDefault && (
                                <Badge variant="secondary" className="text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {address.addressLine1}
                              {address.addressLine2 && <>, {address.addressLine2}</>}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {address.city}, {address.state} {address.postalCode}, {address.country}
                            </p>
                            {address.phone && (
                              <p className="text-sm text-muted-foreground">
                                {address.phone}
                              </p>
                            )}
                          </div>
                          <div
                            className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground/30'
                            }`}
                          >
                            {isSelected && (
                              <Check className="h-3 w-3 text-primary-foreground" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold mb-1">No addresses on file</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add a shipping address to continue.
                  </p>
                  <Button asChild>
                    <Link href="/addresses">Add Address</Link>
                  </Button>
                </Card>
              )}
            </div>

            {/* Order Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Order notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Special instructions, gift message, delivery preferences..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {notes.length}/1000
              </p>
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Order Summary</h2>

              {/* Items list */}
              {isLoadingCart ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart?.items.map((item) => {
                    const imageUrl = item.product.images?.[0]?.url;
                    const unitPrice =
                      parseFloat(item.product.price) +
                      (item.variant ? parseFloat(item.variant.priceModifier) : 0);
                    const lineTotal = unitPrice * item.quantity;
                    return (
                      <div key={item.id} className="flex gap-3 text-sm">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                          {imageUrl && (
                            <Image
                              src={imageUrl}
                              alt={item.product.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-2 leading-tight">
                            {item.product.name}
                          </p>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            Qty {item.quantity} × ${unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-medium whitespace-nowrap">
                          ${lineTotal.toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              <Separator />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600 dark:text-green-500 font-medium">
                        FREE
                      </span>
                    ) : (
                      `$${shippingCost.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {subtotal < SHIPPING_THRESHOLD && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Add ${(SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for free shipping
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex justify-between items-baseline">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold">${total.toFixed(2)}</span>
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={
                  !selectedAddressId ||
                  !cart ||
                  cart.items.length === 0 ||
                  placeOrderMutation.isPending
                }
                size="lg"
                className="w-full"
              >
                {placeOrderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing order…
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By placing your order, you agree to our terms of service.
              </p>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}