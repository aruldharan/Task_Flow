import { useParams } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, CheckSquare, Clock, AlertTriangle, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const ProjectView = () => {
  const { projectId } = useParams();
  const { tasks, isLoading } = useTasks(projectId);
  const { projects, deleteProject } = useProjects();

  const project = projects.find(p => p.id === projectId);
  const todoCount = tasks.filter(t => t.status === "todo").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-up">
        <div className="flex items-center gap-3">
          {project && (
            <div
              className="h-5 w-5 rounded-full ring-2 ring-offset-2 ring-offset-background shadow-lg shrink-0"
              style={{ backgroundColor: project.color ?? "#6366f1", boxShadow: `0 0 12px ${project.color ?? "#6366f1"}40` }}
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{project?.name ?? "Project"}</h1>
            {project?.description && <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CreateTaskDialog defaultProjectId={projectId} />
          {project && (
            <Button variant="outline" size="icon" className="h-9 w-9 text-destructive" onClick={() => deleteProject.mutate(project.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up" style={{ animationDelay: "50ms" }}>
        <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold">{tasks.length}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-primary">{todoCount}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">To Do</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-warning">{inProgressCount}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Working</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-success">{completedCount}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Done</p></CardContent></Card>
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-sm font-bold text-primary tabular-nums">{progress}%</span>
        </div>
      )}

      {/* Tasks */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground font-medium">No tasks in this project yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click "New Task" to add one</p>
          </div>
        ) : (
          tasks.map((task, i) => (
            <div key={task.id} className="animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              <TaskCard task={task} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectView;
