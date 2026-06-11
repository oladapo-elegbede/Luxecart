"use client";

import { useQuery } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { getCart } from '@/lib/api/cart';

/**
 * Cart Icon Button.
 *
 * Shows the cart icon with a badge displaying the total item count.
 * Clicking it opens the cart drawer (via UI store).
 *
 * BEHAVIOR:
 *   - Only fetches cart if user is logged in
 *   - Shows badge only when count > 0
 *   - Auto-refetches when cart changes (React Query handles this)
 */
export function CartIcon() {
  const openCart = useUIStore((state) => state.openCart);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds — cart changes often
  });

  const itemCount = cart?.itemCount ?? 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={openCart}
      aria-label={`Shopping cart with ${itemCount} item${itemCount === 1 ? '' : 's'}`}
      className="relative"
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span
          className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground tabular-nums"
          aria-hidden="true"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Button>
  );
}