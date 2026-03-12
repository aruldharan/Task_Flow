import { useMemo, useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays, differenceInDays, format, startOfDay, endOfDay, isWithinInterval, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { Tables } from "@/api/types";

type Task = Tables<"tasks">;

const priorityColors: Record<string, string> = {
  low: "bg-priority-low",
  medium: "bg-priority-medium",
  high: "bg-priority-high",
  urgent: "bg-priority-urgent",
};

const Timeline = () => {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const [viewDays, setViewDays] = useState(14);
  const [startDate, setStartDate] = useState(() => startOfDay(subDays(new Date(), 1)));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const endDate = addDays(startDate, viewDays);
  const days = Array.from({ length: viewDays }, (_, i) => addDays(startDate, i));

  const tasksWithDates = useMemo(() => {
    return tasks
      .filter(t => t.due_date || t.created_at)
      .map(t => {
        const taskStart = startOfDay(new Date(t.created_at));
        const taskEnd = t.due_date ? endOfDay(new Date(t.due_date)) : endOfDay(new Date(t.created_at));
        return { ...t, taskStart, taskEnd };
      })
      .filter(t => {
        return t.taskEnd >= startDate && t.taskStart <= endDate;
      })
      .sort((a, b) => a.taskStart.getTime() - b.taskStart.getTime());
  }, [tasks, startDate, endDate]);

  const dayWidth = 100 / viewDays;

  const getTaskPosition = (task: typeof tasksWithDates[0]) => {
    const clampedStart = task.taskStart < startDate ? startDate : task.taskStart;
    const clampedEnd = task.taskEnd > endDate ? endDate : task.taskEnd;
    const startOffset = differenceInDays(clampedStart, startDate);
    const duration = Math.max(1, differenceInDays(clampedEnd, clampedStart) + 1);
    return { left: `${startOffset * dayWidth}%`, width: `${duration * dayWidth}%` };
  };

  const isToday = (day: Date) => {
    const now = new Date();
    return day.toDateString() === now.toDateString();
  };

  return (
    <div className="p-6 space-y-6 h-full">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" /> Timeline
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(startDate, "MMM d")} — {format(addDays(startDate, viewDays - 1), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setStartDate(s => subDays(s, viewDays))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setStartDate(startOfDay(subDays(new Date(), 1)))}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setStartDate(s => addDays(s, viewDays))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Select value={String(viewDays)} onValueChange={v => setViewDays(Number(v))}>
            <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">1 Week</SelectItem>
              <SelectItem value="14">2 Weeks</SelectItem>
              <SelectItem value="30">1 Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden bg-card">
        {/* Header row - days */}
        <div className="flex border-b bg-muted/30">
          {days.map((day, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 text-center py-2 text-[10px] font-medium border-r last:border-r-0",
                isToday(day) && "bg-primary/10 text-primary font-bold"
              )}
              style={{ minWidth: 0 }}
            >
              <div>{format(day, "EEE")}</div>
              <div className={cn("text-sm", isToday(day) ? "text-primary" : "text-muted-foreground")}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Task rows */}
        <div className="relative min-h-[400px]">
          {/* Grid lines */}
          <div className="absolute inset-0 flex pointer-events-none">
            {days.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 border-r last:border-r-0",
                  isToday(day) && "bg-primary/5"
                )}
              />
            ))}
          </div>

          {/* Tasks */}
          <div className="relative p-2 space-y-1">
            {tasksWithDates.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No tasks with dates in this range</p>
              </div>
            ) : (
              tasksWithDates.map((task, i) => {
                const pos = getTaskPosition(task);
                const project = projects.find(p => p.id === task.project_id);
                return (
                  <div key={task.id} className="relative h-9" style={{ animationDelay: `${i * 20}ms` }}>
                    <div
                      className={cn(
                        "absolute top-0 h-full rounded-md px-2 flex items-center gap-1.5 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] text-white text-xs font-medium truncate",
                        priorityColors[task.priority],
                        task.status === "completed" && "opacity-50"
                      )}
                      style={{ left: pos.left, width: pos.width, minWidth: "40px" }}
                      onClick={() => { setSelectedTask(task); setDetailOpen(true); }}
                      title={task.title}
                    >
                      {project && (
                        <div className="h-2 w-2 rounded-full bg-white/60 shrink-0" />
                      )}
                      <span className="truncate">{task.title}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <TaskDetailSheet task={selectedTask} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
};

export default Timeline;
