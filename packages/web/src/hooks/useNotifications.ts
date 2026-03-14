import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/client.js";
import { useNotificationStore } from "../stores/notification.store.js";
import type { NotificationData } from "../stores/notification.store.js";

interface NotificationsResponse {
  notifications: NotificationData[];
  total: number;
}

export function useNotifications(page = 1, limit = 20) {
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  const query = useQuery({
    queryKey: ["notifications", page, limit],
    queryFn: async () => {
      const data = await apiRequest<NotificationsResponse>(
        `/notifications?page=${page}&limit=${limit}`,
      );
      setNotifications(data.notifications);
      return data;
    },
    staleTime: 15_000,
  });

  return query;
}

export function useUnreadCount() {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const data = await apiRequest<{ count: number }>("/notifications/unread-count");
      setUnreadCount(data.count);
      return data.count;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const markRead = useNotificationStore((s) => s.markRead);

  return useMutation({
    mutationFn: (notifId: string) =>
      apiRequest<{ message: string }>(`/notifications/${notifId}/read`, { method: "PATCH" }),
    onSuccess: (_data, notifId) => {
      markRead(notifId);
      void queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  return useMutation({
    mutationFn: () =>
      apiRequest<{ message: string }>("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => {
      markAllRead();
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useNotificationWebSocket() {
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    function handleWsMessage(event: MessageEvent) {
      try {
        const msg = JSON.parse(event.data as string) as { type: string; data: NotificationData };
        if (msg.type === "notification:new") {
          addNotification(msg.data);
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Listen for WebSocket messages via the shared connection
    // The polling via useUnreadCount serves as fallback
    window.addEventListener("message", handleWsMessage as EventListener);

    return () => {
      window.removeEventListener("message", handleWsMessage as EventListener);
    };
  }, [addNotification]);
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () =>
      apiRequest<{ inApp: boolean; email: boolean; emailDigest: string; mutedTypes: string[] }>(
        "/notifications/preferences",
      ),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: { inApp?: boolean; email?: boolean; emailDigest?: string; mutedTypes?: string[] }) =>
      apiRequest<unknown>("/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify(prefs),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });
}
