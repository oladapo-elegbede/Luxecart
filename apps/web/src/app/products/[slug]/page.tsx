"use client";
export const dynamic = 'force-dynamic';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Minus,
  Plus,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Footer } from '@/components/common/footer';
import { getProductBySlug } from '@/lib/api/products';
import { addCartItem } from '@/lib/api/cart';
import { addWishlistItem } from '@/lib/api/wishlist';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { getErrorMessage } from '@/lib/api-client';

/**
 * Product Detail Page.
 *
 * URL: /products/[slug]
 *
 * Features:
 *   - Image gallery (with thumbnails)
 *   - Price + sale display
 *   - Quantity selector
 *   - Add to Cart (with stock validation)
 *   - Add to Wishlist (auth required)
 *   - Stock indicator
 *   - Description tabs
 *   - Trust badges
 */

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const openCart = useUIStore((state) => state.openCart);

  const [selectedImageIdx, setSelectedImageIdx] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', params.slug],
    queryFn: () => getProductBySlug(params.slug),
    enabled: !!params.slug,
  });

  const addToCartMutation = useMutation({
    mutationFn: addCartItem,
    onSuccess: () => {
      toast.success('Added to cart');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      openCart();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const addToWishlistMutation = useMutation({
    mutationFn: addWishlistItem,
    onSuccess: () => {
      toast.success('Added to wishlist');
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="text-muted-foreground mt-2">
          The product you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Back to Products</Link>
        </Button>
      </div>
    );
  }

  const images = product.images ?? [];
  const currentImage = images[selectedImageIdx];
  const isOutOfStock = product.stock === 0;
  const isOnSale =
    product.compareAtPrice !== null &&
    parseFloat(product.compareAtPrice) > parseFloat(product.price);
  const discountPercent =
    isOnSale && product.compareAtPrice
      ? Math.round(
          ((parseFloat(product.compareAtPrice) - parseFloat(product.price)) /
            parseFloat(product.compareAtPrice)) *
            100
        )
      : 0;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to your cart');
      return;
    }
    addToCartMutation.mutate({ productId: product.id, quantity });
  };

  const handleAddToWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to your wishlist');
      return;
    }
    addToWishlistMutation.mutate({ productId: product.id });
  };

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/products" className="hover:text-foreground transition-colors">
            Products
          </Link>
          {product.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link
                href={`/products?category=${product.category.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* LEFT: Image Gallery */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
              {currentImage ? (
                <Image
                  src={currentImage.url}
                  alt={currentImage.altText ?? product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No image available
                </div>
              )}

              {isOnSale && !isOutOfStock && (
                <Badge
                  variant="destructive"
                  className="absolute left-4 top-4 font-bold text-base px-3 py-1.5"
                >
                  -{discountPercent}% OFF
                </Badge>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative aspect-square overflow-hidden rounded-lg bg-muted transition-all ${
                      idx === selectedImageIdx
                        ? 'ring-2 ring-primary ring-offset-2'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText ?? `${product.name} ${idx + 1}`}
                      fill
                      sizes="100px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Info */}
          <div className="space-y-6">
            {/* Category */}
            {product.category && (
              <Link
                href={`/products?category=${product.category.slug}`}
                className="text-xs uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
              >
                {product.category.name}
              </Link>
            )}

            {/* Name */}
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(parseFloat(product.averageRating))
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {parseFloat(product.averageRating).toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({product.reviewCount} review{product.reviewCount === 1 ? '' : 's'})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                ${parseFloat(product.price).toFixed(2)}
              </span>
              {isOnSale && product.compareAtPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  ${parseFloat(product.compareAtPrice).toFixed(2)}
                </span>
              )}
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-muted-foreground leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            <Separator />

            {/* Stock indicator */}
            <div className="flex items-center gap-2 text-sm">
              {isOutOfStock ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  <span className="font-medium text-destructive">Out of Stock</span>
                </>
              ) : product.stock < 10 ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="font-medium">
                    Only {product.stock} left in stock — order soon!
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="font-medium text-green-600 dark:text-green-500">
                    In Stock ({product.stock} available)
                  </span>
                </>
              )}
            </div>

            {/* Quantity selector */}
            {!isOutOfStock && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity === 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-16 text-center font-medium text-lg tabular-nums">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock || addToCartMutation.isPending}
                size="lg"
                className="flex-1"
              >
                {addToCartMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleAddToWishlist}
                disabled={addToWishlistMutation.isPending}
                aria-label="Add to wishlist"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center text-center gap-1.5">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Free shipping over $100</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Secure payment</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">30-day returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description section */}
        <div className="mt-16 max-w-4xl">
          <h2 className="text-2xl font-bold mb-4">About this product</h2>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-20 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}