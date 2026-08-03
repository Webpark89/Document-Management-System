import useSWR from "swr";
import { notificationsService } from "../services/notifications.service";

export function useNotifications(isRead?: boolean) {
  const { data, error, mutate, isLoading } = useSWR(
    isRead !== undefined ? `/api/notifications?is_read=${isRead}` : "/api/notifications",
    () => notificationsService.getNotifications(isRead)
  );

  return {
    notifications: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
