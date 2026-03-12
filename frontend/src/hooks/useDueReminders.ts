import { useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook that checks for tasks due within 24 hours and creates
 * in-app notifications as reminders. Runs once on mount.
 */
export const useDueReminders = () => {
  const { tasks } = useTasks();
  const { notifications, createNotification } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || tasks.length === 0) return;

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find tasks due within 24 hours that are not completed
    const dueSoon = tasks.filter(t => {
      if (!t.due_date || t.status === "completed" || t.status === "archived") return false;
      const due = new Date(t.due_date);
      return due > now && due <= in24h;
    });

    // Check which ones we haven't notified about today
    const todayStr = now.toISOString().split("T")[0];

    dueSoon.forEach(task => {
      const alreadyNotified = (notifications ?? []).some(
        n => n.title.includes(task.title) && n.created_at.startsWith(todayStr)
      );
      if (!alreadyNotified) {
        const hoursLeft = Math.round((new Date(task.due_date!).getTime() - now.getTime()) / 3600000);
        createNotification.mutate({
          title: `⏰ Due soon: ${task.title}`,
          message: `This task is due in ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""}. Don't forget to complete it!`,
        });
      }
    });

    // Also check overdue tasks
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === "completed" || t.status === "archived") return false;
      return new Date(t.due_date) < now;
    });

    overdue.forEach(task => {
      const alreadyNotified = (notifications ?? []).some(
        n => n.title.includes("Overdue") && n.title.includes(task.title) && n.created_at.startsWith(todayStr)
      );
      if (!alreadyNotified) {
        createNotification.mutate({
          title: `🚨 Overdue: ${task.title}`,
          message: `This task was due on ${new Date(task.due_date!).toLocaleDateString()}. Please update or complete it.`,
        });
      }
    });
  }, [user, tasks.length]); // Only run when tasks load
};
