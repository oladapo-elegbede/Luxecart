import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from './product-card';
import type { Product } from '@/types';

/**
 * Product Grid.
 *
 * Responsive grid for displaying products.
 * Handles loading and empty states.
 *
 * Breakpoints:
 *   Mobile:  2 columns
 *   Tablet:  3 columns
 *   Desktop: 4 columns
 */

interface ProductGridProps {
  products?: Product[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  isLoading,
  emptyMessage = 'No products found',
}: ProductGridProps) {
  // Loading state — show skeleton cards
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    );
  }

  // Products grid
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

/**
 * Skeleton placeholder for a product card.
 * Matches the same layout/dimensions as ProductCard so there's no layout shift.
 */
function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}