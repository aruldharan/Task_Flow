import { useState, useMemo } from "react";
import { useHabits } from "@/hooks/useHabits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Repeat, Check, Flame, TrendingUp, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { format, subDays, startOfDay, differenceInDays } from "date-fns";

const ICONS = ["✅", "💪", "📖", "🧘", "🏃", "💧", "🎯", "✍️"];

export const HabitTracker = () => {
  const { habits, completions, createHabit, deleteHabit, toggleCompletion } = useHabits();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("✅");
  const [showStats, setShowStats] = useState(false);

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    return { date: format(d, "yyyy-MM-dd"), label: format(d, "EEE"), dayNum: format(d, "d"), isToday: i === 6 };
  });

  const isCompleted = (habitId: string, date: string) =>
    completions.some(c => c.habit_id === habitId && c.completed_date === date);

  // Calculate stats per habit
  const habitStats = useMemo(() => {
    const now = new Date();
    const weekAgo = format(subDays(now, 6), "yyyy-MM-dd");
    const monthAgo = format(subDays(now, 29), "yyyy-MM-dd");

    return habits.map(habit => {
      const habitCompletions = completions.filter(c => c.habit_id === habit.id);
      const weekCompletions = habitCompletions.filter(c => c.completed_date >= weekAgo).length;
      const monthCompletions = habitCompletions.filter(c => c.completed_date >= monthAgo).length;

      // Calculate current streak
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const checkDate = format(subDays(now, i), "yyyy-MM-dd");
        if (habitCompletions.some(c => c.completed_date === checkDate)) {
          streak++;
        } else {
          // Allow skipping today if it hasn't been completed yet
          if (i === 0) continue;
          break;
        }
      }

      // Best streak (from available data - last 30 days)
      let bestStreak = 0;
      let currentRun = 0;
      for (let i = 29; i >= 0; i--) {
        const checkDate = format(subDays(now, i), "yyyy-MM-dd");
        if (habitCompletions.some(c => c.completed_date === checkDate)) {
          currentRun++;
          bestStreak = Math.max(bestStreak, currentRun);
        } else {
          currentRun = 0;
        }
      }

      const weekRate = Math.round((weekCompletions / 7) * 100);
      const monthRate = Math.round((monthCompletions / 30) * 100);

      return {
        habitId: habit.id,
        streak,
        bestStreak,
        weekCompletions,
        monthCompletions,
        weekRate,
        monthRate,
      };
    });
  }, [habits, completions]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createHabit.mutateAsync({ name: newName.trim(), icon: selectedIcon });
    setNewName("");
    setSelectedIcon("✅");
    setAdding(false);
  };

  const todayCompleted = habits.filter(h => isCompleted(h.id, todayStr)).length;
  const todayTotal = habits.length;
  const overallWeekRate = todayTotal > 0
    ? Math.round(habitStats.reduce((sum, s) => sum + s.weekRate, 0) / todayTotal)
    : 0;

  return (
    <Card className="animate-fade-up" style={{ animationDelay: "450ms" }}>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
          Daily Habits
          {todayTotal > 0 && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              {todayCompleted}/{todayTotal} today
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-1">
          {habits.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {showStats ? "Grid" : "Stats"}
              {showStats ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAdding(!adding)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add habit form */}
        {adding && (
          <div className="space-y-2 p-3 rounded-lg border border-dashed border-border bg-muted/30">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="New habit name..."
              className="h-8 text-sm"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setSelectedIcon(icon)}
                    className={cn(
                      "h-7 w-7 rounded-md text-sm flex items-center justify-center transition-all",
                      selectedIcon === icon ? "bg-primary/15 ring-1 ring-primary/40 scale-110" : "hover:bg-muted"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAdding(false)}>Cancel</Button>
                <Button size="sm" className="h-7 text-xs" onClick={handleAdd} disabled={!newName.trim()}>Add</Button>
              </div>
            </div>
          </div>
        )}

        {habits.length === 0 && !adding ? (
          <div className="py-6 text-center">
            <Repeat className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No habits yet. Add one to start tracking!</p>
          </div>
        ) : showStats ? (
          /* Stats View */
          <div className="space-y-3">
            {/* Overall summary */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-primary tabular-nums">{overallWeekRate}%</p>
                <p className="text-[10px] text-muted-foreground">Week avg</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-warning tabular-nums">
                  {Math.max(...habitStats.map(s => s.streak), 0)}
                </p>
                <p className="text-[10px] text-muted-foreground">Best streak</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-success tabular-nums">
                  {habitStats.reduce((sum, s) => sum + s.monthCompletions, 0)}
                </p>
                <p className="text-[10px] text-muted-foreground">Month total</p>
              </div>
            </div>

            {/* Per-habit stats */}
            {habits.map(habit => {
              const stats = habitStats.find(s => s.habitId === habit.id);
              if (!stats) return null;
              return (
                <div key={habit.id} className="p-3 rounded-lg border border-border/50 space-y-2.5 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{habit.icon}</span>
                      <span className="text-sm font-medium">{habit.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stats.streak > 0 && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Flame className="h-3 w-3 text-warning" /> {stats.streak}d
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={() => deleteHabit.mutate(habit.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">This week</span>
                        <span className="text-[10px] font-semibold tabular-nums">{stats.weekCompletions}/7</span>
                      </div>
                      <Progress value={stats.weekRate} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">This month</span>
                        <span className="text-[10px] font-semibold tabular-nums">{stats.monthCompletions}/30</span>
                      </div>
                      <Progress value={stats.monthRate} className="h-1.5" />
                    </div>
                  </div>
                  {stats.bestStreak > 1 && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      Best streak: {stats.bestStreak} days
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid View */
          <>
            {habits.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex-1" />
                {days.map(day => (
                  <div key={day.date} className={cn("w-8 text-center", day.isToday && "font-semibold")}>
                    <p className="text-[9px] text-muted-foreground leading-none">{day.label}</p>
                    <p className={cn("text-[10px] leading-tight", day.isToday ? "text-primary" : "text-muted-foreground")}>{day.dayNum}</p>
                  </div>
                ))}
                <div className="w-6" />
              </div>
            )}

            {habits.map(habit => {
              const stats = habitStats.find(s => s.habitId === habit.id);
              return (
                <div key={habit.id} className="flex items-center gap-1 group">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm">{habit.icon}</span>
                    <span className="text-sm truncate">{habit.name}</span>
                    {stats && stats.streak > 0 && (
                      <span className="text-[9px] text-warning font-semibold shrink-0">🔥{stats.streak}</span>
                    )}
                  </div>
                  {days.map(day => {
                    const done = isCompleted(habit.id, day.date);
                    return (
                      <button
                        key={day.date}
                        onClick={() => toggleCompletion.mutate({ habitId: habit.id, date: day.date })}
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                          done
                            ? "bg-success/15 text-success hover:bg-success/25"
                            : day.isToday
                              ? "border border-dashed border-primary/30 hover:bg-primary/10"
                              : "border border-transparent hover:bg-muted"
                        )}
                      >
                        {done && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-destructive"
                    onClick={() => deleteHabit.mutate(habit.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
};
