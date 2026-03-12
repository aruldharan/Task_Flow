import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { LayoutDashboard, CheckSquare, Columns3, CalendarDays, BarChart3, FolderOpen, Settings, Flag, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";

const priorityDot: Record<string, string> = {
  low: "bg-priority-low",
  medium: "bg-priority-medium",
  high: "bg-priority-high",
  urgent: "bg-priority-urgent",
};

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { projects } = useProjects();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (path: string) => { navigate(path); setOpen(false); };
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile && (
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setOpen(true)}>
          <Search className="h-5 w-5 text-muted-foreground" />
        </Button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search tasks, projects, pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => go("/")}><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</CommandItem>
          <CommandItem onSelect={() => go("/tasks")}><CheckSquare className="mr-2 h-4 w-4" /> Tasks</CommandItem>
          <CommandItem onSelect={() => go("/kanban")}><Columns3 className="mr-2 h-4 w-4" /> Kanban</CommandItem>
          <CommandItem onSelect={() => go("/calendar")}><CalendarDays className="mr-2 h-4 w-4" /> Calendar</CommandItem>
          <CommandItem onSelect={() => go("/analytics")}><BarChart3 className="mr-2 h-4 w-4" /> Analytics</CommandItem>
          <CommandItem onSelect={() => go("/settings")}><Settings className="mr-2 h-4 w-4" /> Settings</CommandItem>
        </CommandGroup>
        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.map(p => (
                <CommandItem key={p.id} onSelect={() => go(`/project/${p.id}`)}>
                  <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: p.color ?? "#6366f1" }} />
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {tasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tasks">
              {tasks.slice(0, 10).map(t => (
                <CommandItem key={t.id} onSelect={() => go("/tasks")}>
                  <div className={cn("mr-2 h-2.5 w-2.5 rounded-full", priorityDot[t.priority])} />
                  <span className="truncate">{t.title}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground capitalize">{t.status.replace("_", " ")}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
      </CommandDialog>
    </>
  );
};
