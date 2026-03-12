import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { useRealtimeTasks } from "@/hooks/useRealtimeTasks";
import { AnimatePresence } from "framer-motion";
import { AnimatedPage } from "@/components/AnimatedPage";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Plus, CheckSquare } from "lucide-react";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { useState } from "react";

export const AppLayout = () => {
  useRealtimeTasks();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row">
      {/* Mobile Top Header */}
      {isMobile && (
        <header className="flex h-14 items-center justify-between border-b border-sidebar-border px-4 glass-sidebar shrink-0 z-30">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 border-r-0 w-64">
                <AppSidebar onClose={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background overflow-hidden shadow-sm border border-border/50">
              <img src="/Task_Icon_2.png" alt="TaskFlow" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-sm font-bold tracking-tight">TaskFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <CommandPalette />
            <CreateTaskDialog
              trigger={
                <Button size="icon" className="h-9 w-9 rounded-full shadow-lg shadow-primary/20">
                  <Plus className="h-5 w-5" />
                </Button>
              }
            />
          </div>
        </header>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && <AppSidebar />}

      <main className="flex-1 overflow-y-auto scrollbar-thin bg-background relative">
        <AnimatePresence mode="wait">
          <AnimatedPage key={location.pathname}>
            <Outlet />
          </AnimatedPage>
        </AnimatePresence>
      </main>
    </div>
  );
};
