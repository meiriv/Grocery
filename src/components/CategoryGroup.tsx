'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn, groupBy } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useTranslation } from '@/hooks/useTranslation';
import type { GroceryItem as GroceryItemType } from '@/types/grocery';
import { GroceryItem, ShoppingItem } from './GroceryItem';

interface CategoryGroupProps {
  items: GroceryItemType[];
  onToggleChecked: (itemId: string) => void;
  onMarkOutOfStock: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  onEdit?: (itemId: string) => void;
  mode?: 'default' | 'shopping';
  collapsible?: boolean;
  showEmptyCategories?: boolean;
}

export function CategoryGroup({
  items,
  onToggleChecked,
  onMarkOutOfStock,
  onDelete,
  onEdit,
  mode = 'default',
  collapsible = true,
  showEmptyCategories = false,
}: CategoryGroupProps) {
  const { categories, getCategoryDisplayName } = useCategories();
  const { language } = useTranslation();
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Group items by category
  const groupedItems = groupBy(items, (item) => item.categoryId);

  // Get categories that have items (or all if showEmptyCategories)
  const activeCategories = categories.filter(
    (cat) => showEmptyCategories || groupedItems[cat.id]?.length > 0
  );

  const toggleCategory = (categoryId: string) => {
    if (!collapsible) return;
    
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {activeCategories.map((category) => {
        const categoryItems = groupedItems[category.id] || [];
        const isCollapsed = collapsedCategories.has(category.id);
        const checkedCount = categoryItems.filter((i) => i.status === 'checked').length;
        const totalCount = categoryItems.length;

        if (categoryItems.length === 0 && !showEmptyCategories) {
          return null;
        }

        return (
          <div key={category.id} className="space-y-2">
            {/* Category header */}
            <button
              type="button"
              onClick={() => toggleCategory(category.id)}
              disabled={!collapsible}
              className={cn(
                'w-full flex items-center gap-2 py-2',
                'text-start',
                collapsible && 'cursor-pointer hover:opacity-80'
              )}
            >
              <span
                className={cn('w-3 h-3 rounded-full flex-shrink-0', category.color)}
              />
              <span className="font-semibold text-[var(--foreground)]">
                {category.name[language]}
              </span>
              <span className="text-sm text-[var(--muted-foreground)]">
                ({checkedCount}/{totalCount})
              </span>
              {collapsible && categoryItems.length > 0 && (
                <ChevronDown
                  size={18}
                  className={cn(
                    'ms-auto text-[var(--muted-foreground)] transition-transform',
                    isCollapsed && '-rotate-90'
                  )}
                />
              )}
            </button>

            {/* Category items */}
            {!isCollapsed && categoryItems.length > 0 && (
              <div className="space-y-2 ps-5">
                {categoryItems.map((item) =>
                  mode === 'shopping' ? (
                    <ShoppingItem
                      key={item.id}
                      item={item}
                      onToggleChecked={() => onToggleChecked(item.id)}
                      onMarkOutOfStock={() => onMarkOutOfStock(item.id)}
                    />
                  ) : (
                    <GroceryItem
                      key={item.id}
                      item={item}
                      onToggleChecked={() => onToggleChecked(item.id)}
                      onMarkOutOfStock={() => onMarkOutOfStock(item.id)}
                      onDelete={() => onDelete(item.id)}
                      onEdit={onEdit ? () => onEdit(item.id) : undefined}
                      showCategory={false}
                    />
                  )
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Flat list without grouping
interface FlatListProps {
  items: GroceryItemType[];
  onToggleChecked: (itemId: string) => void;
  onMarkOutOfStock: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  onEdit?: (itemId: string) => void;
  mode?: 'default' | 'shopping';
}

export function FlatList({
  items,
  onToggleChecked,
  onMarkOutOfStock,
  onDelete,
  onEdit,
  mode = 'default',
}: FlatListProps) {
  return (
    <div className="space-y-2">
      {items.map((item) =>
        mode === 'shopping' ? (
          <ShoppingItem
            key={item.id}
            item={item}
            onToggleChecked={() => onToggleChecked(item.id)}
            onMarkOutOfStock={() => onMarkOutOfStock(item.id)}
          />
        ) : (
          <GroceryItem
            key={item.id}
            item={item}
            onToggleChecked={() => onToggleChecked(item.id)}
            onMarkOutOfStock={() => onMarkOutOfStock(item.id)}
            onDelete={() => onDelete(item.id)}
            onEdit={onEdit ? () => onEdit(item.id) : undefined}
            showCategory={true}
          />
        )
      )}
    </div>
  );
}

