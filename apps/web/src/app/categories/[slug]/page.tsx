'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon, Home } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductGrid } from '@/components/products/product-grid';
import { Footer } from '@/components/common/footer';
import { listProducts } from '@/lib/api/products';
import { getCategoryBySlug } from '@/lib/api/categories';
import type { ListProductsParams } from '@/lib/api/products';

/**
 * Category Landing Page.
 *
 * Dynamic route: /categories/[slug]
 *
 * Examples:
 *   /categories/electronics
 *   /categories/fashion
 *   /categories/home-living
 *
 * LAYOUT:
 *   ┌─────────────────────────────────────────┐
 *   │  🏠 Home > Categories > Electronics     │  ← breadcrumb
 *   ├─────────────────────────────────────────┤
 *   │  Electronics                            │  ← name + description banner
 *   │  Find the latest tech and gadgets...    │
 *   ├─────────────────────────────────────────┤
 *   │  [Subcategory chips if any]             │
 *   ├─────────────────────────────────────────┤
 *   │  [Sort dropdown]                        │
 *   │  [Product Grid]                         │
 *   │  [Pagination]                           │
 *   └─────────────────────────────────────────┘
 *
 * BEHAVIOR:
 *   - Fetches category metadata by slug
 *   - Fetches products filtered by that category slug
 *   - Shows 404-style page if category doesn't exist
 *   - Subcategories shown as clickable chips for drill-down
 */

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name_asc', label: 'Name: A to Z' },
] as const;

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const slug = params.slug;
  const sortBy = (searchParams.get('sortBy') ?? 'newest') as ListProductsParams['sortBy'];
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = 12;

  // ─── Fetch the category (name, description, subcategories) ───
  const {
    data: category,
    isLoading: isLoadingCategory,
    isError: isCategoryError,
  } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => getCategoryBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes — categories rarely change
    retry: false, // Don't retry on 404
  });

  // ─── Fetch products in this category ─────────────────────────
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', { category: slug, sortBy, page, limit }],
    queryFn: () => listProducts({ category: slug, sortBy, page, limit }),
    enabled: !!slug,
    staleTime: 60 * 1000,
  });

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    // Reset to page 1 when changing filters (except when explicitly setting page)
    if (!('page' in updates)) {
      next.delete('page');
    }
    router.push(`${pathname}?${next.toString()}`);
  };

  // ─── Category doesn't exist → friendly 404 ───────────────────
  if (isCategoryError) {
    return (
      <>
        <div className="container mx-auto px-4 py-24 text-center max-w-md">
          <h1 className="text-3xl font-bold mb-2">Category not found</h1>
          <p className="text-muted-foreground mb-6">
            We could not find a category called{' '}
            <span className="font-mono font-semibold">{slug}</span>.
          </p>
          <Button asChild>
            <Link href="/products">Browse all products</Link>
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* ─── Breadcrumb ─────────────────────────────────────── */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6"
        >
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
          <ChevronRightIcon className="h-3.5 w-3.5" />
          <Link
            href="/products"
            className="hover:text-foreground transition-colors"
          >
            Products
          </Link>
          <ChevronRightIcon className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">
            {category?.name ?? slug}
          </span>
        </nav>

        {/* ─── Category Banner ────────────────────────────────── */}
        <div className="mb-8 pb-6 border-b">
          {isLoadingCategory ? (
            <div className="space-y-3">
              <div className="h-9 w-64 bg-muted rounded animate-pulse" />
              <div className="h-5 w-96 max-w-full bg-muted rounded animate-pulse" />
            </div>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {category?.name}
              </h1>
              {category?.description && (
                <p className="text-muted-foreground mt-2 max-w-2xl">
                  {category.description}
                </p>
              )}
              {productsData && (
                <p className="text-sm text-muted-foreground mt-3">
                  {productsData.pagination.total}{' '}
                  {productsData.pagination.total === 1 ? 'product' : 'products'}
                </p>
              )}
            </>
          )}
        </div>

        {/* ─── Subcategories (if any) ─────────────────────────── */}
        {category?.children && category.children.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Browse subcategories
            </h2>
            <div className="flex flex-wrap gap-2">
              {category.children.map((child) => (
                <Button
                  key={child.id}
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/categories/${child.slug}`}>{child.name}</Link>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Sort Bar ───────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <p className="text-sm text-muted-foreground hidden sm:block">
            Showing {productsData?.products.length ?? 0} of{' '}
            {productsData?.pagination.total ?? 0} results
          </p>
          <Select
            value={sortBy}
            onValueChange={(value) => updateParams({ sortBy: value })}
          >
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ─── Product Grid ───────────────────────────────────── */}
        <ProductGrid
          products={productsData?.products}
          isLoading={isLoadingProducts}
          emptyMessage={`No products in ${category?.name ?? 'this category'} yet. Check back soon!`}
        />

        {/* ─── Pagination ─────────────────────────────────────── */}
        {productsData && productsData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-8">
            <Button
              variant="outline"
              size="icon"
              disabled={!productsData.pagination.hasPrev}
              onClick={() => updateParams({ page: String(page - 1) })}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm font-medium px-4">
              Page {productsData.pagination.page} of{' '}
              {productsData.pagination.totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              disabled={!productsData.pagination.hasNext}
              onClick={() => updateParams({ page: String(page + 1) })}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}