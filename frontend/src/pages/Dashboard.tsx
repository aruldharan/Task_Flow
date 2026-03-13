import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import { useSmartReminders } from "@/hooks/useSmartReminders";
import { useDueReminders } from "@/hooks/useDueReminders";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskTemplates } from "@/components/tasks/TaskTemplates";
import { TaskCard } from "@/components/tasks/TaskCard";
import { StreakWidget } from "@/components/dashboard/StreakWidget";
import { QuickAddWidget } from "@/components/dashboard/QuickAddWidget";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { HabitTracker } from "@/components/dashboard/HabitTracker";
import { DailyJournal } from "@/components/dashboard/DailyJournal";
import { DailyQuoteWidget } from "@/components/dashboard/DailyQuoteWidget";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { GoalTrackerWidget } from "@/components/dashboard/GoalTrackerWidget";
import { WeeklyReviewWidget } from "@/components/dashboard/WeeklyReviewWidget";
import { PinnedTasksWidget } from "@/components/dashboard/PinnedTasksWidget";
import { TaskCompletionChart } from "@/components/dashboard/TaskCompletionChart";
import { DraggableDashboard, WidgetConfig } from "@/components/dashboard/DraggableDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock, AlertTriangle, TrendingUp, Zap, Target, ArrowRight, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const Dashboard = () => {
  const { tasks, isLoading } = useTasks();
  const { projects } = useProjects();
  const { user } = useAuth();
  const { isOwner } = useUserRole();
  const { profile } = useProfile();
  useSmartReminders();
  useDueReminders();

  const todoCount = tasks.filter(t => t.status === "todo").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const urgentCount = tasks.filter(t => t.priority === "urgent" && t.status !== "completed").length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const recentTasks = tasks.filter(t => t.status !== "completed").slice(0, 5);
  
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    let text = "Good morning";
    if (hour >= 12 && hour < 17) text = "Good afternoon";
    else if (hour >= 17 && hour < 21) text = "Good evening";
    else if (hour >= 21 || hour < 5) text = "Good night";
    
    const name = profile?.display_name?.split(" ")[0] || user?.display_name?.split(" ")[0] || "there";
    return `${text}, ${name}`;
  }, [profile, user]);

  const stats = [
    { label: "To Do", value: todoCount, icon: Target, color: "text-primary", bg: "bg-primary/10", ring: "ring-primary/20" },
    { label: "In Progress", value: inProgressCount, icon: Clock, color: "text-warning", bg: "bg-warning/10", ring: "ring-warning/20" },
    { label: "Completed", value: completedCount, icon: CheckSquare, color: "text-success", bg: "bg-success/10", ring: "ring-success/20" },
    { label: "Urgent", value: urgentCount, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", ring: "ring-destructive/20" },
  ];

  const widgets: WidgetConfig[] = useMemo(() => [
    {
      id: "pinned",
      label: "Pinned",
      span: "full",
      component: <PinnedTasksWidget />,
    },
    {
      id: "quote",
      label: "Daily Quote",
      span: "full",
      component: <DailyQuoteWidget />,
    },
    {
      id: "weather",
      label: "Weather",
      span: "1",
      component: <WeatherWidget />,
    },
    {
      id: "streak",
      label: "Streak",
      span: "1",
      component: <StreakWidget />,
    },
    {
      id: "quick-add",
      label: "Quick Add",
      span: "1",
      component: <QuickAddWidget />,
    },
    {
      id: "productivity",
      label: "Productivity",
      span: "full",
      component: tasks.length > 0 ? (
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardContent className="p-5 flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 shadow-lg shadow-primary/10">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Productivity Score</p>
              <div className="flex items-center gap-3 mt-1.5">
                <Progress value={completionRate} className="h-2.5 flex-1" />
                <span className="text-sm font-bold text-primary tabular-nums">{completionRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : <div />,
    },
    {
      id: "chart",
      label: "Weekly Chart",
      span: "full",
      component: <TaskCompletionChart />,
    },
    {
      id: "goals",
      label: "Goals",
      span: "1",
      component: <GoalTrackerWidget />,
    },
    {
      id: "weekly-review",
      label: "Weekly Review",
      span: "1",
      component: <WeeklyReviewWidget />,
    },
    {
      id: "habits",
      label: "Habits",
      span: "full",
      component: <HabitTracker />,
    },
    {
      id: "active-tasks",
      label: "Active Tasks",
      span: "1",
      component: (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Active Tasks</CardTitle>
            <Link to="/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="py-8 text-center">
                <Target className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No active tasks. Create one!</p>
              </div>
            ) : (
              recentTasks.map(task => <TaskCard key={task.id} task={task} />)
            )}
          </CardContent>
        </Card>
      ),
    },
    {
      id: "projects",
      label: "Projects",
      span: "1",
      component: (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Projects</CardTitle>
            <span className="text-xs text-muted-foreground">{projects.length} total</span>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="py-8 text-center">
                <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Create a project from the sidebar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map(project => {
                  const projectTasks = tasks.filter(t => t.project_id === project.id);
                  const done = projectTasks.filter(t => t.status === "completed").length;
                  const progress = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0;
                  return (
                    <Link
                      key={project.id}
                      to={`/project/${project.id}`}
                      className="flex items-center gap-3 rounded-xl p-3 hover:bg-accent transition-all duration-200 group hover:-translate-x-0.5"
                    >
                      <div className="h-4 w-4 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-card" style={{ backgroundColor: project.color ?? "#6366f1", boxShadow: `0 0 8px ${project.color ?? "#6366f1"}40` }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={progress} className="h-1.5 flex-1" />
                          <span className="text-[10px] text-muted-foreground tabular-nums">{done}/{projectTasks.length}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ),
    },
    {
      id: "activity",
      label: "Activity",
      span: "1",
      component: <ActivityFeed />,
    },
    {
      id: "journal",
      label: "Journal",
      span: "1",
      component: <DailyJournal />,
    },
  ], [tasks, projects, isLoading, recentTasks, completionRate, stats]);

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{greeting} 👋</h1>
            {isOwner && <Badge variant="outline" className="text-[10px] gap-1"><Crown className="h-3 w-3 text-warning" />Owner</Badge>}
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            {tasks.length === 0 ? "Create your first task to get started" : `You have ${todoCount + inProgressCount} active tasks`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TaskTemplates />
          <CreateTaskDialog />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={stat.label} className={cn("animate-fade-up glass-stat hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5")} style={{ animationDelay: `${100 + i * 50}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1", stat.bg, stat.ring)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold tabular-nums">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Draggable Widgets */}
      <DraggableDashboard widgets={widgets} />
    </div>
  );
};

export default Dashboard;
