import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Coffee, Brain, X, Maximize2, Minimize2 } from "lucide-react";

type Mode = "work" | "short_break" | "long_break";

const DURATIONS: Record<Mode, number> = {
  work: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

const MODE_CONFIG: Record<Mode, { label: string; icon: typeof Brain; color: string; bg: string }> = {
  work: { label: "Focus", icon: Brain, color: "text-primary", bg: "bg-primary/10" },
  short_break: { label: "Short Break", icon: Coffee, color: "text-success", bg: "bg-success/10" },
  long_break: { label: "Long Break", icon: Coffee, color: "text-warning", bg: "bg-warning/10" },
};

export const PomodoroTimer = () => {
  const [mode, setMode] = useState<Mode>("work");
  const [timeLeft, setTimeLeft] = useState(DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const config = MODE_CONFIG[mode];

  const switchMode = useCallback((newMode: Mode) => {
    setMode(newMode);
    setTimeLeft(DURATIONS[newMode]);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Play notification sound
            try { new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczGjlnkc7p2JZPIjNpl9Xv4aFYLzRro+D37eBWJiVenfX/+ehRFxhMXIHO5765YVVPT0BFQEdGT1RYXmJoc3+LmaimqKimq7S9yNXh7PX9/fv49/X08/Py8vLz9Pb4+/3/").play(); } catch {}
            if (mode === "work") {
              const newSessions = sessions + 1;
              setSessions(newSessions);
              switchMode(newSessions % 4 === 0 ? "long_break" : "short_break");
            } else {
              switchMode("work");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode, sessions, switchMode]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((DURATIONS[mode] - timeLeft) / DURATIONS[mode]) * 100;

  const reset = () => {
    setTimeLeft(DURATIONS[mode]);
    setIsRunning(false);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200 w-full",
          isRunning ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
        )}
      >
        <config.icon className="h-4 w-4" />
        <span className="font-mono text-xs font-bold tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
        {isRunning && <span className="h-2 w-2 rounded-full bg-primary animate-pulse ml-auto" />}
      </button>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <config.icon className={cn("h-4 w-4", config.color)} />
            <span className="text-sm font-semibold">{config.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-[10px]">{sessions} sessions</Badge>
            <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground">
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Progress ring */}
        <div className="flex justify-center">
          <div className="relative">
            <svg className="w-32 h-32 -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
              <circle
                cx="64" cy="64" r="56"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-mono font-bold tabular-nums">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button size="lg" className="h-11 px-8 gap-2" onClick={() => setIsRunning(!isRunning)}>
            {isRunning ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start</>}
          </Button>
        </div>

        {/* Mode switches */}
        <div className="flex gap-1">
          {(["work", "short_break", "long_break"] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-[10px] font-semibold transition-all",
                mode === m ? `${MODE_CONFIG[m].bg} ${MODE_CONFIG[m].color}` : "text-muted-foreground hover:bg-muted"
              )}
            >
              {MODE_CONFIG[m].label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
