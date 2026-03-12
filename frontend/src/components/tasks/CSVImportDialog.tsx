import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/useTasks";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ParsedTask {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  due_date?: string;
}

const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];
const VALID_STATUSES = ["todo", "in_progress", "completed"];

const parseCSV = (text: string): ParsedTask[] => {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
  const titleIdx = headers.findIndex(h => h === "title" || h === "name" || h === "task");
  if (titleIdx === -1) return [];

  const descIdx = headers.findIndex(h => h === "description" || h === "desc" || h === "details");
  const priorityIdx = headers.findIndex(h => h === "priority");
  const statusIdx = headers.findIndex(h => h === "status");
  const dueIdx = headers.findIndex(h => h.includes("due") || h === "deadline" || h === "date");

  return lines.slice(1).map(line => {
    // Simple CSV parsing (handles quoted commas)
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === "," && !inQuotes) { cols.push(current.trim()); current = ""; continue; }
      current += char;
    }
    cols.push(current.trim());

    const title = cols[titleIdx]?.trim();
    if (!title) return null;

    const priority = priorityIdx >= 0 ? cols[priorityIdx]?.toLowerCase().trim() : undefined;
    const status = statusIdx >= 0 ? cols[statusIdx]?.toLowerCase().trim().replace(/ /g, "_") : undefined;

    return {
      title,
      description: descIdx >= 0 ? cols[descIdx] : undefined,
      priority: priority && VALID_PRIORITIES.includes(priority) ? priority : undefined,
      status: status && VALID_STATUSES.includes(status) ? status : undefined,
      due_date: dueIdx >= 0 ? cols[dueIdx] : undefined,
    };
  }).filter(Boolean) as ParsedTask[];
};

export const CSVImportDialog = () => {
  const { createTask } = useTasks();
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedTask[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const tasks = parseCSV(text);
      if (tasks.length === 0) {
        toast.error("No valid tasks found. Make sure your CSV has a 'Title' column header.");
        return;
      }
      setParsed(tasks);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = async () => {
    setImporting(true);
    setImported(0);
    let count = 0;
    for (const task of parsed) {
      try {
        await createTask.mutateAsync({
          title: task.title,
          description: task.description || null,
          priority: (task.priority as any) ?? "medium",
          status: (task.status as any) ?? "todo",
          due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
        });
        count++;
        setImported(count);
      } catch (err) {
        console.error("Failed to import task:", task.title, err);
      }
    }
    toast.success(`Imported ${count} task${count !== 1 ? "s" : ""}`);
    setImporting(false);
    setParsed([]);
    setOpen(false);
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) { setParsed([]); setImported(0); }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="h-3.5 w-3.5" /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Tasks from CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {parsed.length === 0 ? (
            <>
              <div className="rounded-lg border-2 border-dashed border-border p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}>
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to select CSV file</p>
                <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Expected CSV format:</p>
                <code className="block bg-muted rounded p-2 text-[11px]">
                  Title,Description,Priority,Status,Due Date<br />
                  "Buy groceries","Weekly shopping",medium,todo,2024-03-15<br />
                  "Write report",,high,in_progress,
                </code>
                <p>Required: <Badge variant="outline" className="text-[10px]">Title</Badge> column. Others are optional.</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <p className="text-sm font-medium">{parsed.length} task{parsed.length !== 1 ? "s" : ""} found</p>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1.5 rounded-lg border border-border p-2">
                {parsed.map((task, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded bg-muted/30">
                    <span className="text-xs text-muted-foreground w-6">{i + 1}</span>
                    <span className="flex-1 truncate font-medium">{task.title}</span>
                    {task.priority && <Badge variant="outline" className="text-[10px] capitalize">{task.priority}</Badge>}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setParsed([])}>Cancel</Button>
                <Button className="flex-1 gap-1.5" onClick={handleImport} disabled={importing}>
                  {importing ? `Importing ${imported}/${parsed.length}...` : `Import ${parsed.length} Tasks`}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
