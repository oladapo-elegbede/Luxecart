'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  getCart,
  updateCartItem,
  removeCartItem,
} from '@/lib/api/cart';
import { getErrorMessage } from '@/lib/api-client';
import type { CartItem } from '@/types';

/**
 * Cart Drawer.
 *
 * Slide-out drawer triggered by clicking the cart icon in the navbar.
 *
 * Features:
 *   - Lists all cart items with images
 *   - Quantity controls (with stock validation)
 *   - Remove item button
 *   - Order summary (subtotal)
 *   - Checkout CTA
 *   - Empty state with shop CTA
 *
 * ACCESSIBILITY:
 *   - SheetTitle announces "Shopping Cart" to screen readers
 *   - SheetDescription (visually hidden via sr-only) provides context
 *     about what users can do in the drawer. This satisfies WCAG and
 *     removes the Radix UI "missing description" console warning.
 */

export function CartDrawer() {
  const isOpen = useUIStore((state) => state.isCartOpen);
  const closeCart = useUIStore((state) => state.closeCart);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: isAuthenticated && isOpen,
    staleTime: 30 * 1000,
  });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart
            {cart && cart.itemCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Review the items in your shopping cart, adjust quantities, or
            proceed to checkout.
          </SheetDescription>
        </SheetHeader>

        {/* Not logged in */}
        {!isAuthenticated && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-semibold">Sign in to view your cart</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your cart is saved across devices when you sign in.
              </p>
            </div>
            <Button asChild onClick={closeCart}>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        )}

        {/* Loading */}
        {isAuthenticated && isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty cart */}
        {isAuthenticated && !isLoading && cart && cart.items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-semibold">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">
                Browse products and add items to get started.
              </p>
            </div>
            <Button asChild onClick={closeCart}>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        )}

        {/* Cart items */}
        {isAuthenticated && cart && cart.items.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cart.items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>

            <SheetFooter className="border-t px-6 py-4 flex-col gap-3">
              <div className="flex items-center justify-between w-full">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-2xl font-bold">${cart.subtotal}</span>
              </div>
              <p className="text-xs text-muted-foreground text-left w-full">
                Shipping, taxes, and discounts calculated at checkout.
              </p>
              <Button asChild size="lg" className="w-full" onClick={closeCart}>
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={closeCart}
                asChild
              >
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Individual cart item row.
 */
function CartItemRow({ item }: { item: CartItem }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (quantity: number) =>
      updateCartItem(item.id, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const removeMutation = useMutation({
    mutationFn: () => removeCartItem(item.id),
    onSuccess: () => {
      toast.success('Item removed');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const imageUrl = item.product.images?.[0]?.url;
  const unitPrice =
    parseFloat(item.product.price) +
    (item.variant ? parseFloat(item.variant.priceModifier) : 0);
  const lineTotal = unitPrice * item.quantity;

  return (
    <div className="flex gap-3">
      {/* Image */}
      <Link
        href={`/products/${item.product.slug}`}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={item.product.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <Link
          href={`/products/${item.product.slug}`}
          className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors"
        >
          {item.product.name}
        </Link>
        <p className="text-sm font-semibold">${unitPrice.toFixed(2)}</p>

        {/* Quantity + Remove */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 border rounded-md">
            <button
              onClick={() => updateMutation.mutate(item.quantity - 1)}
              disabled={item.quantity <= 1 || updateMutation.isPending}
              className="p-1.5 hover:bg-muted disabled:opacity-50 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-2 text-sm font-medium tabular-nums min-w-6 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => updateMutation.mutate(item.quantity + 1)}
              disabled={
                item.quantity >= item.product.stock ||
                updateMutation.isPending
              }
              className="p-1.5 hover:bg-muted disabled:opacity-50 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <button
            onClick={() => removeMutation.mutate()}
            disabled={removeMutation.isPending}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            aria-label="Remove item"
          >
            {removeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Line total */}
      <div className="text-sm font-semibold whitespace-nowrap">
        ${lineTotal.toFixed(2)}
      </div>
    </div>
  );
}