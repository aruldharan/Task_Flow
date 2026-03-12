import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENT_COLORS = [
  { name: "Indigo", hue: 243, light: "243 75% 59%", dark: "243 75% 65%" },
  { name: "Blue", hue: 217, light: "217 91% 60%", dark: "217 91% 65%" },
  { name: "Teal", hue: 173, light: "173 80% 40%", dark: "173 80% 50%" },
  { name: "Green", hue: 142, light: "142 71% 45%", dark: "142 71% 50%" },
  { name: "Orange", hue: 25, light: "25 95% 53%", dark: "25 95% 58%" },
  { name: "Rose", hue: 346, light: "346 77% 50%", dark: "346 77% 55%" },
  { name: "Purple", hue: 270, light: "270 67% 55%", dark: "270 67% 65%" },
  { name: "Amber", hue: 38, light: "38 92% 50%", dark: "38 92% 55%" },
];

const STORAGE_KEY = "taskflow-accent-color";

const applyAccentColor = (color: typeof ACCENT_COLORS[0]) => {
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const val = isDark ? color.dark : color.light;

  root.style.setProperty("--primary", val);
  root.style.setProperty("--ring", val);
  root.style.setProperty("--sidebar-primary", val);
  root.style.setProperty("--sidebar-ring", val);

  // Derive accent from primary
  const [h] = val.split(" ");
  root.style.setProperty("--accent", `${h} 75% 96%`);
  root.style.setProperty("--accent-foreground", `${h} 75% 40%`);
  root.style.setProperty("--sidebar-accent", isDark ? `${h} 50% 18%` : `${h} 75% 96%`);
  root.style.setProperty("--sidebar-accent-foreground", isDark ? `${h} 75% 80%` : `${h} 75% 40%`);
};

export const useAccentColor = () => {
  const [selected, setSelected] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return ACCENT_COLORS.find(c => c.name === stored) ?? ACCENT_COLORS[0];
  });

  useEffect(() => {
    applyAccentColor(selected);

    // Re-apply when theme changes
    const observer = new MutationObserver(() => applyAccentColor(selected));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [selected]);

  const setColor = (color: typeof ACCENT_COLORS[0]) => {
    setSelected(color);
    localStorage.setItem(STORAGE_KEY, color.name);
  };

  return { selected, setColor, colors: ACCENT_COLORS };
};

export const ThemeColorPicker = () => {
  const { selected, setColor, colors } = useAccentColor();

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Palette className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-base">Accent Color</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">Choose your preferred accent color for the entire app.</p>
        <div className="flex flex-wrap gap-2">
          {colors.map(color => {
            const isSelected = color.name === selected.name;
            const [h, s, l] = color.light.split(" ");
            return (
              <button
                key={color.name}
                onClick={() => setColor(color)}
                className={cn(
                  "relative h-10 w-10 rounded-full transition-all duration-200 hover:scale-110 ring-offset-2 ring-offset-card",
                  isSelected && "ring-2 ring-foreground scale-110"
                )}
                style={{ backgroundColor: `hsl(${color.light})` }}
                title={color.name}
              >
                {isSelected && (
                  <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
