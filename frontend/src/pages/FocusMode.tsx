import { useState, useEffect, useCallback, useRef } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useTimeLogs } from "@/hooks/useTimeLogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Brain, X, Check, ChevronRight, Flame, Zap, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/api/types";
import { motion, AnimatePresence } from "framer-motion";

type Task = Tables<"tasks">;
type Mode = "work" | "short_break" | "long_break";

const DURATIONS: Record<Mode, number> = { work: 25 * 60, short_break: 5 * 60, long_break: 15 * 60 };

// Simple ambient sound using oscillator
const useAmbientSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);
  const [playing, setPlaying] = useState(false);

  const start = useCallback(() => {
    if (audioContextRef.current) return;
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    // Soft pad with multiple detuned oscillators
    const freqs = [174.61, 220, 261.63]; // F3, A3, C4
    freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.03;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      nodesRef.current.push({ osc, gain });
    });

    setPlaying(true);
  }, []);

  const stop = useCallback(() => {
    nodesRef.current.forEach(({ osc, gain }) => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current!.currentTime + 0.5);
      setTimeout(() => osc.stop(), 600);
    });
    nodesRef.current = [];
    setTimeout(() => {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    }, 700);
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    playing ? stop() : start();
  }, [playing, start, stop]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        nodesRef.current.forEach(({ osc }) => { try { osc.stop(); } catch {} });
        audioContextRef.current.close();
      }
    };
  }, []);

  return { playing, toggle };
};

const FocusMode = () => {
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("work");
  const [timeLeft, setTimeLeft] = useState(DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [focusedToday, setFocusedToday] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const ambient = useAmbientSound();

  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const { startTimer, stopTimer, activeLog } = useTimeLogs(selectedTaskId ?? undefined);

  const activeTasks = tasks.filter(t => t.status !== "completed" && t.status !== "archived");

  const switchMode = useCallback((newMode: Mode) => {
    setMode(newMode);
    setTimeLeft(DURATIONS[newMode]);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          try { new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczGjlnkc7p2JZPIjNpl9Xv4aFYLzRro+D37eBWJiVenfX/+ehRFxhMXIHO5765YVVPT0BFQEdGT1RYXmJoc3+LmaimqKimq7S9yNXh7PX9/fv49/X08/Py8vLz9Pb4+/3/").play(); } catch {}
          if (mode === "work") {
            const s = sessions + 1;
            setSessions(s);
            setFocusedToday(prev => prev + DURATIONS.work);
            setShowCompletion(true);
            setTimeout(() => setShowCompletion(false), 3000);
            if (selectedTaskId && activeLog) stopTimer.mutate(activeLog.id);
            switchMode(s % 4 === 0 ? "long_break" : "short_break");
          } else {
            switchMode("work");
            if (selectedTaskId) startTimer.mutate(selectedTaskId);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode, sessions, switchMode, selectedTaskId, activeLog, stopTimer, startTimer]);

  const handleStart = () => {
    setIsRunning(true);
    if (mode === "work" && selectedTaskId && !activeLog) {
      startTimer.mutate(selectedTaskId);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    if (activeLog) stopTimer.mutate(activeLog.id);
  };

  const handleCompleteTask = () => {
    if (!selectedTaskId) return;
    updateTask.mutate({ id: selectedTaskId, status: "completed" });
    setSelectedTaskId(null);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((DURATIONS[mode] - timeLeft) / DURATIONS[mode]) * 100;
  const focusMinutes = Math.floor(focusedToday / 60);

  const modeColors = {
    work: "hsl(var(--primary))",
    short_break: "hsl(var(--success))",
    long_break: "hsl(var(--warning))",
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
      {/* Animated background pulse */}
      {isRunning && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0.02, 0.05, 0.02] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: `radial-gradient(circle at center, ${modeColors[mode]}, transparent 70%)` }}
        />
      )}

      {/* Session completion celebration */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                <Flame className="h-16 w-16 text-warning mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold">Session Complete! 🎉</h2>
              <p className="text-muted-foreground mt-2">Take a well-deserved break</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold">Focus Mode</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Flame className="h-3.5 w-3.5 text-warning" /> {sessions} sessions
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" /> {focusMinutes}m focused
          </Badge>
          <Button
            variant={ambient.playing ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={ambient.toggle}
            title={ambient.playing ? "Mute ambient" : "Play ambient sound"}
          >
            {ambient.playing ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center gap-8 max-w-md w-full">
        {/* Mode tabs */}
        <div className="flex gap-2 bg-muted/50 p-1 rounded-xl">
          {(["work", "short_break", "long_break"] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                mode === m ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "work" ? "Focus" : m === "short_break" ? "Short Break" : "Long Break"}
            </button>
          ))}
        </div>

        {/* Timer */}
        <motion.div className="relative" animate={{ scale: isRunning ? [1, 1.01, 1] : 1 }} transition={{ duration: 2, repeat: isRunning ? Infinity : 0 }}>
          <svg className="w-64 h-64 -rotate-90">
            <circle cx="128" cy="128" r="112" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
            <motion.circle
              cx="128" cy="128" r="112"
              stroke={modeColors[mode]}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 112}`}
              strokeDashoffset={`${2 * Math.PI * 112 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-mono font-bold tabular-nums tracking-tight">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              {mode === "work" ? "Stay focused" : mode === "short_break" ? "Short break" : "Long break"}
            </span>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => { setTimeLeft(DURATIONS[mode]); setIsRunning(false); }}>
            <RotateCcw className="h-5 w-5" />
          </Button>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button size="lg" className="h-14 px-10 rounded-full gap-2 text-base" onClick={isRunning ? handlePause : handleStart}>
              {isRunning ? <><Pause className="h-5 w-5" /> Pause</> : <><Play className="h-5 w-5" /> {timeLeft < DURATIONS[mode] ? "Resume" : "Start"}</>}
            </Button>
          </motion.div>
        </div>

        {/* Task selector */}
        <div className="w-full space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground text-center">
            {selectedTask ? "Working on" : "Select a task to focus on"}
          </h3>
          {selectedTask ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-card border rounded-xl p-4"
            >
              <button onClick={handleCompleteTask} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 hover:border-success hover:bg-success/10 transition-all">
                <Check className="h-3.5 w-3.5 opacity-0 hover:opacity-100" />
              </button>
              <span className="flex-1 text-sm font-medium truncate">{selectedTask.title}</span>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedTaskId(null)}>Change</Button>
            </motion.div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
              {activeTasks.slice(0, 10).map((t, i) => (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedTaskId(t.id)}
                  className="flex items-center gap-3 w-full text-left rounded-lg px-4 py-3 hover:bg-muted/60 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate flex-1">{t.title}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{t.priority}</Badge>
                </motion.button>
              ))}
              {activeTasks.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">No active tasks</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FocusMode;
