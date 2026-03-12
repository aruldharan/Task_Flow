import { useState, useCallback, ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "dashboard-widget-order";

export interface WidgetConfig {
  id: string;
  label: string;
  span?: "full" | "1" | "2";
  component: ReactNode;
}

const getStoredOrder = (defaultIds: string[]): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const order = JSON.parse(stored) as string[];
      // Ensure all current widgets are included
      const missing = defaultIds.filter(id => !order.includes(id));
      const valid = order.filter(id => defaultIds.includes(id));
      return [...valid, ...missing];
    }
  } catch {}
  return defaultIds;
};

const saveOrder = (order: string[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
};

const SortableWidget = ({ widget, isEditing }: { widget: WidgetConfig; isEditing: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const spanClass =
    widget.span === "full" ? "md:col-span-2 lg:col-span-3" :
    widget.span === "2" ? "md:col-span-2" : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group/widget",
        spanClass,
        isEditing && "ring-1 ring-dashed ring-primary/20 rounded-xl"
      )}
    >
      {isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-card border border-border shadow-sm rounded-full px-2 py-0.5 cursor-grab active:cursor-grabbing opacity-0 group-hover/widget:opacity-100 transition-opacity"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground font-medium">{widget.label}</span>
        </div>
      )}
      {widget.component}
    </div>
  );
};

interface Props {
  widgets: WidgetConfig[];
}

export const DraggableDashboard = ({ widgets }: Props) => {
  const defaultIds = widgets.map(w => w.id);
  const [order, setOrder] = useState<string[]>(() => getStoredOrder(defaultIds));
  const [isEditing, setIsEditing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const orderedWidgets = order
    .map(id => widgets.find(w => w.id === id))
    .filter(Boolean) as WidgetConfig[];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrder(prev => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      const newOrder = arrayMove(prev, oldIndex, newIndex);
      saveOrder(newOrder);
      return newOrder;
    });
  }, []);

  const handleReset = () => {
    setOrder(defaultIds);
    localStorage.removeItem(STORAGE_KEY);
  };

  const activeWidget = widgets.find(w => w.id === activeId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant={isEditing ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => setIsEditing(!isEditing)}
        >
          <GripVertical className="h-3 w-3" />
          {isEditing ? "Done" : "Customize"}
        </Button>
        {isEditing && (
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleReset}>
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orderedWidgets.map(widget => (
              <SortableWidget key={widget.id} widget={widget} isEditing={isEditing} />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeWidget ? (
            <div className="opacity-80 rotate-1 scale-[1.02] pointer-events-none">
              {activeWidget.component}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
