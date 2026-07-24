import { api } from "@/lib";

export interface NotificationItem {
  id: string;
  user_id: string;
  document_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  try {
    const res = await api.get<NotificationItem[]>("/api/notifications");
    return res.data || [];
  } catch (err) {
    console.warn("[getNotifications] Error fetching notifications", err);
    return [];
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const res = await api.get<{ count: number }>("/api/notifications/unread-count");
    return res.data?.count || 0;
  } catch (err) {
    return 0;
  }
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    const res = await api.patch<{ success: boolean }>(`/api/notifications/${id}/read`);
    return res.data?.success || true;
  } catch (err) {
    return false;
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const res = await api.patch<{ success: boolean }>("/api/notifications/read-all");
    return res.data?.success || true;
  } catch (err) {
    return false;
  }
}
