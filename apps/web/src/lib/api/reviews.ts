import { api } from '@/lib/api-client';
import type {
  ApiSuccessResponse,
  PaginationMeta,
  Review,
} from '@/types';

/**
 * Reviews API Helpers.
 *
 * Public: list reviews for a product
 * Auth: create/update/delete your own reviews, list your own reviews
 */

export interface CreateReviewInput {
  productId: string;
  rating: number;
  title?: string;
  body?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  body?: string;
}

export interface ListReviewsParams {
  page?: number;
  limit?: number;
  verifiedOnly?: boolean;
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: PaginationMeta;
}

export async function listReviewsForProduct(
  productId: string,
  params: ListReviewsParams = {}
): Promise<ReviewsResponse> {
  const { data } = await api.get<ApiSuccessResponse<{ reviews: Review[] }>>(
    `/reviews/product/${productId}`,
    { params }
  );
  return {
    reviews: data.data.reviews,
    pagination: data.pagination!,
  };
}

export async function listMyReviews(
  params: ListReviewsParams = {}
): Promise<ReviewsResponse> {
  const { data } = await api.get<ApiSuccessResponse<{ reviews: Review[] }>>(
    '/reviews/me',
    { params }
  );
  return {
    reviews: data.data.reviews,
    pagination: data.pagination!,
  };
}

export async function createReview(input: CreateReviewInput): Promise<void> {
  await api.post('/reviews', input);
}

export async function updateReview(
  reviewId: string,
  input: UpdateReviewInput
): Promise<void> {
  await api.patch(`/reviews/${reviewId}`, input);
}

export async function deleteReview(reviewId: string): Promise<void> {
  await api.delete(`/reviews/${reviewId}`);
}