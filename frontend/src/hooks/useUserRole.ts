import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "owner" | "admin" | "member" | "viewer";

export const useUserRole = () => {
  const { user } = useAuth();

  const roleQuery = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      const { data, error } = await api.userRoles.select({ user_id: user!.id });
      if (error) throw error;
      return ((data as any[])?.map((r: any) => r.role) ?? []) as AppRole[];
    },
    enabled: !!user,
  });

  const roles = roleQuery.data ?? [];
  const isOwner = roles.includes("owner");
  const isAdmin = roles.includes("admin") || isOwner;
  const isMember = roles.includes("member") || isAdmin;
  const isViewer = roles.includes("viewer") || isMember;

  return { roles, isOwner, isAdmin, isMember, isViewer, isLoading: roleQuery.isLoading };
};
