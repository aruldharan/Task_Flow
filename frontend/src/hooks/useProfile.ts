import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await api.profiles.select({ user_id: user!.id });
      if (error) throw error;
      // Backend returns array; take the first item
      const list = data as any[];
      return list.length > 0 ? list[0] : null;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: { display_name?: string; avatar_url?: string | null }) => {
      const profile = profileQuery.data;
      if (!profile) throw new Error("Profile not found");
      const { error } = await api.profiles.update(profile.id, updates);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");
      // Upload via multipart form data to backend
      const formData = new FormData();
      formData.append("avatar", file);
      const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/profiles/avatar`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message);
      }
      const data = await res.json();
      return data.avatar_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Avatar updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    updateProfile,
    uploadAvatar,
  };
};
