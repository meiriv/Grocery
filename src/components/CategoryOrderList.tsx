'use client';

import React, { useCallback, useRef, useState } from 'react';
import { GripVertical, Edit3, Trash2 } from 'lucide-react';
import { cn, vibrate } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { getUnit } from '@/lib/units';
import { IconButton } from './ui/Button';
import type { Category } from '@/types/grocery';

interface CategoryOrderListProps {
  categories: Category[];
  isCustomCategory: (id: string) => boolean;
  onReorder: (ids: string[]) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

interface DragState {
  id: string;
  /** Row boxes as they were when the drag started */
  rects: DOMRect[];
  startIndex: number;
  startY: number;
  /** Order the list had when the drag started */
  baseIds: string[];
}

export function CategoryOrderList({
  categories,
  isCustomCategory,
  onReorder,
  onMove,
  onEdit,
  onDelete,
}: CategoryOrderListProps) {
  const { t, language } = useTranslation();
  const listRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);

  // While dragging, the list follows this order instead of the saved one
  const [dragIds, setDragIds] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [offsetY, setOffsetY] = useState(0);

  const byId = new Map(categories.map((category) => [category.id, category]));
  const ids = dragIds ?? categories.map((category) => category.id);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent, id: string) => {
      // Only a primary press starts a drag
      if (event.button !== 0 || !listRef.current) return;

      const rows = Array.from(listRef.current.children) as HTMLElement[];
      const baseIds = categories.map((category) => category.id);
      const startIndex = baseIds.indexOf(id);
      if (startIndex < 0) return;

      drag.current = {
        id,
        rects: rows.map((row) => row.getBoundingClientRect()),
        startIndex,
        startY: event.clientY,
        baseIds,
      };

      // Keeps the events coming when the finger slides off the handle. Not
      // every pointer id can be captured, and a failure there must not stop
      // the drag.
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // carry on without capture
      }
      setDragIds(baseIds);
      setDraggingId(id);
      setOffsetY(0);
      vibrate(10);
    },
    [categories]
  );

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    const state = drag.current;
    if (!state) return;

    const dy = event.clientY - state.startY;
    const startRect = state.rects[state.startIndex];
    if (!startRect) return;

    // Where the middle of the dragged row now sits
    const center = startRect.top + startRect.height / 2 + dy;

    // The slot it belongs to: the last row whose middle it has passed
    let target = 0;
    state.rects.forEach((rect, index) => {
      if (center > rect.top + rect.height / 2) target = index;
    });

    const next = state.baseIds.filter((id) => id !== state.id);
    next.splice(target, 0, state.id);
    setDragIds(next);

    // Keep the row under the pointer even though it has moved slot
    const slotTop = state.rects[target]?.top ?? startRect.top;
    setOffsetY(startRect.top + dy - slotTop);
  }, []);

  const endDrag = useCallback(() => {
    const state = drag.current;
    drag.current = null;

    setDraggingId(null);
    setOffsetY(0);

    if (state && dragIds) {
      const changed = dragIds.some((id, index) => id !== state.baseIds[index]);
      if (changed) {
        vibrate(15);
        onReorder(dragIds);
      }
    }

    setDragIds(null);
  }, [dragIds, onReorder]);

  return (
    <div ref={listRef} className="space-y-2">
      {ids.map((id, index) => {
        const category = byId.get(id);
        if (!category) return null;

        const isCustom = isCustomCategory(category.id);
        const isDragging = draggingId === category.id;

        return (
          <div
            key={category.id}
            className={cn(
              'flex items-center gap-2 p-3 rounded-xl border',
              'bg-[var(--card)] border-[var(--border)]',
              isDragging
                ? 'relative z-10 shadow-lg border-emerald-500 opacity-95'
                : 'transition-transform'
            )}
            style={isDragging ? { transform: `translateY(${offsetY}px)` } : undefined}
          >
            {/* Drag handle. touch-action: none is what lets a finger drag it
                instead of scrolling the page - which is also why the rest of
                the row stays scrollable. */}
            <button
              type="button"
              onPointerDown={(event) => handlePointerDown(event, category.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  onMove(category.id, 'up');
                } else if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  onMove(category.id, 'down');
                }
              }}
              className={cn(
                'flex-shrink-0 flex items-center justify-center',
                'w-9 h-11 -my-1 rounded-lg touch-none select-none',
                'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                'hover:bg-[var(--secondary)] transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                isDragging ? 'cursor-grabbing text-emerald-500' : 'cursor-grab'
              )}
              aria-label={`${t.categories.reorder}: ${category.name[language]}, ${index + 1}/${ids.length}`}
            >
              <GripVertical size={18} />
            </button>

            <span className={cn('w-4 h-4 rounded-full flex-shrink-0', category.color)} />
            <span className="flex-1 min-w-0 font-medium text-[var(--foreground)] truncate">
              {category.name[language]}
            </span>

            {isCustom && (
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)]">
                {t.categories.customSection}
              </span>
            )}

            <span className="text-sm text-[var(--muted-foreground)]">
              {getUnit(category.defaultUnit).shortName[language]}
            </span>

            {isCustom && (
              <div className="flex items-center gap-1">
                <IconButton
                  onClick={() => onEdit(category)}
                  className="text-[var(--muted-foreground)]"
                  aria-label={t.categories.editCategory}
                >
                  <Edit3 size={18} />
                </IconButton>
                <IconButton
                  onClick={() => onDelete(category.id)}
                  className="text-[var(--muted-foreground)] hover:text-red-500"
                  aria-label={t.categories.deleteCategory}
                >
                  <Trash2 size={18} />
                </IconButton>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
