import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Copy, Archive, Trash2, ArrowUpRight, Pin, PinOff } from "lucide-react";
import { Tables } from "@/api/types";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "sonner";

type Task = Tables<"tasks">;

interface Props {
  task: Task;
  onOpenDetail?: () => void;
}

export const TaskCardActions = ({ task, onOpenDetail }: Props) => {
  const { createTask, updateTask, deleteTask } = useTasks();

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    createTask.mutate({
      title: `${task.title} (copy)`,
      description: task.description,
      priority: task.priority,
      status: "todo",
      project_id: task.project_id,
      due_date: task.due_date,
      recurrence: task.recurrence,
      parent_task_id: task.parent_task_id,
    });
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isPinned = (task as any).pinned;
    updateTask.mutate({ id: task.id, pinned: !isPinned } as any);
    toast.success(isPinned ? "Task unpinned" : "Task pinned");
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask.mutate({ id: task.id, status: "archived" });
    toast.success("Task archived");
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTask.mutate(task.id);
  };

  const isPinned = (task as any).pinned;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {onOpenDetail && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpenDetail(); }}>
            <ArrowUpRight className="h-4 w-4 mr-2" /> Open Details
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleTogglePin}>
          {isPinned ? <PinOff className="h-4 w-4 mr-2" /> : <Pin className="h-4 w-4 mr-2" />}
          {isPinned ? "Unpin" : "Pin to Top"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="h-4 w-4 mr-2" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleArchive}>
          <Archive className="h-4 w-4 mr-2" /> Archive
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
