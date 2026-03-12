import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CheckSquare, Columns3, CalendarDays,
  BarChart3, LogOut, Plus, ChevronLeft, ChevronRight, Search,
  Shield, Crown, Settings, Brain, Sparkles, GanttChart, Workflow, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { Badge } from "@/components/ui/badge";
import { PomodoroTimer } from "@/components/PomodoroTimer";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", key: "1" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks", key: "2" },
  { to: "/kanban", icon: Columns3, label: "Kanban", key: "3" },
  { to: "/timeline", icon: GanttChart, label: "Timeline", key: "4" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar", key: "5" },
  { to: "/analytics", icon: BarChart3, label: "Analytics", key: "6" },
//  { to: "/ai", icon: Sparkles, label: "AI Assistant", key: "7" },
//  { to: "/workflows", icon: Workflow, label: "Workflows", key: "8" },
  { to: "/focus", icon: Brain, label: "Focus Mode", key: "9" },
  { to: "/reports", icon: FileText, label: "Reports", key: "0" },
  { to: "/settings", icon: Settings, label: "Settings", key: "," },
];

interface AppSidebarProps {
  onClose?: () => void;
}

export const AppSidebar = ({ onClose }: AppSidebarProps) => {
  const { user, signOut } = useAuth();
  const { projects, createProject } = useProjects();
  const { roles, isOwner, isAdmin } = useUserRole();
  const { profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [newProjectName, setNewProjectName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const item = navItems.find(n => n.key === e.key);
      if (item) { 
        e.preventDefault(); 
        navigate(item.to); 
        onClose?.();
      }
      if (e.key === "b") { e.preventDefault(); setCollapsed(c => !c); }
      if (e.key === "n" && !e.shiftKey) {
        // Handled by CreateTaskDialog elsewhere
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [navigate]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    await createProject.mutateAsync({ name: newProjectName });
    setNewProjectName("");
    setDialogOpen(false);
  };

  const roleIcon = isOwner ? Crown : isAdmin ? Shield : null;
  const roleLabel = isOwner ? "Owner" : isAdmin ? "Admin" : roles[0] ?? "Member";

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
      className="flex h-screen flex-col border-r border-sidebar-border glass-sidebar overflow-hidden"
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
        {!collapsed && (
          <div className="flex items-center gap-2 pl-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-background overflow-hidden border border-border/50 shadow-sm">
              <img src="/Task_Icon_2.png" alt="TaskFlow" className="h-5 w-5 object-contain" />
            </div>
            <span className="text-base font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">TaskFlow</span>
            <Badge variant="secondary" className="text-[8px] px-1.5 py-0 font-bold tracking-wider uppercase">Pro</Badge>
          </div>
        )}
        {collapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-background overflow-hidden border border-border/50 shadow-sm mx-auto">
            <img src="/Task_Icon_1.png" alt="TaskFlow" className="h-5 w-5 object-contain" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors mx-auto"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Search hint */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
            <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium">⌘K</kbd>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1 mt-1">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"}>
            {({ isActive }) => (
              <div 
                onClick={() => onClose?.()}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  collapsed && "justify-center px-0"
                )} title={collapsed ? item.label : undefined}>
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>
            )}
          </NavLink>
        ))}

        {/* Pomodoro Timer */}
        {!collapsed && (
          <div className="pt-3 px-1">
            <PomodoroTimer />
          </div>
        )}

        {/* Projects */}
        {!collapsed && (
          <div className="pt-5">
            <div className="flex items-center justify-between px-3 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Projects</span>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Project</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input
                        value={newProjectName}
                        onChange={e => setNewProjectName(e.target.value)}
                        placeholder="e.g. Work, Personal"
                        onKeyDown={e => e.key === "Enter" && handleCreateProject()}
                      />
                    </div>
                    <Button onClick={handleCreateProject} className="w-full" disabled={createProject.isPending}>
                      Create Project
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {projects.map(project => (
              <NavLink key={project.id} to={`/project/${project.id}`}>
                {({ isActive }) => (
                  <div 
                    onClick={() => onClose?.()}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}>
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color ?? "#6366f1", boxShadow: `0 0 8px ${project.color ?? "#6366f1"}40` }} />
                    <span className="truncate">{project.name}</span>
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <div className={cn(
          "flex items-center gap-2 px-2",
          collapsed ? "justify-center flex-col gap-1" : "justify-between"
        )}>
          <NotificationDropdown collapsed={collapsed} />
          <ThemeToggle />
        </div>
        <div className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2",
          collapsed && "justify-center px-0"
        )}>
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-xs font-bold text-primary-foreground shrink-0 shadow-md shadow-primary/20 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              user?.email?.[0]?.toUpperCase() ?? "U"
            )}
            {roleIcon && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-card flex items-center justify-center">
                {roleIcon === Crown ? <Crown className="h-2.5 w-2.5 text-warning" /> : <Shield className="h-2.5 w-2.5 text-primary" />}
              </div>
            )}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium">{user?.email}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{roleLabel}</p>
              </div>
              <button onClick={signOut} className="text-muted-foreground hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.aside>
  );
};
