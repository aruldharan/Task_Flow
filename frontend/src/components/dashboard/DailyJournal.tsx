import { useState, useEffect, useRef } from "react";
import { useDailyNotes } from "@/hooks/useDailyNotes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronLeft, ChevronRight, Save, Check } from "lucide-react";
import { format, subDays, addDays, isToday } from "date-fns";

export const DailyJournal = () => {
  const { notes, upsertNote } = useDailyNotes();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Load note for selected date
  useEffect(() => {
    const note = notes.find(n => n.note_date === dateStr);
    setContent(note?.content ?? "");
    setSaved(false);
  }, [dateStr, notes]);

  // Autosave with debounce
  const handleChange = (value: string) => {
    setContent(value);
    setSaved(false);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        upsertNote.mutate({ date: dateStr, content: value });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    }, 1000);
  };

  const handleSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    upsertNote.mutate({ date: dateStr, content });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasNote = (date: Date) =>
    notes.some(n => n.note_date === format(date, "yyyy-MM-dd") && n.content.trim());

  return (
    <Card className="animate-fade-up" style={{ animationDelay: "500ms" }}>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          Daily Journal
        </CardTitle>
        <div className="flex items-center gap-1">
          {saved && (
            <Badge variant="secondary" className="text-[10px] gap-1 text-success">
              <Check className="h-3 w-3" /> Saved
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Date navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSelectedDate(d => subDays(d, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(new Date())}
              className={cn(
                "text-sm font-medium transition-colors",
                isToday(selectedDate) ? "text-primary" : "text-foreground hover:text-primary"
              )}
            >
              {isToday(selectedDate) ? "Today" : format(selectedDate, "EEE, MMM d")}
            </button>
            {/* Mini dots for recent days */}
            <div className="flex gap-1 ml-2">
              {Array.from({ length: 5 }, (_, i) => {
                const d = subDays(new Date(), 4 - i);
                const has = hasNote(d);
                const isSel = format(d, "yyyy-MM-dd") === dateStr;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(d)}
                    className={cn(
                      "h-2 w-2 rounded-full transition-all",
                      isSel ? "bg-primary scale-125" : has ? "bg-success/60" : "bg-muted-foreground/20"
                    )}
                    title={format(d, "MMM d")}
                  />
                );
              })}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSelectedDate(d => addDays(d, 1))}
            disabled={isToday(selectedDate)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Note editor */}
        <textarea
          value={content}
          onChange={e => handleChange(e.target.value)}
          placeholder={isToday(selectedDate) ? "What's on your mind today?" : `Notes for ${format(selectedDate, "MMM d")}...`}
          className="flex min-h-[120px] w-full rounded-lg border-0 bg-muted/30 px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />

        {/* Save button */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {content.length > 0 ? `${content.length} characters` : "Auto-saves as you type"}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={handleSave}
            disabled={!content.trim() || upsertNote.isPending}
          >
            <Save className="h-3 w-3" /> Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
