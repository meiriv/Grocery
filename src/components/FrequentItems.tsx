'use client';

import React, { useEffect, useState } from 'react';
import { Plus, History } from 'lucide-react';
import { cn, vibrate } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useCategories } from '@/hooks/useCategories';
import { getTopFrequentItems } from '@/services/storage';
import type { FrequentItem, UnitType } from '@/types/grocery';

interface FrequentItemsProps {
  /** Names already in the list - those are not offered again */
  existingNames: string[];
  onAdd: (item: {
    name: string;
    categoryId: string;
    quantity: number;
    unit: UnitType;
  }) => void;
  limit?: number;
}

export function FrequentItems({ existingNames, onAdd, limit = 12 }: FrequentItemsProps) {
  const { t } = useTranslation();
  const { getCategory } = useCategories();
  const [frequent, setFrequent] = useState<FrequentItem[]>([]);

  // localStorage is only available in the browser, so read after mount
  useEffect(() => {
    setFrequent(getTopFrequentItems(50));
  }, []);

  const taken = new Set(existingNames.map((name) => name.trim().toLowerCase()));
  const suggestions = frequent
    .filter((item) => !taken.has(item.name.trim().toLowerCase()))
    .slice(0, limit);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-2 text-sm text-[var(--muted-foreground)]">
        <History size={14} />
        <span>{t.frequent.addFromFrequent}</span>
      </div>

      {/* One row, scrolled sideways - keeps the input in reach on a phone */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {suggestions.map((item) => {
          const category = getCategory(item.categoryId);

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => {
                vibrate(10);
                onAdd({
                  name: item.name,
                  categoryId: item.categoryId,
                  quantity: item.quantity,
                  unit: item.unit,
                });
              }}
              className={cn(
                'flex items-center gap-1.5 flex-shrink-0',
                'px-3 py-2 rounded-full',
                'bg-[var(--secondary)] text-[var(--foreground)]',
                'text-sm font-medium whitespace-nowrap',
                'hover:bg-[var(--accent)] active:scale-95',
                'transition-all duration-150'
              )}
            >
              {category && (
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', category.color)} />
              )}
              <span>{item.name}</span>
              <Plus size={14} className="text-[var(--muted-foreground)]" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
