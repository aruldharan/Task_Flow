import { useEffect, useCallback } from "react";
import { useTasks } from "@/hooks/useTasks";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { isPast, isToday, isTomorrow, differenceInHours } from "date-fns";

export const useSmartReminders = () => {
  const { user } = useAuth();
  const { tasks } = useTasks();

  const checkAndCreateReminders = useCallback(async () => {
    if (!user || tasks.length === 0) return;

    const now = new Date();
    const activeTasks = tasks.filter((t: any) => t.status !== "completed" && t.status !== "archived" && t.due_date);

    for (const task of activeTasks) {
      const dueDate = new Date(task.due_date!);
      const hoursUntilDue = differenceInHours(dueDate, now);

      let title = "";
      let message = "";

      if (isPast(dueDate) && !isToday(dueDate)) {
        title = "⚠️ Task Overdue";
        message = `"${task.title}" is past its due date.`;
      } else if (isToday(dueDate)) {
        title = "📅 Due Today";
        message = `"${task.title}" is due today. Don't forget!`;
      } else if (isTomorrow(dueDate)) {
        title = "🔔 Due Tomorrow";
        message = `"${task.title}" is due tomorrow.`;
      } else if (hoursUntilDue > 0 && hoursUntilDue <= 72) {
        title = "⏰ Upcoming Deadline";
        message = `"${task.title}" is due in ${Math.ceil(hoursUntilDue / 24)} days.`;
      } else {
        continue;
      }

      // Let the backend handle dedup
      await api.notifications.insert({ title, message });
    }
  }, [user, tasks]);

  useEffect(() => {
    const timeout = setTimeout(checkAndCreateReminders, 3000);
    const interval = setInterval(checkAndCreateReminders, 30 * 60 * 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [checkAndCreateReminders]);
};
