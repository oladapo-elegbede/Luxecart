"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types';

/**
 * Product Card.
 *
 * Used in product grids (homepage, catalog, search results).
 *
 * Features:
 *   - Product image with hover zoom
 *   - Sale badge if compareAtPrice exists
 *   - Out-of-stock badge if stock === 0
 *   - Rating + review count
 *   - Price (with strikethrough original if on sale)
 *   - Category label
 *   - Click anywhere → goes to product detail page
 */
export function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.images?.[0]?.url ?? '/placeholder.svg';
  const isOnSale =
    product.compareAtPrice !== null &&
    parseFloat(product.compareAtPrice) > parseFloat(product.price);
  const isOutOfStock = product.stock === 0;

  // Calculate discount percentage
  const discountPercent =
    isOnSale && product.compareAtPrice
      ? Math.round(
          ((parseFloat(product.compareAtPrice) - parseFloat(product.price)) /
            parseFloat(product.compareAtPrice)) *
            100
        )
      : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:border-border/80"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={product.images?.[0]?.altText ?? product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
            isOutOfStock ? 'opacity-60' : ''
          }`}
        />

        {/* Sale badge */}
        {isOnSale && !isOutOfStock && (
          <Badge
            variant="destructive"
            className="absolute left-3 top-3 font-bold"
          >
            -{discountPercent}%
          </Badge>
        )}

        {/* Out of stock badge */}
        {isOutOfStock && (
          <Badge
            variant="secondary"
            className="absolute left-3 top-3 font-bold bg-foreground text-background"
          >
            Out of Stock
          </Badge>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        {/* Category */}
        {product.category && (
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {product.category.name}
          </p>
        )}

        {/* Name */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-foreground">
              {parseFloat(product.averageRating).toFixed(1)}
            </span>
            <span>({product.reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="font-bold text-base">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          {isOnSale && product.compareAtPrice && (
            <span className="text-xs text-muted-foreground line-through">
              ${parseFloat(product.compareAtPrice).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}