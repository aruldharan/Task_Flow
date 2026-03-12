import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useComments = (taskId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      const { data, error } = await api.comments.select({ task_id: taskId });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user && !!taskId,
  });

  const addComment = useMutation({
    mutationFn: async (message: string) => {
      const { data, error } = await api.comments.insert({ task_id: taskId, message });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.comments.delete(id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });

  return {
    comments: commentsQuery.data ?? [],
    isLoading: commentsQuery.isLoading,
    addComment,
    deleteComment,
  };
};
