"use client";
export const dynamic = 'force-dynamic';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

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
import { listCategories } from '@/lib/api/categories';
import type { ListProductsParams } from '@/lib/api/products';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name_asc', label: 'Name: A to Z' },
] as const;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const category = searchParams.get('category') ?? undefined;
  const sortBy = (searchParams.get('sortBy') ?? 'newest') as ListProductsParams['sortBy'];
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = 12;

  const { data, isLoading } = useQuery({
    queryKey: ['products', { category, sortBy, page, limit }],
    queryFn: () => listProducts({ category, sortBy, page, limit }),
    staleTime: 60 * 1000,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', 'top-level'],
    queryFn: () => listCategories({ parent: 'null', activeOnly: true }),
    staleTime: 10 * 60 * 1000,
  });

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    if (!('page' in updates)) {
      params.delete('page');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {category
              ? categories?.find((c) => c.slug === category)?.name ?? 'Products'
              : 'All Products'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {data ? `${data.pagination.total} products` : 'Loading...'}
          </p>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          {/* SIDEBAR */}
          <aside className="space-y-6">
            <div>
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Categories
              </h2>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => updateParams({ category: null })}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !category
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'hover:bg-muted'
                    }`}
                  >
                    All Categories
                  </button>
                </li>
                {categories?.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => updateParams({ category: cat.slug })}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        category === cat.slug
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* MAIN */}
          <div className="space-y-6">
            {/* Sort bar */}
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground hidden sm:block">
                Showing {data?.products.length ?? 0} of {data?.pagination.total ?? 0} results
              </p>
              <Select
                value={sortBy}
                onValueChange={(value) => updateParams({ sortBy: value })}
              >
                <SelectTrigger className="w-full sm:w-50">
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

            {/* Products grid */}
            <ProductGrid
              products={data?.products}
              isLoading={isLoading}
              emptyMessage={
                category
                  ? 'No products in this category yet.'
                  : 'No products available.'
              }
            />

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!data.pagination.hasPrev}
                  onClick={() => updateParams({ page: String(page - 1) })}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm font-medium px-4">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={!data.pagination.hasNext}
                  onClick={() => updateParams({ page: String(page + 1) })}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}