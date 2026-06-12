"use client";

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Loader2,
  ShoppingBag,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/common/footer';
import { useAuthStore } from '@/stores/auth-store';
import {
  getWishlist,
  removeWishlistItem,
  clearWishlist,
} from '@/lib/api/wishlist';
import { addCartItem } from '@/lib/api/cart';
import { getErrorMessage } from '@/lib/api-client';
import { useUIStore } from '@/stores/ui-store';

/**
 * Wishlist Page (/wishlist).
 *
 * Shows products the user has saved for later.
 * Each item can be:
 *   - Viewed (click → product detail page)
 *   - Moved to cart (with stock check)
 *   - Removed from wishlist
 *
 * Header has "Clear All" button for bulk removal.
 */

export default function WishlistPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const openCart = useUIStore((state) => state.openCart);

  React.useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login?redirect=/wishlist');
    }
  }, [isHydrated, isAuthenticated, router]);

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    enabled: isAuthenticated,
  });

  const removeMutation = useMutation({
    mutationFn: removeWishlistItem,
    onSuccess: () => {
      toast.success('Removed from wishlist');
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const clearMutation = useMutation({
    mutationFn: clearWishlist,
    onSuccess: () => {
      toast.success('Wishlist cleared');
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const moveToCartMutation = useMutation({
    mutationFn: async ({ productId, itemId }: { productId: string; itemId: string }) => {
      await addCartItem({ productId, quantity: 1 });
      await removeWishlistItem(itemId);
    },
    onSuccess: () => {
      toast.success('Moved to cart');
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      openCart();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Heart className="h-7 w-7 fill-red-500 text-red-500" />
              My Wishlist
            </h1>
            <p className="text-muted-foreground mt-1">
              {wishlist?.itemCount ?? 0} {wishlist?.itemCount === 1 ? 'item' : 'items'} saved for later
            </p>
          </div>

          {wishlist && wishlist.items.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Clear all items from wishlist?')) {
                  clearMutation.mutate();
                }
              }}
              disabled={clearMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : wishlist && wishlist.items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist.items.map((item) => {
              const imageUrl = item.product.images?.[0]?.url;
              const isOnSale =
                item.product.compareAtPrice !== null &&
                parseFloat(item.product.compareAtPrice) > parseFloat(item.product.price);
              const isOutOfStock = item.product.stock === 0;

              return (
                <Card key={item.id} className="overflow-hidden flex flex-col">
                  {/* Image */}
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="relative aspect-square overflow-hidden bg-muted group"
                  >
                    {imageUrl && (
                      <Image
                        src={imageUrl}
                        alt={item.product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                          isOutOfStock ? 'opacity-60' : ''
                        }`}
                      />
                    )}

                    {isOutOfStock && (
                      <Badge
                        variant="secondary"
                        className="absolute left-3 top-3 font-bold bg-foreground text-background"
                      >
                        Out of Stock
                      </Badge>
                    )}
                    {isOnSale && !isOutOfStock && (
                      <Badge
                        variant="destructive"
                        className="absolute left-3 top-3 font-bold"
                      >
                        Sale
                      </Badge>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    {item.product.category && (
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        {item.product.category.name}
                      </p>
                    )}
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors"
                    >
                      {item.product.name}
                    </Link>

                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-bold">
                        ${parseFloat(item.product.price).toFixed(2)}
                      </span>
                      {isOnSale && item.product.compareAtPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          ${parseFloat(item.product.compareAtPrice).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Actions (push to bottom) */}
                    <div className="flex gap-2 mt-auto pt-4">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={
                          isOutOfStock || moveToCartMutation.isPending
                        }
                        onClick={() =>
                          moveToCartMutation.mutate({
                            productId: item.product.id,
                            itemId: item.id,
                          })
                        }
                      >
                        {moveToCartMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-1.5" />
                            Add to Cart
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeMutation.mutate(item.id)}
                        disabled={removeMutation.isPending}
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Your wishlist is empty</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Save items you love to find them easily later.
            </p>
            <Button asChild>
              <Link href="/products">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Browse Products
              </Link>
            </Button>
          </Card>
        )}
      </div>

      <Footer />
    </>
  );
}