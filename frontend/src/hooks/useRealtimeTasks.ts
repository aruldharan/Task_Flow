import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Replaces Supabase realtime subscriptions with simple polling for now.
 * In a real production app you would use WebSockets or Server-Sent Events.
 */
export const useRealtimeTasks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["subtasks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [user, queryClient]);
};
