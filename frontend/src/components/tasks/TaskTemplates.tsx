import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTasks } from "@/hooks/useTasks";
import { FileText, Plus, Trash2, Copy, Layers, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Database } from "@/api/types";

type TaskPriority = Database["public"]["Enums"]["task_priority"];

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  priority: TaskPriority;
  subtasks: string[];
}

const DEFAULT_TEMPLATES: TaskTemplate[] = [
  {
    id: "bug-report",
    name: "Bug Report",
    description: "Investigate and fix a reported bug",
    priority: "high",
    subtasks: ["Reproduce the bug", "Identify root cause", "Implement fix", "Write tests", "Code review"],
  },
  {
    id: "feature-request",
    name: "Feature Request",
    description: "Plan and implement a new feature",
    priority: "medium",
    subtasks: ["Requirements gathering", "Design mockup", "Implementation", "Testing", "Documentation"],
  },
  {
    id: "weekly-review",
    name: "Weekly Review",
    description: "Weekly planning and review session",
    priority: "medium",
    subtasks: ["Review completed tasks", "Update project status", "Plan next week", "Send status report"],
  },
  {
    id: "content-creation",
    name: "Content Creation",
    description: "Create and publish content",
    priority: "low",
    subtasks: ["Research topic", "Create outline", "Write draft", "Review & edit", "Publish"],
  },
];

const STORAGE_KEY = "taskflow-templates";

const getTemplates = (): TaskTemplate[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
};

const saveTemplates = (templates: TaskTemplate[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
};

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-priority-low/15 text-priority-low",
  medium: "bg-priority-medium/15 text-priority-medium",
  high: "bg-priority-high/15 text-priority-high",
  urgent: "bg-priority-urgent/15 text-priority-urgent",
};

interface Props {
  trigger?: React.ReactNode;
}

export const TaskTemplates = ({ trigger }: Props) => {
  const { createTask } = useTasks();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<TaskTemplate[]>(getTemplates);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [newSubtasks, setNewSubtasks] = useState("");

  const handleUseTemplate = async (template: TaskTemplate) => {
    const task = await createTask.mutateAsync({
      title: template.name,
      description: template.description,
      priority: template.priority,
      status: "todo",
    });

    // Create subtasks
    for (const subtask of template.subtasks) {
      await createTask.mutateAsync({
        title: subtask,
        parent_task_id: task.id,
        priority: "medium",
        status: "todo",
      });
    }

    toast.success(`Created "${template.name}" with ${template.subtasks.length} subtasks`);
    setOpen(false);
  };

  const handleCreateTemplate = () => {
    if (!newName.trim()) return;
    const template: TaskTemplate = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      description: newDesc.trim(),
      priority: newPriority,
      subtasks: newSubtasks.split("\n").map(s => s.trim()).filter(Boolean),
    };
    const updated = [...templates, template];
    setTemplates(updated);
    saveTemplates(updated);
    setCreating(false);
    setNewName("");
    setNewDesc("");
    setNewSubtasks("");
    toast.success("Template saved");
  };

  const handleDelete = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Layers className="h-4 w-4" /> Templates
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Task Templates
          </DialogTitle>
        </DialogHeader>

        {creating ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Sprint Planning" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description..." />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex gap-2">
                {(["low", "medium", "high", "urgent"] as TaskPriority[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setNewPriority(p)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize",
                      newPriority === p ? priorityColors[p] + " border-current" : "bg-muted/50 text-muted-foreground border-transparent"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subtasks (one per line)</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={newSubtasks}
                onChange={e => setNewSubtasks(e.target.value)}
                placeholder={"Step 1\nStep 2\nStep 3"}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateTemplate} className="flex-1" disabled={!newName.trim()}>Save Template</Button>
              <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {templates.map(template => (
              <Card key={template.id} className="p-4 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <h4 className="text-sm font-semibold truncate">{template.name}</h4>
                      <Badge variant="outline" className={cn("text-[10px] shrink-0", priorityColors[template.priority])}>
                        {template.priority}
                      </Badge>
                    </div>
                    {template.description && (
                      <p className="text-xs text-muted-foreground mb-2 ml-6">{template.description}</p>
                    )}
                    <div className="flex items-center gap-1 ml-6">
                      <CheckSquare className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{template.subtasks.length} subtasks</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleUseTemplate(template)}>
                      <Copy className="h-3 w-3" /> Use
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            <Button variant="outline" className="w-full gap-2" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Create Custom Template
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
