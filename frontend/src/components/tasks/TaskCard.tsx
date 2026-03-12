import { useState } from "react";
import { Tables } from "@/api/types";
import { useTasks } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, isPast, isToday } from "date-fns";
import { Check, Flag, Calendar, AlertTriangle, Timer } from "lucide-react";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { TaskCardActions } from "./TaskCardActions";

type Task = Tables<"tasks">;

const priorityConfig = {
  low: { label: "Low", color: "text-priority-low", border: "border-l-priority-low", bg: "bg-priority-low/10", dot: "bg-priority-low" },
  medium: { label: "Med", color: "text-priority-medium", border: "border-l-priority-medium", bg: "bg-priority-medium/10", dot: "bg-priority-medium" },
  high: { label: "High", color: "text-priority-high", border: "border-l-priority-high", bg: "bg-priority-high/10", dot: "bg-priority-high" },
  urgent: { label: "Urgent", color: "text-priority-urgent", border: "border-l-priority-urgent", bg: "bg-priority-urgent/10", dot: "bg-priority-urgent" },
};

const statusConfig = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
  archived: "bg-muted text-muted-foreground",
};

interface Props {
  task: Task;
  compact?: boolean;
}

export const TaskCard = ({ task, compact }: Props) => {
  const { updateTask } = useTasks();
  const [detailOpen, setDetailOpen] = useState(false);
  const p = priorityConfig[task.priority];
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "completed";
  const isDueToday = task.due_date && isToday(new Date(task.due_date));
  const isCompleted = task.status === "completed";

  const toggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask.mutate({
      id: task.id,
      status: isCompleted ? "todo" : "completed",
    });
  };

  return (
    <>
      <div
        onClick={() => setDetailOpen(true)}
        className={cn(
          "group relative flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3.5 cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:border-border hover:-translate-y-0.5",
          "border-l-[3px]",
          p.border,
          isCompleted && "opacity-60",
          isOverdue && "ring-1 ring-destructive/20"
        )}
      >
        {/* Checkbox */}
        <button
          onClick={toggleComplete}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
            isCompleted
              ? "border-success bg-success text-success-foreground scale-100"
              : "border-muted-foreground/30 hover:border-primary hover:scale-110"
          )}
        >
          {isCompleted && <Check className="h-3 w-3" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "text-sm font-medium leading-snug",
              isCompleted && "line-through text-muted-foreground"
            )}>
              {task.title}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-semibold", p.bg, p.color)}>
                <Flag className="h-2.5 w-2.5 mr-0.5" />{p.label}
              </Badge>
              <TaskCardActions task={task} onOpenDetail={() => setDetailOpen(true)} />
            </div>
          </div>

          {!compact && task.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", statusConfig[task.status])}>
              {task.status === "in_progress" ? "In Progress" : task.status === "todo" ? "To Do" : task.status === "completed" ? "Done" : "Archived"}
            </Badge>

            {task.due_date && (
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px]",
                isOverdue ? "text-destructive font-semibold" :
                isDueToday ? "text-warning font-semibold" :
                "text-muted-foreground"
              )}>
                {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                {isOverdue ? "Overdue" : isDueToday ? "Today" : format(new Date(task.due_date), "MMM d")}
              </span>
            )}

            {task.recurrence && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Timer className="h-3 w-3" />
                {task.recurrence}
              </span>
            )}
          </div>
        </div>
      </div>

      <TaskDetailSheet task={task} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
};
