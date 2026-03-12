import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoals, Goal } from "@/hooks/useGoals";
import { Target, Plus, Minus, Trash2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const GoalTrackerWidget = () => {
  const { goals, createGoal, updateGoal, deleteGoal } = useGoals();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("5");
  const [period, setPeriod] = useState("weekly");

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createGoal.mutateAsync({
      title: title.trim(),
      target_value: parseInt(target) || 5,
      period,
    });
    setTitle("");
    setTarget("5");
    setShowForm(false);
  };

  const increment = (goal: Goal) => {
    if (goal.current_value < goal.target_value) {
      updateGoal.mutate({ id: goal.id, current_value: goal.current_value + 1 });
    }
  };

  const decrement = (goal: Goal) => {
    if (goal.current_value > 0) {
      updateGoal.mutate({ id: goal.id, current_value: goal.current_value - 1 });
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Goals
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
            <Input
              placeholder="Goal title (e.g. Complete 5 tasks)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Target"
                value={target}
                onChange={e => setTarget(e.target.value)}
                className="w-20"
                min={1}
              />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleCreate} disabled={createGoal.isPending}>
                Save
              </Button>
            </div>
          </div>
        )}

        {goals.length === 0 && !showForm ? (
          <div className="py-6 text-center">
            <Trophy className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Set your first goal!</p>
          </div>
        ) : (
          goals.map(goal => {
            const progress = Math.round((goal.current_value / goal.target_value) * 100);
            const isComplete = goal.current_value >= goal.target_value;
            return (
              <div
                key={goal.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  isComplete ? "bg-success/5 border-success/20" : "bg-card border-border"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm font-medium truncate", isComplete && "line-through text-muted-foreground")}>
                      {goal.title}
                    </p>
                    {isComplete && <Trophy className="h-3.5 w-3.5 text-success shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={progress} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {goal.current_value}/{goal.target_value}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize px-1.5 py-0.5 rounded bg-muted">
                      {goal.period}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => decrement(goal)} disabled={goal.current_value <= 0}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => increment(goal)} disabled={isComplete}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteGoal.mutate(goal.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
