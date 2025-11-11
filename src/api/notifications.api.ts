import { apiClient } from './client'

export interface Notification {
  id: string
  type: 'deal' | 'contact' | 'message' | 'calendar' | 'system'
  title: string
  message: string
  read: boolean
  createdAt: Date
  link?: string
  metadata?: Record<string, any>
}

export const notificationsApi = {
  // GET /api/notifications
  getNotifications: (params?: {
    unread?: boolean
    type?: Notification['type']
  }) => apiClient.get<Notification[]>('/api/notifications', params),

  // DELETE /api/notifications/:id
  deleteNotification: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/notifications/${id}`),

  // PATCH /api/notifications/:notification_id/read
  markAsRead: (notificationId: string) =>
    apiClient.patch<Notification>(`/api/notifications/${notificationId}/read`, {}),

  // GET /api/notifications-unread-count
  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/api/notifications-unread-count'),
}

