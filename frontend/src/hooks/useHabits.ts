import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  created_at: string;
}

export const useHabits = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const habitsQuery = useQuery({
    queryKey: ["habits", user?.id],
    queryFn: async () => {
      const { data, error } = await api.habits.select();
      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!user,
  });

  const completionsQuery = useQuery({
    queryKey: ["habit_completions", user?.id],
    queryFn: async () => {
      const { data, error } = await api.habitCompletions.select({ recent: "30" });
      if (error) throw error;
      return data as HabitCompletion[];
    },
    enabled: !!user,
  });

  const createHabit = useMutation({
    mutationFn: async ({ name, icon, color }: { name: string; icon?: string; color?: string }) => {
      const { data, error } = await api.habits.insert({ name, icon: icon ?? "✅", color: color ?? "#6366f1" });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habit created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.habits.delete(id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habit_completions"] });
      toast.success("Habit deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleCompletion = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const { error } = await api.habitCompletions.insert({ habit_id: habitId, completed_date: date }); // Backend handles toggle
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit_completions"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return {
    habits: habitsQuery.data ?? [],
    completions: completionsQuery.data ?? [],
    isLoading: habitsQuery.isLoading,
    createHabit,
    deleteHabit,
    toggleCompletion,
  };
};
