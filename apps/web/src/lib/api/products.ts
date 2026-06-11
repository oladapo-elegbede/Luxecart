import { api } from '@/lib/api-client';
import type {
  ApiSuccessResponse,
  PaginationMeta,
  Product,
} from '@/types';

/**
 * Products API Helpers.
 *
 * Public endpoints (no auth):
 *   - listProducts
 *   - getProductBySlug
 */

export interface ListProductsParams {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  sortBy?:
    | 'price_asc'
    | 'price_desc'
    | 'newest'
    | 'oldest'
    | 'popular'
    | 'rating'
    | 'name_asc'
    | 'name_desc';
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationMeta;
}

/**
 * List products with filters, search, sort, and pagination.
 *
 * All params optional — calling with no params returns the first page,
 * sorted by newest, of all ACTIVE products.
 */
export async function listProducts(
  params: ListProductsParams = {}
): Promise<ProductsResponse> {
  const { data } = await api.get<ApiSuccessResponse<{ products: Product[] }>>(
    '/products',
    { params }
  );

  return {
    products: data.data.products,
    pagination: data.pagination!,
  };
}

/**
 * Get a single product by its URL slug.
 *
 * Used on the product detail page.
 * Includes images, variants, and category info.
 */
export async function getProductBySlug(slug: string): Promise<Product> {
  const { data } = await api.get<ApiSuccessResponse<{ product: Product }>>(
    `/products/${slug}`
  );
  return data.data.product;
}