"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/products/product-grid';
import { Footer } from '@/components/common/footer';
import { listProducts } from '@/lib/api/products';
import { listCategories } from '@/lib/api/categories';

/**
 * Landing Page (Home).
 *
 * Sections:
 *   1. Hero — big headline, CTA, trust badges
 *   2. Categories — visual tiles for top categories
 *   3. Featured Products — 8 newest products
 *   4. Trust Features — shipping, returns, security
 *   5. Footer
 */

export default function HomePage() {
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => listProducts({ limit: 8, sortBy: 'newest' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', 'top-level'],
    queryFn: () => listCategories({ parent: 'null', activeOnly: true }),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/30 dark:via-background dark:to-purple-950/30" />
        <div className="absolute top-20 -left-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 -right-20 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>New Collection · Premium Quality</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Premium Shopping,
              <br />
              <span className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Reimagined.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover curated premium products with world-class quality, fast shipping, and exceptional customer service.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button asChild size="lg" className="text-base px-8">
                <Link href="/products">
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8">
                <Link href="/categories/electronics">Browse Collections</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                  ))}
                </div>
                <span>4.9/5 from 10,000+ customers</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span>Free shipping over $100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Shop by Category</h2>
            <p className="text-muted-foreground mt-2">
              Find exactly what you&apos;re looking for
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoadingCategories
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-4/3 rounded-xl bg-muted animate-pulse" />
              ))
            : categories?.slice(0, 4).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="group relative overflow-hidden rounded-xl aspect-4/3 bg-muted"
                >
                  {cat.imageUrl && (
                    <Image
                      src={cat.imageUrl}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="text-white font-bold text-lg">{cat.name}</h3>
                    <p className="text-white/80 text-sm">Shop now →</p>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS SECTION */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 border-t border-border">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Featured Products</h2>
            <p className="text-muted-foreground mt-2">
              Handpicked items just for you
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:flex">
            <Link href="/products">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <ProductGrid
          products={productsData?.products}
          isLoading={isLoadingProducts}
        />

        <div className="flex justify-center mt-8 sm:hidden">
          <Button asChild variant="outline">
            <Link href="/products">
              View All Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* TRUST FEATURES SECTION */}
      <section className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Free Shipping</h3>
              <p className="text-sm text-muted-foreground">
                Free shipping on all orders over $100
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Secure Payment</h3>
              <p className="text-sm text-muted-foreground">
                Your payment info is processed securely
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <RotateCcw className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Easy Returns</h3>
              <p className="text-sm text-muted-foreground">
                30-day return policy, no questions asked
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}