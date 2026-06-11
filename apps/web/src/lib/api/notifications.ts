import { api } from '@/lib/api-client';
import type {
  ApiSuccessResponse,
  Notification,
  NotificationType,
  PaginationMeta,
} from '@/types';

/**
 * Notifications API Helpers.
 *
 * All endpoints require authentication.
 * Notifications are CREATED by the backend (orders, admin actions).
 * Users can list, mark read, and delete them.
 */

export interface ListNotificationsParams {
  unreadOnly?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: PaginationMeta;
}

export async function listNotifications(
  params: ListNotificationsParams = {}
): Promise<NotificationsResponse> {
  const { data } = await api.get<
    ApiSuccessResponse<{ notifications: Notification[] }>
  >('/notifications', { params });
  return {
    notifications: data.data.notifications,
    pagination: data.pagination!,
  };
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<ApiSuccessResponse<{ count: number }>>(
    '/notifications/unread-count'
  );
  return data.data.count;
}

export async function markAsRead(notificationId: string): Promise<void> {
  await api.patch(`/notifications/${notificationId}/read`);
}

export async function markAllAsRead(): Promise<number> {
  const { data } = await api.patch<ApiSuccessResponse<{ count: number }>>(
    '/notifications/read-all'
  );
  return data.data.count;
}

export async function deleteNotification(
  notificationId: string
): Promise<void> {
  await api.delete(`/notifications/${notificationId}`);
}

export async function clearAllNotifications(): Promise<number> {
  const { data } = await api.delete<ApiSuccessResponse<{ count: number }>>(
    '/notifications'
  );
  return data.data.count;
}