import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useTasks = (projectId?: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ["tasks", user?.id, projectId],
    queryFn: async () => {
      const params: any = { is_parent: "true" };
      if (projectId) params.project_id = projectId;
      
      const { data, error } = await api.tasks.select(params);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  const subtasksQuery = useQuery({
    queryKey: ["subtasks", user?.id],
    queryFn: async () => {
      const { data, error } = await api.tasks.select({ is_parent: "false" });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  const createTask = useMutation({
    mutationFn: async (task: any) => {
      const { data, error } = await api.tasks.insert(task);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["subtasks"] });
      toast.success("Task created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await api.tasks.update(id, updates);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["subtasks"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.tasks.delete(id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["subtasks"] });
      toast.success("Task deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return {
    tasks: tasksQuery.data ?? [],
    subtasks: subtasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    createTask,
    updateTask,
    deleteTask,
  };
};
