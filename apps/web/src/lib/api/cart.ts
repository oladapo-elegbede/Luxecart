import { api } from '@/lib/api-client';
import type { ApiSuccessResponse, Cart } from '@/types';

/**
 * Cart API Helpers.
 *
 * All endpoints require authentication.
 * Every mutation returns the FRESH cart so React Query can update instantly.
 */

export interface AddCartItemInput {
  productId: string;
  variantId?: string | null;
  quantity?: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

/**
 * Get the current user's cart with all items.
 *
 * Returns cart with computed subtotal and itemCount.
 */
export async function getCart(): Promise<Cart> {
  const { data } = await api.get<ApiSuccessResponse<{ cart: Cart }>>('/cart');
  return data.data.cart;
}

/**
 * Add an item to the cart.
 *
 * If the same (product, variant) is already in the cart,
 * the backend increments quantity instead of creating a duplicate.
 *
 * Returns the updated cart.
 */
export async function addCartItem(input: AddCartItemInput): Promise<Cart> {
  const { data } = await api.post<ApiSuccessResponse<{ cart: Cart }>>(
    '/cart/items',
    input
  );
  return data.data.cart;
}

/**
 * Update the quantity of an existing cart item.
 */
export async function updateCartItem(
  itemId: string,
  input: UpdateCartItemInput
): Promise<Cart> {
  const { data } = await api.patch<ApiSuccessResponse<{ cart: Cart }>>(
    `/cart/items/${itemId}`,
    input
  );
  return data.data.cart;
}

/**
 * Remove a single item from the cart.
 */
export async function removeCartItem(itemId: string): Promise<Cart> {
  const { data } = await api.delete<ApiSuccessResponse<{ cart: Cart }>>(
    `/cart/items/${itemId}`
  );
  return data.data.cart;
}

/**
 * Clear all items from the cart.
 */
export async function clearCart(): Promise<Cart> {
  const { data } = await api.delete<ApiSuccessResponse<{ cart: Cart }>>('/cart');
  return data.data.cart;
}