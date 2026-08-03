import { api } from "@/lib";

export interface Notification {
  id: string;
  user_id: string;
  document_id: string | null;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export const notificationsService = {
  async getNotifications(isRead?: boolean): Promise<Notification[]> {
    const url = isRead !== undefined 
      ? `/api/notifications?is_read=${isRead}`
      : "/api/notifications";
    const res = await api.get<Notification[]>(url);
    return res.data;
  },

  async markAsRead(id: string): Promise<boolean> {
    const res = await api.patch<{ success: boolean }>(`/api/notifications/${id}/read`);
    return res.data.success;
  },
};
