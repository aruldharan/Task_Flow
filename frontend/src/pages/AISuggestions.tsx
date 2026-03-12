import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2, Plus, ArrowUpDown, Layers, Lightbulb } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Suggestion {
  title: string;
  priority: string;
  description: string;
}

interface Recommendation {
  task_title: string;
  recommended_priority: string;
  reason: string;
}

interface Subtask {
  title: string;
  priority: string;
}

const priorityColors: Record<string, string> = {
  low: "bg-priority-low/15 text-priority-low",
  medium: "bg-priority-medium/15 text-priority-medium",
  high: "bg-priority-high/15 text-priority-high",
  urgent: "bg-priority-urgent/15 text-priority-urgent",
};

const AISuggestions = () => {
  const { tasks, createTask } = useTasks();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("suggest");
  const [context, setContext] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recommendations, setRecommendations] = useState<{ recommendations: Recommendation[]; summary: string } | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [breakdownTask, setBreakdownTask] = useState("");

  const callAI = async (type: string, extra?: any) => {
    setLoading(true);
    try {
      const activeTasks = tasks.filter(t => t.status !== "completed" && t.status !== "archived");
      const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/ai-tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type,
          tasks: activeTasks.map((t: any) => ({
            title: t.title,
            status: t.status,
            priority: t.priority,
            due_date: t.due_date,
          })),
          context: extra ?? context,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const result = data?.result;
      if (type === "suggest") setSuggestions(result?.suggestions ?? []);
      else if (type === "prioritize") setRecommendations(result);
      else if (type === "breakdown") setSubtasks(result?.subtasks ?? []);
    } catch (err: any) {
      toast.error(err.message || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  const addSuggestion = (s: Suggestion) => {
    createTask.mutate({
      title: s.title,
      description: s.description,
      priority: s.priority as any,
      status: "todo",
    });
  };

  const addSubtask = (s: Subtask, parentId?: string) => {
    createTask.mutate({
      title: s.title,
      priority: s.priority as any,
      status: "todo",
      parent_task_id: parentId,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> AI Assistant
          </h1>
          <p className="text-sm text-muted-foreground">Smart suggestions, task breakdown, and priority analysis</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="suggest" className="gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" /> Suggest
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Breakdown
          </TabsTrigger>
          <TabsTrigger value="prioritize" className="gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5" /> Prioritize
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggest" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <Textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="Optional: describe what you're working on for better suggestions..."
                rows={2}
                className="text-sm"
              />
              <Button onClick={() => callAI("suggest")} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Get Suggestions
              </Button>
            </CardContent>
          </Card>

          {suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <Card key={i} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{s.title}</p>
                        <Badge className={cn("text-[10px]", priorityColors[s.priority])}>{s.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={() => addSuggestion(s)}>
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <Textarea
                value={breakdownTask}
                onChange={e => setBreakdownTask(e.target.value)}
                placeholder="Describe the task you want to break down..."
                rows={2}
                className="text-sm"
              />
              <Button onClick={() => callAI("breakdown", { title: breakdownTask })} disabled={loading || !breakdownTask.trim()} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
                Break Down Task
              </Button>
            </CardContent>
          </Card>

          {subtasks.length > 0 && (
            <div className="space-y-2">
              {subtasks.map((s, i) => (
                <Card key={i} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{s.title}</p>
                        <Badge className={cn("text-[10px]", priorityColors[s.priority])}>{s.priority}</Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={() => addSubtask(s)}>
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="prioritize" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <Button onClick={() => callAI("prioritize")} disabled={loading || tasks.length === 0} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpDown className="h-4 w-4" />}
                Analyze Priorities
              </Button>
              {tasks.length === 0 && <p className="text-xs text-muted-foreground mt-2">Create some tasks first</p>}
            </CardContent>
          </Card>

          {recommendations && (
            <div className="space-y-3">
              {recommendations.summary && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <p className="text-sm">{recommendations.summary}</p>
                  </CardContent>
                </Card>
              )}
              {recommendations.recommendations.map((r, i) => (
                <Card key={i} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium flex-1">{r.task_title}</p>
                      <Badge className={cn("text-[10px]", priorityColors[r.recommended_priority])}>
                        → {r.recommended_priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.reason}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AISuggestions;
