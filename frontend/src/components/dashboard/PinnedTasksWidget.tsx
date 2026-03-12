import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pin } from "lucide-react";

export const PinnedTasksWidget = () => {
  const { tasks } = useTasks();
  const pinnedTasks = tasks.filter((t: any) => t.pinned && t.status !== "completed");

  if (pinnedTasks.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Pin className="h-4 w-4 text-primary" />
          Pinned Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pinnedTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </CardContent>
    </Card>
  );
};
