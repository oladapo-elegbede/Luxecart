import { api } from '@/lib/api-client';
import type {
  ApiSuccessResponse,
  Order,
  OrderStatus,
  PaginationMeta,
} from '@/types';

/**
 * Orders API Helpers.
 *
 * All endpoints require authentication.
 * Customers only see and manage their own orders.
 */

export interface CreateOrderInput {
  shippingAddressId: string;
  notes?: string;
}

export interface ListOrdersParams {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: PaginationMeta;
}

/**
 * Create a new order from the user's cart.
 *
 * Triggers the full transactional purchase flow on backend:
 *   - Validates cart and stock
 *   - Snapshots product + address data
 *   - Calculates totals
 *   - Decrements stock
 *   - Clears cart
 *   - Returns full order
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { data } = await api.post<ApiSuccessResponse<{ order: Order }>>(
    '/orders',
    input
  );
  return data.data.order;
}

/**
 * List the current user's orders.
 *
 * Supports pagination and status filtering.
 */
export async function listOrders(
  params: ListOrdersParams = {}
): Promise<OrdersResponse> {
  const { data } = await api.get<ApiSuccessResponse<{ orders: Order[] }>>(
    '/orders',
    { params }
  );

  return {
    orders: data.data.orders,
    pagination: data.pagination!,
  };
}

/**
 * Get a specific order by ID.
 *
 * Returns full order with items and payment info.
 */
export async function getOrder(orderId: string): Promise<Order> {
  const { data } = await api.get<ApiSuccessResponse<{ order: Order }>>(
    `/orders/${orderId}`
  );
  return data.data.order;
}

/**
 * Cancel a PENDING order.
 *
 * Only orders in PENDING status can be cancelled by the customer.
 * Restores stock on cancellation.
 */
export async function cancelOrder(orderId: string): Promise<Order> {
  const { data } = await api.patch<ApiSuccessResponse<{ order: Order }>>(
    `/orders/${orderId}/cancel`
  );
  return data.data.order;
}