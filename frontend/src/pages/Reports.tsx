import { useMemo, useRef } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTimeLogs } from "@/hooks/useTimeLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, FileText, CheckCircle2, Clock, AlertTriangle, Calendar, Download } from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { toast } from "sonner";

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const Reports = () => {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { timeLogs } = useTimeLogs();
  const printRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const stats = useMemo(() => {
    const completedThisWeek = tasks.filter(t => {
      if (t.status !== "completed") return false;
      return isWithinInterval(parseISO(t.updated_at), { start: weekStart, end: weekEnd });
    });
    const activeTasks = tasks.filter(t => t.status !== "completed" && t.status !== "archived");
    const overdue = activeTasks.filter(t => t.due_date && new Date(t.due_date) < now);
    const urgent = activeTasks.filter(t => t.priority === "urgent");
    const totalSeconds = (timeLogs ?? [])
      .filter(l => isWithinInterval(parseISO(l.started_at), { start: weekStart, end: weekEnd }))
      .reduce((s, l) => s + (l.duration_seconds ?? 0), 0);
    return {
      completed: completedThisWeek,
      active: activeTasks,
      overdue,
      urgent,
      totalHours: Math.round(totalSeconds / 3600 * 10) / 10,
    };
  }, [tasks, timeLogs, weekStart, weekEnd, now]);

  const handleExportCSV = () => {
    const allTasks = [...stats.completed, ...stats.active];
    if (allTasks.length === 0) { toast.error("No tasks to export"); return; }
    const headers = ["Title", "Status", "Priority", "Due Date", "Created", "Project", "Description"];
    const rows = allTasks.map(t => [
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.due_date ? format(parseISO(t.due_date), "yyyy-MM-dd") : "",
      format(parseISO(t.created_at), "yyyy-MM-dd"),
      projects.find(p => p.id === t.project_id)?.name ?? "",
      `"${(t.description ?? "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadFile(csv, `report-${format(now, "yyyy-MM-dd")}.csv`, "text/csv");
    toast.success("Exported to CSV");
  };

  const handleExportJSON = () => {
    const allTasks = [...stats.completed, ...stats.active];
    if (allTasks.length === 0) { toast.error("No tasks to export"); return; }
    const data = {
      generated: now.toISOString(),
      period: { start: weekStart.toISOString(), end: weekEnd.toISOString() },
      summary: { completed: stats.completed.length, active: stats.active.length, overdue: stats.overdue.length, hoursLogged: stats.totalHours },
      tasks: allTasks.map(t => ({
        title: t.title, status: t.status, priority: t.priority,
        due_date: t.due_date, created_at: t.created_at,
        project: projects.find(p => p.id === t.project_id)?.name ?? null,
        description: t.description,
      })),
    };
    downloadFile(JSON.stringify(data, null, 2), `report-${format(now, "yyyy-MM-dd")}.json`, "application/json");
    toast.success("Exported to JSON");
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Task Report - ${format(now, "MMM d, yyyy")}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; }
            h1 { font-size: 24px; margin-bottom: 4px; }
            h2 { font-size: 18px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; }
            .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
            .stat { padding: 12px; border: 1px solid #e5e5e5; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; }
            .stat-label { font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-size: 13px; }
            th { font-weight: 600; background: #f5f5f5; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
            .urgent { background: #fee2e2; color: #dc2626; }
            .high { background: #ffedd5; color: #ea580c; }
            .medium { background: #fef3c7; color: #d97706; }
            .low { background: #dbeafe; color: #2563eb; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const priorityClass: Record<string, string> = {
    urgent: "urgent", high: "high", medium: "medium", low: "low",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Week of {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> JSON
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Completed This Week", value: stats.completed.length, icon: CheckCircle2, color: "text-success" },
          { label: "Active Tasks", value: stats.active.length, icon: Calendar, color: "text-primary" },
          { label: "Hours Logged", value: stats.totalHours, icon: Clock, color: "text-warning" },
          { label: "Overdue", value: stats.overdue.length, icon: AlertTriangle, color: "text-destructive" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Tasks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Active Tasks ({stats.active.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Task</th>
                  <th className="text-left py-2 px-3 font-medium">Priority</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium">Due Date</th>
                  <th className="text-left py-2 px-3 font-medium">Project</th>
                </tr>
              </thead>
              <tbody>
                {stats.active.map(task => (
                  <tr key={task.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium">{task.title}</td>
                    <td className="py-2 px-3">
                      <Badge variant="outline" className="capitalize text-xs">{task.priority}</Badge>
                    </td>
                    <td className="py-2 px-3 capitalize text-muted-foreground">{task.status.replace("_", " ")}</td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {task.due_date ? format(parseISO(task.due_date), "MMM d") : "—"}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {projects.find(p => p.id === task.project_id)?.name ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Hidden print content */}
      <div ref={printRef} className="hidden">
        <h1>Task Report</h1>
        <p className="subtitle">Week of {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")} · Generated {format(now, "PPp")}</p>
        <div className="stats">
          <div className="stat"><div className="stat-value">{stats.completed.length}</div><div className="stat-label">Completed</div></div>
          <div className="stat"><div className="stat-value">{stats.active.length}</div><div className="stat-label">Active</div></div>
          <div className="stat"><div className="stat-value">{stats.totalHours}</div><div className="stat-label">Hours</div></div>
          <div className="stat"><div className="stat-value">{stats.overdue.length}</div><div className="stat-label">Overdue</div></div>
        </div>
        <h2>Completed This Week ({stats.completed.length})</h2>
        <table>
          <thead><tr><th>Task</th><th>Priority</th></tr></thead>
          <tbody>
            {stats.completed.map(t => (
              <tr key={t.id}><td>{t.title}</td><td><span className={`badge ${priorityClass[t.priority]}`}>{t.priority}</span></td></tr>
            ))}
            {stats.completed.length === 0 && <tr><td colSpan={2}>No tasks completed this week</td></tr>}
          </tbody>
        </table>
        <h2>Active Tasks ({stats.active.length})</h2>
        <table>
          <thead><tr><th>Task</th><th>Priority</th><th>Status</th><th>Due</th></tr></thead>
          <tbody>
            {stats.active.map(t => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td><span className={`badge ${priorityClass[t.priority]}`}>{t.priority}</span></td>
                <td>{t.status.replace("_", " ")}</td>
                <td>{t.due_date ? format(parseISO(t.due_date), "MMM d") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {stats.overdue.length > 0 && (
          <>
            <h2>⚠️ Overdue Tasks ({stats.overdue.length})</h2>
            <table>
              <thead><tr><th>Task</th><th>Due Date</th><th>Priority</th></tr></thead>
              <tbody>
                {stats.overdue.map(t => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{t.due_date ? format(parseISO(t.due_date), "MMM d") : "—"}</td>
                    <td><span className={`badge ${priorityClass[t.priority]}`}>{t.priority}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
