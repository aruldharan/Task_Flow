import { useTasks } from "@/hooks/useTasks";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { isToday, isYesterday, subDays, startOfDay } from "date-fns";

export const StreakWidget = () => {
  const { tasks } = useTasks();

  // Calculate streak: consecutive days with completed tasks
  const completedTasks = tasks.filter(t => t.status === "completed");
  const completedToday = completedTasks.filter(t => isToday(new Date(t.updated_at))).length;

  let streak = 0;
  let checkDate = startOfDay(new Date());
  
  // If nothing completed today, start checking from yesterday
  if (completedToday === 0) {
    checkDate = subDays(checkDate, 1);
  }

  for (let i = 0; i < 365; i++) {
    const dayStart = subDays(startOfDay(new Date()), completedToday === 0 ? i + 1 : i);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    const hasCompletion = completedTasks.some(t => {
      const d = new Date(t.updated_at);
      return d >= dayStart && d <= dayEnd;
    });

    if (hasCompletion) {
      streak++;
    } else {
      break;
    }
  }

  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const count = completedTasks.filter(t => {
      const d = new Date(t.updated_at);
      return d >= dayStart && d <= dayEnd;
    }).length;
    return { day: weekDays[dayStart.getDay() === 0 ? 6 : dayStart.getDay() - 1], count };
  });

  const maxCount = Math.max(...last7.map(d => d.count), 1);

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-r from-warning/10 via-warning/5 to-transparent animate-fade-up" style={{ animationDelay: "50ms" }}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/15 shadow-lg shadow-warning/10">
              <Flame className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm font-semibold">Current Streak</p>
              <p className="text-2xl font-bold text-warning tabular-nums">{streak} day{streak !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-success">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">{completedToday} today</span>
            </div>
          </div>
        </div>
        
        {/* Mini heatmap */}
        <div className="flex items-end gap-1.5 justify-between">
          {last7.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={cn(
                  "w-full rounded-sm transition-all",
                  d.count > 0 ? "bg-warning" : "bg-muted"
                )}
                style={{
                  height: `${Math.max(4, (d.count / maxCount) * 32)}px`,
                  opacity: d.count > 0 ? 0.4 + (d.count / maxCount) * 0.6 : 0.3,
                }}
              />
              <span className="text-[9px] text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
