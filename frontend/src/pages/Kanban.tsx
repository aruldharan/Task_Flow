import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Database } from "@/api/types";
import { cn } from "@/lib/utils";
import { Plus, Circle, Loader2, CheckCircle2, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tables } from "@/api/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];
type Task = Tables<"tasks">;

const columns: { status: TaskStatus; label: string; icon: typeof Circle; color: string; headerBg: string; accent: string }[] = [
  { status: "todo", label: "To Do", icon: Circle, color: "text-muted-foreground", headerBg: "bg-muted/50", accent: "border-muted-foreground/20" },
  { status: "in_progress", label: "In Progress", icon: Loader2, color: "text-warning", headerBg: "bg-warning/10", accent: "border-warning/30" },
  { status: "completed", label: "Done", icon: CheckCircle2, color: "text-success", headerBg: "bg-success/10", accent: "border-success/30" },
];

const SortableTaskCard = ({ task }: { task: Task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task, status: task.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1 group/drag">
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center h-8 w-5 shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover/drag:opacity-60 transition-opacity"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <TaskCard task={task} />
      </div>
    </div>
  );
};

const DroppableColumn = ({ col, tasks: colTasks }: { col: typeof columns[0]; tasks: Task[] }) => {
  return (
    <SortableContext items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2 min-h-[100px]">
        {colTasks.map(task => (
          <SortableTaskCard key={task.id} task={task} />
        ))}
        {colTasks.length === 0 && (
          <div className="py-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
              <col.icon className="h-5 w-5 text-muted-foreground/30" />
            </div>
            <p className="text-xs text-muted-foreground/50">Drop tasks here</p>
          </div>
        )}
      </div>
    </SortableContext>
  );
};

const Kanban = () => {
  const { tasks, isLoading, updateTask } = useTasks();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine target status from the over element
    const overTask = tasks.find(t => t.id === overId);
    const activeTaskData = tasks.find(t => t.id === activeId);
    
    if (!activeTaskData) return;

    // If dropped on a task, use that task's status
    if (overTask && overTask.status !== activeTaskData.status) {
      updateTask.mutate({ id: activeId, status: overTask.status });
    }
  };

  // Also support HTML5 drop on columns for empty columns
  const handleColumnDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) updateTask.mutate({ id: taskId, status });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-up shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-sm text-muted-foreground">Drag and drop to reorder and update status</p>
        </div>
        <CreateTaskDialog />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto scrollbar-thin -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-5 h-full min-w-[900px] md:min-w-0 md:grid md:grid-cols-3 pb-4">
          {columns.map((col, i) => {
            const colTasks = tasks.filter(t => t.status === col.status);
            return (
              <div
                key={col.status}
                className={cn("flex flex-col rounded-2xl border-2 glass-card animate-fade-up overflow-hidden transition-all duration-300", col.accent)}
                style={{ animationDelay: `${i * 80}ms` }}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("ring-2", "ring-primary/40", "bg-primary/5"); }}
                onDragLeave={e => { e.currentTarget.classList.remove("ring-2", "ring-primary/40", "bg-primary/5"); }}
                onDrop={e => { e.currentTarget.classList.remove("ring-2", "ring-primary/40", "bg-primary/5"); handleColumnDrop(e, col.status); }}
              >
                <div className={cn("flex items-center gap-2 p-4 border-b", col.headerBg)}>
                  <col.icon className={cn("h-4 w-4", col.color)} />
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                  <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">{colTasks.length}</Badge>
                </div>
                <DroppableColumn col={col} tasks={colTasks} />
                <div className="border-t p-2">
                  <CreateTaskDialog
                    defaultStatus={col.status}
                    trigger={
                      <button className="flex w-full items-center justify-center gap-2 rounded-xl p-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                        <Plus className="h-4 w-4" /> Add task
                      </button>
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

        <DragOverlay>
          {activeTask ? (
            <motion.div
              initial={{ scale: 1, rotate: 0 }}
              animate={{ scale: 1.06, rotate: 2, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
              transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
              className="rounded-xl"
            >
              <TaskCard task={activeTask} />
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Kanban;
