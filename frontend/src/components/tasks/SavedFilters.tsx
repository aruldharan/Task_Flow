import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bookmark, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export interface FilterPreset {
  id: string;
  name: string;
  priority: string;
  project: string;
  date: string;
  sort: string;
}

const STORAGE_KEY = "taskflow-saved-filters";

const loadPresets = (): FilterPreset[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch { return []; }
};

const savePresets = (presets: FilterPreset[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
};

interface Props {
  currentFilters: { priority: string; project: string; date: string; sort: string };
  onApply: (preset: FilterPreset) => void;
}

export const SavedFilters = ({ currentFilters, onApply }: Props) => {
  const [presets, setPresets] = useState<FilterPreset[]>(loadPresets);
  const [newName, setNewName] = useState("");
  const [showSave, setShowSave] = useState(false);

  useEffect(() => { savePresets(presets); }, [presets]);

  const hasActiveFilters = currentFilters.priority !== "all" || currentFilters.project !== "all" || currentFilters.date !== "all";

  const handleSave = () => {
    if (!newName.trim()) return;
    const preset: FilterPreset = {
      id: Date.now().toString(),
      name: newName.trim(),
      ...currentFilters,
    };
    setPresets(prev => [...prev, preset]);
    setNewName("");
    setShowSave(false);
    toast.success("Filter preset saved");
  };

  const handleDelete = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    toast.success("Preset deleted");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <Bookmark className="h-3.5 w-3.5" />
          Saved
          {presets.length > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{presets.length}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-3" align="end">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Saved Filters</h4>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setShowSave(true)}>
              <Plus className="h-3 w-3" /> Save current
            </Button>
          )}
        </div>

        {showSave && (
          <div className="flex gap-1.5">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Preset name..."
              className="h-7 text-xs"
              onKeyDown={e => e.key === "Enter" && handleSave()}
              autoFocus
            />
            <Button size="sm" className="h-7 px-2 text-xs" onClick={handleSave}>Save</Button>
            <Button size="sm" variant="ghost" className="h-7 px-1" onClick={() => setShowSave(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {presets.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            No saved filters yet.{hasActiveFilters ? " Apply filters then save them here." : ""}
          </p>
        ) : (
          <div className="space-y-1">
            {presets.map(p => (
              <div key={p.id} className="group flex items-center gap-2">
                <button
                  onClick={() => onApply(p)}
                  className="flex-1 text-left rounded-md px-2.5 py-1.5 text-sm hover:bg-muted transition-colors truncate"
                >
                  {p.name}
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
