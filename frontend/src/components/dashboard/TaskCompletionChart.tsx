import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns";
import { TrendingUp } from "lucide-react";

export const TaskCompletionChart = () => {
  const { tasks } = useTasks();

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const completed = tasks.filter(
        t => t.status === "completed" && format(parseISO(t.updated_at), "yyyy-MM-dd") === dayStr
      ).length;
      const created = tasks.filter(
        t => format(parseISO(t.created_at), "yyyy-MM-dd") === dayStr
      ).length;
      return { date: format(day, "EEE"), completed, created };
    });
  }, [tasks]);

  const totalCompleted = chartData.reduce((s, d) => s + d.completed, 0);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Weekly Activity
          </CardTitle>
          <span className="text-xs text-muted-foreground">{totalCompleted} completed this week</span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Area type="monotone" dataKey="created" stroke="hsl(var(--success))" fill="url(#createdGrad)" strokeWidth={2} name="Created" />
            <Area type="monotone" dataKey="completed" stroke="hsl(var(--primary))" fill="url(#completedGrad)" strokeWidth={2} name="Completed" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
