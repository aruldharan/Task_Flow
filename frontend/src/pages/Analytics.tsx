import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTimeLogs } from "@/hooks/useTimeLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, CartesianGrid, Legend
} from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, Target, Flame, AlertTriangle, Clock, Activity, BarChart3 } from "lucide-react";
import { format, subDays, startOfDay, isAfter, parseISO, eachDayOfInterval } from "date-fns";

const STATUS_COLORS = ["hsl(243,75%,59%)", "hsl(38,92%,50%)", "hsl(142,71%,45%)", "hsl(220,9%,46%)"];
const PRIORITY_COLORS = ["hsl(210,40%,52%)", "hsl(38,92%,50%)", "hsl(25,95%,53%)", "hsl(0,84%,60%)"];

const Analytics = () => {
  const { tasks } = useTasks();
  const { projects } = useProjects();

  const statusData = [
    { name: "To Do", value: tasks.filter(t => t.status === "todo").length },
    { name: "In Progress", value: tasks.filter(t => t.status === "in_progress").length },
    { name: "Completed", value: tasks.filter(t => t.status === "completed").length },
    { name: "Archived", value: tasks.filter(t => t.status === "archived").length },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: "Low", count: tasks.filter(t => t.priority === "low").length, fill: PRIORITY_COLORS[0] },
    { name: "Medium", count: tasks.filter(t => t.priority === "medium").length, fill: PRIORITY_COLORS[1] },
    { name: "High", count: tasks.filter(t => t.priority === "high").length, fill: PRIORITY_COLORS[2] },
    { name: "Urgent", count: tasks.filter(t => t.priority === "urgent").length, fill: PRIORITY_COLORS[3] },
  ];

  const completionRate = tasks.length > 0
    ? Math.round((tasks.filter(t => t.status === "completed").length / tasks.length) * 100) : 0;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const urgentOpen = tasks.filter(t => t.priority === "urgent" && t.status !== "completed").length;
  const overdueCount = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed").length;

  // Burndown chart: last 14 days
  const burndownData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
    return days.map(day => {
      const dayStart = startOfDay(day);
      const totalAtDay = tasks.filter(t => !isAfter(parseISO(t.created_at), dayStart)).length;
      const completedAtDay = tasks.filter(t => t.status === "completed" && !isAfter(parseISO(t.updated_at), dayStart)).length;
      const remaining = totalAtDay - completedAtDay;
      return {
        date: format(day, "MMM d"),
        total: totalAtDay,
        completed: completedAtDay,
        remaining: Math.max(0, remaining),
      };
    });
  }, [tasks]);

  // Daily completion trend
  const dailyCompletions = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const completed = tasks.filter(t =>
        t.status === "completed" &&
        format(parseISO(t.updated_at), "yyyy-MM-dd") === dayStr
      ).length;
      const created = tasks.filter(t =>
        format(parseISO(t.created_at), "yyyy-MM-dd") === dayStr
      ).length;
      return { date: format(day, "MMM d"), completed, created };
    });
  }, [tasks]);

  // Velocity: avg tasks completed per day (last 7 days)
  const velocity = useMemo(() => {
    const last7 = dailyCompletions.slice(-7);
    const total = last7.reduce((sum, d) => sum + d.completed, 0);
    return (total / 7).toFixed(1);
  }, [dailyCompletions]);

  const statCards = [
    { label: "Total Tasks", value: totalTasks, icon: Target, color: "text-foreground", bg: "bg-muted" },
    { label: "Completion", value: `${completionRate}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Completed", value: completedTasks, icon: Flame, color: "text-success", bg: "bg-success/10" },
    { label: "Overdue", value: overdueCount, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Velocity", value: `${velocity}/day`, icon: Activity, color: "text-warning", bg: "bg-warning/10" },
    { label: "Urgent Open", value: urgentOpen, icon: Clock, color: "text-priority-urgent", bg: "bg-priority-urgent/10" },
  ];

  const projectStats = projects.map(p => {
    const pTasks = tasks.filter(t => t.project_id === p.id);
    const done = pTasks.filter(t => t.status === "completed").length;
    return { name: p.name, total: pTasks.length, done, progress: pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 0, color: p.color };
  }).filter(p => p.total > 0);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Analytics
        </h1>
        <p className="text-sm text-muted-foreground">Track your productivity and task metrics</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((stat, i) => (
          <Card key={stat.label} className="animate-fade-up hover:shadow-lg transition-all hover:-translate-y-0.5" style={{ animationDelay: `${i * 40}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className={cn("text-xl font-bold tabular-nums", stat.color)}>{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="burndown">Burndown</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="animate-fade-up">
              <CardHeader><CardTitle className="text-base">Status Distribution</CardTitle></CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4} label={({ name, value }) => `${name}: ${value}`}>
                        {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="py-12 text-center text-muted-foreground">No data yet</p>}
              </CardContent>
            </Card>

            <Card className="animate-fade-up">
              <CardHeader><CardTitle className="text-base">Priority Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="burndown" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Burndown Chart (14 Days)</CardTitle>
              <p className="text-xs text-muted-foreground">Remaining tasks over time — ideal trend goes down</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" strokeWidth={2} name="Total Created" />
                  <Area type="monotone" dataKey="remaining" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} name="Remaining" />
                  <Area type="monotone" dataKey="completed" stroke="hsl(var(--success-foreground))" fill="hsl(142 71% 45% / 0.15)" strokeWidth={2} name="Completed" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily Activity (14 Days)</CardTitle>
              <p className="text-xs text-muted-foreground">Tasks created vs completed each day</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={dailyCompletions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="created" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Created" />
                  <Bar dataKey="completed" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Project Progress</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {projectStats.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">No projects with tasks yet</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={projectStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="done" fill="hsl(142 71% 45%)" name="Completed" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="total" fill="hsl(var(--primary))" name="Total" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="space-y-3 mt-4">
                    {projectStats.map(p => (
                      <div key={p.name} className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: p.color ?? "#6366f1" }} />
                        <span className="text-sm font-medium w-32 truncate">{p.name}</span>
                        <Progress value={p.progress} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">{p.done}/{p.total}</span>
                        <Badge variant="secondary" className="text-[10px]">{p.progress}%</Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
