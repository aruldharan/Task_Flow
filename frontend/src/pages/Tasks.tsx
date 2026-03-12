import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { CSVImportDialog } from "@/components/tasks/CSVImportDialog";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, CheckSquare, ListFilter, SortAsc, X, Calendar, FolderOpen, AlertTriangle, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { isPast, isToday, isThisWeek } from "date-fns";
import { SavedFilters, FilterPreset } from "@/components/tasks/SavedFilters";
import { ProductivityScore } from "@/components/ProductivityScore";
import { useNavigate } from "react-router-dom";

type SortOption = "position" | "priority" | "due_date" | "created_at" | "title";
type DateFilter = "all" | "overdue" | "today" | "this_week" | "no_date";

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

const Tasks = () => {
  const navigate = useNavigate();
  const { tasks, isLoading } = useTasks();
  const { projects } = useProjects();
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [filterDate, setFilterDate] = useState<DateFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("position");
  const [activeTab, setActiveTab] = useState("active");

  const activeFiltersCount = [
    filterPriority !== "all",
    filterProject !== "all",
    filterDate !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterPriority("all");
    setFilterProject("all");
    setFilterDate("all");
    setSearch("");
  };

  const filtered = useMemo(() => {
    let result = tasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
          !(t.description ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterProject !== "all") {
        if (filterProject === "none" && t.project_id !== null) return false;
        if (filterProject !== "none" && t.project_id !== filterProject) return false;
      }
      if (filterDate === "overdue" && !(t.due_date && isPast(new Date(t.due_date)) && t.status !== "completed")) return false;
      if (filterDate === "today" && !(t.due_date && isToday(new Date(t.due_date)))) return false;
      if (filterDate === "this_week" && !(t.due_date && isThisWeek(new Date(t.due_date)))) return false;
      if (filterDate === "no_date" && t.due_date !== null) return false;
      if (activeTab === "active" && t.status === "completed") return false;
      if (activeTab === "completed" && t.status !== "completed") return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "priority":
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case "due_date":
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case "created_at":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return a.position - b.position;
      }
    });

    return result;
  }, [tasks, search, filterPriority, filterProject, filterDate, activeTab, sortBy]);

  const activeCount = tasks.filter(t => t.status !== "completed").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const overdueCount = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.status !== "completed").length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-4xl mx-auto">
      {/* Productivity widget */}
      <div className="animate-fade-up">
        <ProductivityScore />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-up" style={{ animationDelay: "30ms" }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {tasks.length} total tasks
            {overdueCount > 0 && (
              <span className="text-destructive ml-2">
                <AlertTriangle className="h-3 w-3 inline mr-0.5" />{overdueCount} overdue
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5" onClick={() => navigate("/focus")}>
            <Brain className="h-3.5 w-3.5" /> Focus Mode
          </Button>
          <CSVImportDialog />
          <CreateTaskDialog />
        </div>
      </div>

      {/* Tab bar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-up" style={{ animationDelay: "50ms" }}>
        <div className="flex flex-wrap items-center gap-3">
          <TabsList>
            <TabsTrigger value="active" className="gap-1.5">
              Active <Badge variant="secondary" className="text-[10px] px-1.5 h-4">{activeCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5">
              Completed <Badge variant="secondary" className="text-[10px] px-1.5 h-4">{completedCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </div>

        {/* Search + Filters bar */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Advanced Filters Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <ListFilter className="h-3.5 w-3.5" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="h-4 px-1 text-[10px] ml-0.5">{activeFiltersCount}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 space-y-4" align="end">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilters}>
                    <X className="h-3 w-3 mr-1" /> Clear all
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Project</label>
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectItem value="none">No Project</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color ?? "#6366f1" }} />
                          {p.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                <Select value={filterDate} onValueChange={v => setFilterDate(v as DateFilter)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="today">Due Today</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="no_date">No Due Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>

          {/* Saved Filters */}
          <SavedFilters
            currentFilters={{ priority: filterPriority, project: filterProject, date: filterDate, sort: sortBy }}
            onApply={(preset) => {
              setFilterPriority(preset.priority);
              setFilterProject(preset.project);
              setFilterDate(preset.date as DateFilter);
              setSortBy(preset.sort as SortOption);
            }}
          />

          {/* Sort */}
          <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[140px] h-9">
              <SortAsc className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="position">Default</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="due_date">Due Date</SelectItem>
              <SelectItem value="created_at">Newest</SelectItem>
              <SelectItem value="title">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active filter chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {filterPriority !== "all" && (
              <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setFilterPriority("all")}>
                Priority: {filterPriority} <X className="h-3 w-3" />
              </Badge>
            )}
            {filterProject !== "all" && (
              <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setFilterProject("all")}>
                Project: {filterProject === "none" ? "None" : projects.find(p => p.id === filterProject)?.name ?? filterProject}
                <X className="h-3 w-3" />
              </Badge>
            )}
            {filterDate !== "all" && (
              <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setFilterDate("all")}>
                Date: {filterDate.replace("_", " ")} <X className="h-3 w-3" />
              </Badge>
            )}
          </div>
        )}

        <TabsContent value={activeTab} className="mt-4">
          <div className="space-y-2">
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground font-medium">No tasks found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                {activeFiltersCount > 0 && (
                  <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>Clear Filters</Button>
                )}
              </div>
            ) : (
              filtered.map((task, i) => (
                <div key={task.id} className="animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <TaskCard task={task} />
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tasks;
