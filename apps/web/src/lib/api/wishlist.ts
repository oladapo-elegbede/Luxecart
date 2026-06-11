import { api } from '@/lib/api-client';
import type { ApiSuccessResponse, Wishlist } from '@/types';

/**
 * Wishlist API Helpers.
 *
 * All endpoints require authentication.
 * Backend prevents duplicates (returns 409).
 */

export interface AddWishlistItemInput {
  productId: string;
}

/**
 * Get the current user's wishlist with all items.
 */
export async function getWishlist(): Promise<Wishlist> {
  const { data } = await api.get<ApiSuccessResponse<{ wishlist: Wishlist }>>(
    '/wishlist'
  );
  return data.data.wishlist;
}

/**
 * Add a product to the wishlist.
 *
 * Returns 409 Conflict if the product is already in the wishlist.
 * The error message can be used to show "Already saved" to the user.
 */
export async function addWishlistItem(
  input: AddWishlistItemInput
): Promise<Wishlist> {
  const { data } = await api.post<ApiSuccessResponse<{ wishlist: Wishlist }>>(
    '/wishlist/items',
    input
  );
  return data.data.wishlist;
}

/**
 * Remove an item from the wishlist.
 */
export async function removeWishlistItem(itemId: string): Promise<Wishlist> {
  const { data } = await api.delete<ApiSuccessResponse<{ wishlist: Wishlist }>>(
    `/wishlist/items/${itemId}`
  );
  return data.data.wishlist;
}

/**
 * Clear all items from the wishlist.
 */
export async function clearWishlist(): Promise<Wishlist> {
  const { data } = await api.delete<ApiSuccessResponse<{ wishlist: Wishlist }>>(
    '/wishlist'
  );
  return data.data.wishlist;
}