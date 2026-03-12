import { useTasks } from "@/hooks/useTasks";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { Tables } from "@/api/types";

type Task = Tables<"tasks">;

const priorityDot: Record<string, string> = {
  low: "bg-priority-low",
  medium: "bg-priority-medium",
  high: "bg-priority-high",
  urgent: "bg-priority-urgent",
};

const CalendarView = () => {
  const { tasks } = useTasks();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddedDays = Array.from({ length: startDay }, () => null).concat(days as any[]);

  const getTasksForDay = (day: Date) =>
    tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day));

  const tasksWithDue = tasks.filter(t => t.due_date).length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">{tasksWithDue} tasks with due dates</p>
        </div>
        <CreateTaskDialog />
      </div>

      <div className="flex items-center gap-4 animate-fade-up" style={{ animationDelay: "50ms" }}>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold min-w-[160px] text-center">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())} className="text-xs">
          Today
        </Button>
      </div>

      <div className="grid grid-cols-7 border rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: "100ms" }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="border-b bg-muted/50 p-2.5 text-center text-xs font-semibold text-muted-foreground">
            {d}
          </div>
        ))}
        {paddedDays.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="min-h-[110px] border-b border-r bg-muted/20" />;
          const dayTasks = getTasksForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className={cn(
              "min-h-[110px] border-b border-r p-1.5 transition-colors hover:bg-accent/30",
              isToday && "bg-primary/5"
            )}>
              <span className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                isToday && "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
              )}>
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayTasks.slice(0, 3).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="flex w-full items-center gap-1.5 truncate rounded-md bg-card border px-1.5 py-0.5 text-xs font-medium hover:bg-accent transition-colors text-left"
                  >
                    <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", priorityDot[t.priority])} />
                    <span className="truncate">{t.title}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-muted-foreground pl-1">+{dayTasks.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskDetailSheet task={selectedTask} open={!!selectedTask} onOpenChange={open => !open && setSelectedTask(null)} />
    </div>
  );
};

export default CalendarView;
