import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Flame, TrendingUp, Target, Zap } from "lucide-react";
import { isToday, differenceInCalendarDays, parseISO } from "date-fns";

export const ProductivityScore = () => {
  const { tasks } = useTasks();

  const { score, completedToday, streak, level } = useMemo(() => {
    const completed = tasks.filter(t => t.status === "completed");
    const completedToday = completed.filter(t => isToday(parseISO(t.updated_at))).length;
    const total = tasks.length;
    const completionRate = total > 0 ? (completed.length / total) * 100 : 0;

    // Calculate streak: consecutive days with completions
    const completionDates = [...new Set(
      completed.map(t => parseISO(t.updated_at).toDateString())
    )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < completionDates.length; i++) {
      const diff = differenceInCalendarDays(today, new Date(completionDates[i]));
      if (diff === i || (i === 0 && diff <= 1)) {
        streak++;
      } else break;
    }

    // Score: weighted mix of completion rate, today's tasks, and streak
    const score = Math.min(100, Math.round(
      completionRate * 0.4 +
      Math.min(completedToday * 15, 30) +
      Math.min(streak * 5, 30)
    ));

    const level = score >= 80 ? "On Fire" : score >= 60 ? "Productive" : score >= 40 ? "Steady" : "Getting Started";

    return { score, completedToday, streak, level };
  }, [tasks]);

  const scoreColor = score >= 80 ? "text-success" : score >= 60 ? "text-primary" : score >= 40 ? "text-warning" : "text-muted-foreground";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">Productivity</h3>
          </div>
          <Badge variant="secondary" className="text-xs">{level}</Badge>
        </div>

        <div className="flex items-center gap-6">
          {/* Score ring */}
          <div className="relative shrink-0">
            <svg className="w-20 h-20 -rotate-90">
              <circle cx="40" cy="40" r="34" stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
              <circle
                cx="40" cy="40" r="34"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - score / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-xl font-bold", scoreColor)}>{score}</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-success" />
              <span className="text-sm"><strong>{completedToday}</strong> done today</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className={cn("h-4 w-4", streak > 0 ? "text-warning" : "text-muted-foreground")} />
              <span className="text-sm"><strong>{streak}</strong> day streak</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm"><strong>{tasks.filter(t => t.status === "completed").length}</strong>/{tasks.length} completed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
