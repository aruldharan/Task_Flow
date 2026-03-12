import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Attachment {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  created_at: string;
}

export const useAttachments = (taskId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

  const attachmentsQuery = useQuery({
    queryKey: ["attachments", taskId],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/attachments?task_id=${taskId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch attachments");
      return (await res.json()) as Attachment[];
    },
    enabled: !!taskId && !!user,
  });

  const uploadAttachment = useMutation({
    mutationFn: async ({ file, taskId: tId }: { file: File; taskId: string }) => {
      if (!user) throw new Error("Not authenticated");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("task_id", tId);
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/attachments`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message);
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
      toast.success("File uploaded");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteAttachment = useMutation({
    mutationFn: async (attachment: Attachment) => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/attachments/${attachment.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to delete attachment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
      toast.success("File deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getPublicUrl = (storagePath: string) => {
    return `${API_BASE}/attachments/file/${encodeURIComponent(storagePath)}`;
  };

  return {
    attachments: attachmentsQuery.data ?? [],
    isLoading: attachmentsQuery.isLoading,
    uploadAttachment,
    deleteAttachment,
    getPublicUrl,
  };
};
