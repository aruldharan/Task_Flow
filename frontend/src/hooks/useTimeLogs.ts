import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useTimeLogs = (taskId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const timeLogsQuery = useQuery({
    queryKey: ["time-logs", taskId],
    queryFn: async () => {
      const params: any = {};
      if (taskId) params.task_id = taskId;
      const { data, error } = await api.timeLogs.select(params);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const startTimer = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await api.timeLogs.insert({
        task_id: taskId,
        started_at: new Date().toISOString(),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
      toast.success("Timer started");
    },
  });

  const stopTimer = useMutation({
    mutationFn: async (logId: string) => {
      const { data, error } = await api.timeLogs.update(logId, {
        ended_at: new Date().toISOString(),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
      toast.success("Timer stopped");
    },
  });

  const activeLog = (timeLogsQuery.data ?? []).find((l: any) => !l.ended_at);
  const totalSeconds = (timeLogsQuery.data ?? []).reduce((sum: number, l: any) => sum + (l.duration_seconds ?? 0), 0);

  return {
    timeLogs: timeLogsQuery.data ?? [],
    activeLog,
    totalSeconds,
    isLoading: timeLogsQuery.isLoading,
    startTimer,
    stopTimer,
  };
};
