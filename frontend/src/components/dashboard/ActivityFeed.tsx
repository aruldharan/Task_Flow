import { useTasks } from "@/hooks/useTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, Plus, ArrowRight, Clock } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";

export const ActivityFeed = () => {
  const { tasks } = useTasks();

  const recentActivity = [...tasks]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 8)
    .map(task => {
      const updated = new Date(task.updated_at);
      const created = new Date(task.created_at);
      const isNew = Math.abs(updated.getTime() - created.getTime()) < 60000;
      return {
        id: task.id,
        title: task.title,
        action: task.status === "completed" ? "completed" : isNew ? "created" : "updated",
        time: updated,
        status: task.status,
      };
    });

  const formatTime = (date: Date) => {
    if (isToday(date)) return `Today ${format(date, "h:mm a")}`;
    if (isYesterday(date)) return `Yesterday ${format(date, "h:mm a")}`;
    return format(date, "MMM d, h:mm a");
  };

  const actionConfig = {
    created: { icon: Plus, color: "text-primary", bg: "bg-primary/10" },
    updated: { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  };

  return (
    <Card className="animate-fade-up" style={{ animationDelay: "400ms" }}>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
        ) : (
          <div className="space-y-1">
            {recentActivity.map((item) => {
              const config = actionConfig[item.action as keyof typeof actionConfig];
              const Icon = config.icon;
              return (
                <div key={item.id + item.action} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-full shrink-0", config.bg)}>
                    <Icon className={cn("h-3.5 w-3.5", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium">{item.title}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">{item.action} · {formatTime(item.time)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
