'use client';

import React from 'react';
import { Clock, MoreVertical, Trash2 } from 'lucide-react';
import { cn, formatRelativeTime, vibrate } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useSwipeGesture, didRecentSwipe } from '@/hooks/useSwipeGesture';
import type { GroceryList } from '@/types/grocery';

interface ListCardProps {
  list: GroceryList;
  onOpen: () => void;
  onDelete: () => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onRequestDelete: () => void;
}

export function ListCard({
  list,
  onOpen,
  onDelete,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onRequestDelete,
}: ListCardProps) {
  const { t, language, interpolate } = useTranslation();

  const total = list.items.length;
  const checked = list.items.filter((item) => item.status === 'checked').length;
  const progress = total > 0 ? (checked / total) * 100 : 0;

  // Swipe left (physically, in both text directions) to delete the list
  const { handlers, state } = useSwipeGesture({
    threshold: 100,
    onSwipeLeft: () => {
      vibrate(20);
      onDelete();
    },
    ignoreRTL: true,
  });

  const handleOpen = () => {
    // A swipe ends with a synthetic click; it must not open a list - possibly
    // even a different one, since deleting this card re-flows the page
    if (didRecentSwipe()) return;
    onOpen();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete indicator, revealed while swiping */}
      <div className="absolute inset-y-0 right-0 w-24 bg-red-500 flex items-center justify-end pe-6">
        <Trash2 size={24} className="text-white" />
      </div>

      <div
        {...handlers}
        style={{ transform: `translateX(${state.translateX}px)` }}
        className={cn(
          'relative bg-[var(--card)] rounded-2xl border border-[var(--border)] touch-pan-y',
          !state.isDragging && 'transition-all duration-200',
          'hover:border-[var(--muted-foreground)]'
        )}
      >
        {/* pe-14 keeps the progress ring clear of the menu button on top of it */}
        <button onClick={handleOpen} className="w-full p-4 pe-14 text-start">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-[var(--foreground)] truncate">
                {list.name}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-[var(--muted-foreground)]">
                <span>{interpolate(t.home.listItems, { count: total })}</span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatRelativeTime(new Date(list.updatedAt), language)}
                </span>
              </div>
            </div>

            {/* Progress indicator */}
            {total > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 relative">
                  <svg className="w-10 h-10 -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="var(--secondary)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="4"
                      strokeDasharray={`${progress} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    {checked}/{total}
                  </span>
                </div>
              </div>
            )}
          </div>
        </button>

        {/* Menu button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="absolute top-4 end-4 p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          aria-label={t.home.listOptions}
        >
          <MoreVertical size={18} className="lucide-more-vertical" />
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={onCloseMenu} />
            <div className="absolute top-12 end-4 z-50 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg py-1 min-w-[140px] animate-scale-in">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestDelete();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-red-500 hover:bg-[var(--accent)] transition-colors"
              >
                <Trash2 size={16} className="lucide-trash-2" />
                {t.home.deleteList}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
