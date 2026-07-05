"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Vertical drag-to-reorder primitives (@dnd-kit: keyboard + touch, spec §6).
 * SortableList owns the DndContext; render SortableItem rows inside in the
 * same order as `ids`. onReorder receives the full reordered id array.
 * Shared by: highlights, features, related posts, product list, categories.
 */
export function SortableList({
  ids,
  onReorder,
  disabled = false,
  children,
}: {
  ids: string[];
  onReorder: (ids: string[]) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onReorder(arrayMove(ids, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy} disabled={disabled}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

export function SortableItem({
  id,
  disabled = false,
  handleTitle,
  className,
  children,
}: {
  id: string;
  disabled?: boolean;
  /** Tooltip on the handle — used to say WHY dragging is off (filters active). */
  handleTitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-start gap-2", isDragging && "z-10 opacity-70", className)}
    >
      <button
        type="button"
        title={handleTitle ?? "Drag to reorder"}
        aria-label={handleTitle ?? "Drag to reorder"}
        disabled={disabled}
        {...attributes}
        {...listeners}
        className={cn(
          "text-muted-foreground hover:text-foreground mt-2 shrink-0 touch-none rounded p-1 transition-colors",
          disabled ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing",
        )}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
