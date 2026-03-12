import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Workflow, Zap, Plus, Trash2, Play, Settings2 } from "lucide-react";

// Automation rules stored in localStorage
interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: "status_change" | "priority_change" | "due_date_passed" | "task_created";
  triggerValue?: string;
  action: "change_status" | "change_priority" | "create_notification";
  actionValue: string;
}

const RULES_KEY = "taskflow-automation-rules";

const loadRules = (): AutomationRule[] => {
  try { return JSON.parse(localStorage.getItem(RULES_KEY) ?? "[]"); }
  catch { return []; }
};

const saveRules = (rules: AutomationRule[]) => {
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
};

const triggerLabels: Record<string, string> = {
  status_change: "When status changes to",
  priority_change: "When priority changes to",
  due_date_passed: "When due date passes",
  task_created: "When task is created",
};

const actionLabels: Record<string, string> = {
  change_status: "Change status to",
  change_priority: "Change priority to",
  create_notification: "Create notification",
};

const Workflows = () => {
  const { tasks, updateTask } = useTasks();
  const [rules, setRules] = useState<AutomationRule[]>(loadRules);
  const [showNew, setShowNew] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    trigger: "status_change",
    action: "change_status",
    enabled: true,
  });

  const updateRules = (updated: AutomationRule[]) => {
    setRules(updated);
    saveRules(updated);
  };

  const handleAddRule = () => {
    if (!newRule.name?.trim()) { toast.error("Give your rule a name"); return; }
    const rule: AutomationRule = {
      id: Date.now().toString(),
      name: newRule.name!.trim(),
      enabled: true,
      trigger: newRule.trigger as any,
      triggerValue: newRule.triggerValue,
      action: newRule.action as any,
      actionValue: newRule.actionValue ?? "",
    };
    updateRules([...rules, rule]);
    setNewRule({ trigger: "status_change", action: "change_status", enabled: true });
    setShowNew(false);
    toast.success("Automation rule created");
  };

  const toggleRule = (id: string) => {
    updateRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    updateRules(rules.filter(r => r.id !== id));
    toast.success("Rule deleted");
  };

  // Run automations manually
  const runAutomations = () => {
    const enabledRules = rules.filter(r => r.enabled);
    let applied = 0;

    for (const rule of enabledRules) {
      for (const task of tasks) {
        if (task.status === "completed" || task.status === "archived") continue;

        let matches = false;

        if (rule.trigger === "due_date_passed" && task.due_date && new Date(task.due_date) < new Date()) {
          matches = true;
        }
        if (rule.trigger === "status_change" && rule.triggerValue && task.status === rule.triggerValue) {
          matches = true;
        }
        if (rule.trigger === "priority_change" && rule.triggerValue && task.priority === rule.triggerValue) {
          matches = true;
        }

        if (matches) {
          if (rule.action === "change_status" && rule.actionValue) {
            updateTask.mutate({ id: task.id, status: rule.actionValue as any });
            applied++;
          }
          if (rule.action === "change_priority" && rule.actionValue) {
            updateTask.mutate({ id: task.id, priority: rule.actionValue as any });
            applied++;
          }
        }
      }
    }

    toast.success(applied > 0 ? `Applied ${applied} automation(s)` : "No matching tasks found");
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Workflow className="h-6 w-6 text-primary" /> Workflows
          </h1>
          <p className="text-sm text-muted-foreground">Create automation rules for your tasks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={runAutomations} disabled={rules.filter(r => r.enabled).length === 0}>
            <Play className="h-3.5 w-3.5" /> Run Now
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}>
            <Plus className="h-3.5 w-3.5" /> New Rule
          </Button>
        </div>
      </div>

      {/* New rule form */}
      {showNew && (
        <Card className="animate-fade-up border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> New Automation Rule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Rule Name</Label>
              <Input
                value={newRule.name ?? ""}
                onChange={e => setNewRule(r => ({ ...r, name: e.target.value }))}
                placeholder="e.g., Auto-archive overdue tasks"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">When (Trigger)</Label>
                <Select value={newRule.trigger} onValueChange={v => setNewRule(r => ({ ...r, trigger: v as any }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status_change">Status equals</SelectItem>
                    <SelectItem value="priority_change">Priority equals</SelectItem>
                    <SelectItem value="due_date_passed">Due date has passed</SelectItem>
                    <SelectItem value="task_created">Task is created</SelectItem>
                  </SelectContent>
                </Select>
                {(newRule.trigger === "status_change") && (
                  <Select value={newRule.triggerValue ?? ""} onValueChange={v => setNewRule(r => ({ ...r, triggerValue: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select status..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {(newRule.trigger === "priority_change") && (
                  <Select value={newRule.triggerValue ?? ""} onValueChange={v => setNewRule(r => ({ ...r, triggerValue: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select priority..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Then (Action)</Label>
                <Select value={newRule.action} onValueChange={v => setNewRule(r => ({ ...r, action: v as any }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="change_status">Change status</SelectItem>
                    <SelectItem value="change_priority">Change priority</SelectItem>
                    <SelectItem value="create_notification">Create notification</SelectItem>
                  </SelectContent>
                </Select>
                {(newRule.action === "change_status") && (
                  <Select value={newRule.actionValue ?? ""} onValueChange={v => setNewRule(r => ({ ...r, actionValue: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Target status..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {(newRule.action === "change_priority") && (
                  <Select value={newRule.actionValue ?? ""} onValueChange={v => setNewRule(r => ({ ...r, actionValue: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Target priority..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddRule}>Create Rule</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing rules */}
      {rules.length === 0 && !showNew ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Workflow className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground font-medium">No automation rules yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create rules to automate repetitive task management</p>
            <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => setShowNew(true)}>
              <Plus className="h-3.5 w-3.5" /> Create First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <Card key={rule.id} className="animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              <CardContent className="p-4 flex items-center gap-4">
                <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", !rule.enabled && "text-muted-foreground")}>{rule.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {triggerLabels[rule.trigger]}{rule.triggerValue ? ` "${rule.triggerValue}"` : ""} → {actionLabels[rule.action]}{rule.actionValue ? ` "${rule.actionValue}"` : ""}
                  </p>
                </div>
                <Badge variant={rule.enabled ? "default" : "secondary"} className="text-[10px]">
                  {rule.enabled ? "Active" : "Disabled"}
                </Badge>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteRule(rule.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workflows;
