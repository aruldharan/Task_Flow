import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await api.notifications.select({ limit: "20" });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.notifications.update(id, { read: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await api.notifications.update("mark-all-read", {});
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const createNotification = useMutation({
    mutationFn: async ({ title, message }: { title: string; message?: string }) => {
      const { error } = await api.notifications.insert({ title, message: message ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = (notificationsQuery.data ?? []).filter((n: any) => !n.read).length;

  return {
    notifications: notificationsQuery.data ?? [],
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    markRead,
    markAllRead,
    createNotification,
  };
};
