import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { keys: ["⌘", "K"], desc: "Open command palette" },
  { keys: ["⌘", "N"], desc: "New task" },
  { keys: ["⌘", "B"], desc: "Toggle sidebar" },
  { keys: ["⌘", ","], desc: "Open settings" },
  { keys: ["⌘", "1"], desc: "Go to Dashboard" },
  { keys: ["⌘", "2"], desc: "Go to Tasks" },
  { keys: ["⌘", "3"], desc: "Go to Kanban" },
  { keys: ["⌘", "4"], desc: "Go to Calendar" },
  { keys: ["⌘", "5"], desc: "Go to Analytics" },
];

interface Props {
  children?: React.ReactNode;
}

export const KeyboardShortcutsDialog = ({ children }: Props) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ?? (
          <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors w-full">
            <Keyboard className="h-4 w-4" />
            <span>Shortcuts</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" /> Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1 pt-2">
          {shortcuts.map(s => (
            <div key={s.desc} className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
              <span className="text-sm">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map(k => (
                  <kbd key={k} className="rounded-md bg-muted px-2 py-1 text-xs font-mono font-medium border border-border shadow-sm">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
