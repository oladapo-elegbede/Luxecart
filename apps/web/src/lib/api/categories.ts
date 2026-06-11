import { api } from '@/lib/api-client';
import type {
  ApiSuccessResponse,
  Category,
  CategoryWithDetails,
} from '@/types';

/**
 * Categories API Helpers.
 *
 * Public endpoints:
 *   - listCategories
 *   - getCategoryBySlug
 */

export interface ListCategoriesParams {
  parent?: string; // 'null' for top-level, or parent UUID
  activeOnly?: boolean;
}

/**
 * List categories with optional filtering.
 *
 * Pass `parent: 'null'` to get only top-level categories.
 * Pass `parent: '<uuid>'` to get children of a specific category.
 */
export async function listCategories(
  params: ListCategoriesParams = {}
): Promise<Category[]> {
  const { data } = await api.get<ApiSuccessResponse<{ categories: Category[] }>>(
    '/categories',
    {
      params: {
        ...params,
        activeOnly:
          params.activeOnly !== undefined ? String(params.activeOnly) : undefined,
      },
    }
  );
  return data.data.categories;
}

/**
 * Get a single category by slug.
 *
 * Returns the category WITH its children and product count.
 * Used on category landing pages.
 */
export async function getCategoryBySlug(
  slug: string
): Promise<CategoryWithDetails> {
  const { data } = await api.get<
    ApiSuccessResponse<{ category: CategoryWithDetails }>
  >(`/categories/${slug}`);
  return data.data.category;
}