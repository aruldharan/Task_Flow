import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTasks } from "@/hooks/useTasks";
import { useTimeLogs } from "@/hooks/useTimeLogs";
import { useHabits } from "@/hooks/useHabits";
import { BarChart3, CheckCircle2, Clock, Flame, TrendingUp } from "lucide-react";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";

export const WeeklyReviewWidget = () => {
  const { tasks } = useTasks();
  const { timeLogs } = useTimeLogs();
  const { habits, completions } = useHabits();

  const weekStats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const completedThisWeek = tasks.filter(t => {
      if (t.status !== "completed") return false;
      const updated = parseISO(t.updated_at);
      return isWithinInterval(updated, { start: weekStart, end: weekEnd });
    }).length;

    const totalTimeSeconds = (timeLogs ?? [])
      .filter(log => {
        const started = parseISO(log.started_at);
        return isWithinInterval(started, { start: weekStart, end: weekEnd });
      })
      .reduce((sum, log) => sum + (log.duration_seconds ?? 0), 0);

    const totalHours = Math.round(totalTimeSeconds / 3600 * 10) / 10;

    const habitsCompletedThisWeek = (completions ?? []).filter(c => {
      const date = parseISO(c.completed_date);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    }).length;

    const createdThisWeek = tasks.filter(t => {
      const created = parseISO(t.created_at);
      return isWithinInterval(created, { start: weekStart, end: weekEnd });
    }).length;

    return { completedThisWeek, totalHours, habitsCompletedThisWeek, createdThisWeek };
  }, [tasks, timeLogs, completions]);

  const metrics = [
    { label: "Tasks Done", value: weekStats.completedThisWeek, icon: CheckCircle2, color: "text-success" },
    { label: "Hours Logged", value: weekStats.totalHours, icon: Clock, color: "text-primary" },
    { label: "Habits Done", value: weekStats.habitsCompletedThisWeek, icon: Flame, color: "text-warning" },
    { label: "Tasks Created", value: weekStats.createdThisWeek, icon: TrendingUp, color: "text-secondary-foreground" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Weekly Review
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <m.icon className={`h-5 w-5 ${m.color}`} />
              <div>
                <p className="text-lg font-bold tabular-nums">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
