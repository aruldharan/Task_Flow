import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Kanban from "./pages/Kanban";
import CalendarView from "./pages/CalendarView";
import Analytics from "./pages/Analytics";
import ProjectView from "./pages/ProjectView";
import Settings from "./pages/Settings";
import FocusMode from "./pages/FocusMode";
import AISuggestions from "./pages/AISuggestions";
import Timeline from "./pages/Timeline";
import Workflows from "./pages/Workflows";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import { useAccentColor } from "@/components/ThemeColorPicker";

const queryClient = new QueryClient();

// Apply saved accent color on app load
const AccentColorInit = ({ children }: { children: React.ReactNode }) => {
  useAccentColor();
  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/kanban" element={<Kanban />} />
      <Route path="/calendar" element={<CalendarView />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/project/:projectId" element={<ProjectView />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/focus" element={<FocusMode />} />
{/*      <Route path="/ai" element={<AISuggestions />} /> */}
      <Route path="/timeline" element={<Timeline />} />
{/*      <Route path="/workflows" element={<Workflows />} /> */}
      <Route path="/reports" element={<Reports />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AccentColorInit>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </AccentColorInit>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
