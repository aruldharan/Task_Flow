import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Zap, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Database } from "@/api/types";

type TaskPriority = Database["public"]["Enums"]["task_priority"];

const priorities: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-priority-low/15 text-priority-low hover:bg-priority-low/25" },
  { value: "medium", label: "Med", color: "bg-priority-medium/15 text-priority-medium hover:bg-priority-medium/25" },
  { value: "high", label: "High", color: "bg-priority-high/15 text-priority-high hover:bg-priority-high/25" },
  { value: "urgent", label: "Urgent", color: "bg-priority-urgent/15 text-priority-urgent hover:bg-priority-urgent/25" },
];

export const QuickAddWidget = () => {
  const { createTask } = useTasks();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask.mutateAsync({
      title: title.trim(),
      priority,
      status: "todo",
    });
    setTitle("");
    setPriority("medium");
  };

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-accent via-card to-card animate-fade-up" style={{ animationDelay: "150ms" }}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Quick Add</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="h-10"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {priorities.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-semibold transition-all border",
                    priority === p.value ? p.color + " border-current" : "bg-muted/50 text-muted-foreground border-transparent"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Button type="submit" size="sm" className="h-8 gap-1" disabled={!title.trim() || createTask.isPending}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
