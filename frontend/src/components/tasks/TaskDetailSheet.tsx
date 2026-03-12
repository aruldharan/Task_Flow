import { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tables } from "@/api/types";
import { useTasks } from "@/hooks/useTasks";
import { useComments } from "@/hooks/useComments";
import { useProjects } from "@/hooks/useProjects";
import { useTimeLogs } from "@/hooks/useTimeLogs";
import { useAttachments } from "@/hooks/useAttachments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";
import {
  Check, Clock, Send, Trash2, MessageSquare, ListTree,
  Calendar, Flag, FolderOpen, Edit3, X, Plus, Play, Square, Timer,
  Paperclip, Download, FileText, Image, File as FileIcon, Copy, Archive
} from "lucide-react";
import { Database } from "@/api/types";

type Task = Tables<"tasks">;
type TaskPriority = Database["public"]["Enums"]["task_priority"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

const priorityConfig = {
  low: { label: "Low", color: "bg-priority-low/15 text-priority-low border-priority-low/30" },
  medium: { label: "Medium", color: "bg-priority-medium/15 text-priority-medium border-priority-medium/30" },
  high: { label: "High", color: "bg-priority-high/15 text-priority-high border-priority-high/30" },
  urgent: { label: "Urgent", color: "bg-priority-urgent/15 text-priority-urgent border-priority-urgent/30" },
};

const statusConfig = {
  todo: { label: "To Do", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", color: "bg-warning/15 text-warning" },
  completed: { label: "Done", color: "bg-success/15 text-success" },
  archived: { label: "Archived", color: "bg-muted text-muted-foreground" },
};

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

interface Props {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskDetailSheet = ({ task, open, onOpenChange }: Props) => {
  const { updateTask, deleteTask, createTask, subtasks } = useTasks();
  const { projects } = useProjects();
  const { comments, addComment, deleteComment } = useComments(task?.id ?? "");
  const { timeLogs, activeLog, totalSeconds, startTimer, stopTimer } = useTimeLogs(task?.id);
  const { attachments, uploadAttachment, deleteAttachment, getPublicUrl } = useAttachments(task?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commentText, setCommentText] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  if (!task) return null;

  const taskSubtasks = subtasks.filter(s => s.parent_task_id === task.id);
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "completed";
  const project = projects.find(p => p.id === task.project_id);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await addComment.mutateAsync(commentText.trim());
    setCommentText("");
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    await createTask.mutateAsync({
      title: newSubtask.trim(),
      parent_task_id: task.id,
      project_id: task.project_id,
      priority: "medium",
      status: "todo",
    });
    setNewSubtask("");
  };

  const startEditing = () => {
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditing(true);
  };

  const saveEdit = () => {
    updateTask.mutate({ id: task.id, title: editTitle, description: editDescription || null });
    setEditing(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {editing ? (
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="text-lg font-bold" autoFocus />
              ) : (
                <SheetTitle className="text-lg font-bold leading-snug pr-2">{task.title}</SheetTitle>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {editing ? (
                <>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEdit}><Check className="h-4 w-4 text-success" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
                </>
              ) : (
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={startEditing}><Edit3 className="h-4 w-4" /></Button>
              )}
              <Button size="icon" variant="ghost" className="h-8 w-8" title="Duplicate" onClick={() => {
                createTask.mutate({
                  title: `${task.title} (copy)`,
                  description: task.description,
                  priority: task.priority,
                  status: "todo",
                  project_id: task.project_id,
                  due_date: task.due_date,
                  recurrence: task.recurrence,
                });
              }}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" title="Archive" onClick={() => {
                updateTask.mutate({ id: task.id, status: "archived" });
                onOpenChange(false);
              }}>
                <Archive className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { deleteTask.mutate(task.id); onOpenChange(false); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn("text-xs font-semibold", priority.color)}>
              <Flag className="h-3 w-3 mr-1" />{priority.label}
            </Badge>
            <Badge variant="outline" className={cn("text-xs font-semibold", status.color)}>
              {status.label}
            </Badge>
            {project && (
              <Badge variant="outline" className="text-xs">
                <FolderOpen className="h-3 w-3 mr-1" />{project.name}
              </Badge>
            )}
            {task.due_date && (
              <Badge variant="outline" className={cn("text-xs", isOverdue ? "border-destructive/50 text-destructive" : "")}>
                <Calendar className="h-3 w-3 mr-1" />
                {isOverdue ? "Overdue: " : ""}{format(new Date(task.due_date), "MMM d, yyyy")}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          {/* Description */}
          <div className="space-y-2 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</h3>
            {editing ? (
              <MarkdownEditor value={editDescription} onChange={setEditDescription} rows={5} placeholder="Add a description with **markdown**..." />
            ) : (
              <MarkdownRenderer content={task.description ?? ""} />
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Status</label>
              <Select value={task.status} onValueChange={v => updateTask.mutate({ id: task.id, status: v as TaskStatus })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Priority</label>
              <Select value={task.priority} onValueChange={v => updateTask.mutate({ id: task.id, priority: v as TaskPriority })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time Tracking */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Time Tracking</h3>
            </div>
            <div className="flex items-center gap-3">
              {activeLog ? (
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => stopTimer.mutate(activeLog.id)}>
                  <Square className="h-3.5 w-3.5" /> Stop
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => startTimer.mutate(task.id)}>
                  <Play className="h-3.5 w-3.5" /> Start Timer
                </Button>
              )}
              <span className="text-sm font-mono tabular-nums text-muted-foreground">
                Total: {formatDuration(totalSeconds)}
              </span>
            </div>
            {timeLogs.length > 0 && (
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {timeLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{format(new Date(log.started_at), "MMM d, h:mm a")}</span>
                    <span className="font-mono">{log.duration_seconds ? formatDuration(log.duration_seconds) : "running..."}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator className="mb-6" />

          {/* Subtasks */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <ListTree className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Subtasks ({taskSubtasks.filter(s => s.status === "completed").length}/{taskSubtasks.length})
              </h3>
            </div>
            {taskSubtasks.map(sub => (
              <div key={sub.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => updateTask.mutate({ id: sub.id, status: sub.status === "completed" ? "todo" : "completed" })}
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    sub.status === "completed"
                      ? "border-success bg-success text-success-foreground"
                      : "border-muted-foreground/30 hover:border-primary"
                  )}
                >
                  {sub.status === "completed" && <Check className="h-3 w-3" />}
                </button>
                <span className={cn("text-sm flex-1", sub.status === "completed" && "line-through text-muted-foreground")}>{sub.title}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => deleteTask.mutate(sub.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                placeholder="Add subtask..."
                className="h-8 text-sm"
                onKeyDown={e => e.key === "Enter" && handleAddSubtask()}
              />
              <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleAddSubtask}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Attachments ({attachments.length})
                </h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAttachment.isPending}
              >
                <Plus className="h-3 w-3" />
                {uploadAttachment.isPending ? "Uploading..." : "Add File"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || !task) return;
                  for (const file of Array.from(files)) {
                    await uploadAttachment.mutateAsync({ file, taskId: task.id });
                  }
                  e.target.value = "";
                }}
              />
            </div>
            {attachments.map(att => {
              const isImage = att.file_type.startsWith("image/");
              const url = getPublicUrl(att.storage_path);
              const sizeKB = (att.file_size / 1024).toFixed(1);
              const sizeMB = (att.file_size / (1024 * 1024)).toFixed(1);
              const sizeLabel = att.file_size > 1048576 ? `${sizeMB} MB` : `${sizeKB} KB`;

              return (
                <div key={att.id} className="group flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-2.5 hover:bg-muted/60 transition-colors">
                  {isImage ? (
                    <div className="h-10 w-10 rounded overflow-hidden shrink-0 bg-muted">
                      <img src={url} alt={att.file_name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <FileIcon className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{att.file_name}</p>
                    <p className="text-[10px] text-muted-foreground">{sizeLabel} · {format(new Date(att.created_at), "MMM d")}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                      <a href={url} download={att.file_name} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={() => deleteAttachment.mutate(att)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <Separator className="mb-6" />
          <div className="space-y-3 pb-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Comments ({comments.length})
              </h3>
            </div>
            {comments.map(c => (
              <div key={c.id} className="group rounded-lg bg-muted/50 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), "MMM d, h:mm a")}</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => deleteComment.mutate(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm">{c.message}</p>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="h-9 text-sm"
                onKeyDown={e => e.key === "Enter" && handleAddComment()}
              />
              <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAddComment} disabled={addComment.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
