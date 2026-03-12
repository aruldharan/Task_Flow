import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface DailyNote {
  id: string;
  user_id: string;
  note_date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useDailyNotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const notesQuery = useQuery({
    queryKey: ["daily_notes", user?.id],
    queryFn: async () => {
      const { data, error } = await api.dailyNotes.select({ limit: "7" });
      if (error) throw error;
      return data as DailyNote[];
    },
    enabled: !!user,
  });

  const upsertNote = useMutation({
    mutationFn: async ({ date, content }: { date: string; content: string }) => {
      const { data, error } = await api.dailyNotes.insert({ note_date: date, content }); // Backend handles upsert
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily_notes"] });
    },
  });

  const todayNote = notesQuery.data?.find(
    n => n.note_date === format(new Date(), "yyyy-MM-dd")
  );

  return {
    notes: notesQuery.data ?? [],
    todayNote,
    upsertNote,
    isLoading: notesQuery.isLoading,
  };
};
