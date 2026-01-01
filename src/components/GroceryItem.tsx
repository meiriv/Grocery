'use client';

import React, { useState } from 'react';
import { Check, X, AlertTriangle, Trash2, Edit3 } from 'lucide-react';
import { cn, vibrate } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useCategories } from '@/hooks/useCategories';
import { useFavoriteButton } from '@/hooks/useFavorites';
import type { GroceryItem as GroceryItemType } from '@/types/grocery';
import { QuantityDisplay } from './QuantityEditor';
import { FavoriteButton } from './FavoriteButton';
import { CategoryBadge } from './CategoryPicker';

interface GroceryItemProps {
  item: GroceryItemType;
  onToggleChecked: () => void;
  onMarkOutOfStock: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  onToggleFavorite?: () => void;
  showCategory?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export function GroceryItem({
  item,
  onToggleChecked,
  onMarkOutOfStock,
  onDelete,
  onEdit,
  onToggleFavorite,
  showCategory = true,
  showActions = true,
  compact = false,
}: GroceryItemProps) {
  const { t, isRTL } = useTranslation();
  const { getCategoryDisplayName, getCategory } = useCategories();
  const { isFavorite, toggle } = useFavoriteButton(item.name);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const category = getCategory(item.categoryId);

  const { handlers, state } = useSwipeGesture({
    threshold: 80,
    onSwipeLeft: () => {
      vibrate(15);
      if (item.status === 'pending') {
        onMarkOutOfStock();
      }
    },
    onSwipeRight: () => {
      vibrate(15);
      onDelete();
    },
    onTap: () => {
      vibrate(10);
      onToggleChecked();
    },
    disabled: item.status === 'checked',
  });

  const handleFavoriteToggle = () => {
    if (onToggleFavorite) {
      onToggleFavorite();
    } else {
      toggle(item);
    }
  };

  const isChecked = item.status === 'checked';
  const isOutOfStock = item.status === 'out_of_stock';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl',
        'bg-[var(--card)] border border-[var(--border)]',
        'transition-all duration-200',
        isChecked && 'opacity-50',
        isOutOfStock && 'border-orange-500/50'
      )}
    >
      {/* Swipe action backgrounds */}
      {state.isDragging && (
        <>
          {/* Left swipe - Out of stock (shows on right in LTR) */}
          <div
            className={cn(
              'absolute inset-y-0 flex items-center justify-end px-4',
              'bg-gradient-to-l from-orange-500 to-orange-600',
              isRTL ? 'start-0 justify-start' : 'end-0'
            )}
            style={{ width: Math.abs(state.translateX) }}
          >
            <AlertTriangle size={24} className="text-white" />
          </div>
          
          {/* Right swipe - Delete (shows on left in LTR) */}
          <div
            className={cn(
              'absolute inset-y-0 flex items-center px-4',
              'bg-gradient-to-r from-red-500 to-red-600',
              isRTL ? 'end-0 justify-end' : 'start-0'
            )}
            style={{ width: Math.abs(state.translateX) }}
          >
            <Trash2 size={24} className="text-white" />
          </div>
        </>
      )}

      {/* Main content */}
      <div
        {...handlers}
        className={cn(
          'relative flex items-center gap-3 p-4',
          'bg-[var(--card)]',
          'transition-transform duration-200',
          'cursor-pointer select-none',
          compact ? 'py-3' : 'py-4'
        )}
        style={{
          transform: `translateX(${state.translateX}px)`,
        }}
      >
        {/* Checkbox indicator */}
        <div
          className={cn(
            'w-6 h-6 rounded-full border-2 flex-shrink-0',
            'flex items-center justify-center',
            'transition-all duration-200',
            isChecked
              ? 'bg-emerald-500 border-emerald-500'
              : isOutOfStock
              ? 'border-orange-500'
              : 'border-[var(--border)]'
          )}
        >
          {isChecked && <Check size={14} className="text-white" />}
          {isOutOfStock && <AlertTriangle size={12} className="text-orange-500" />}
        </div>

        {/* Item details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-medium text-[var(--foreground)]',
                isChecked && 'line-through text-[var(--muted-foreground)]'
              )}
            >
              {item.name}
            </span>
            {showCategory && !compact && (
              <CategoryBadge categoryId={item.categoryId} size="sm" />
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-0.5">
            <QuantityDisplay
              quantity={item.quantity}
              unit={item.unit}
              className={isChecked ? 'line-through' : ''}
            />
            {item.price !== undefined && item.price > 0 && (
              <span className="text-sm text-[var(--muted-foreground)]">
                • ₪{item.price.toFixed(2)}
              </span>
            )}
            {isOutOfStock && (
              <span className="text-xs text-orange-500 font-medium">
                {t.list.outOfStock}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons - shown on hover */}
        {showActions && !state.isDragging && (
          <div 
            className={cn(
              'flex items-center gap-1',
              'opacity-0 transition-opacity duration-200',
              showActionsMenu && 'opacity-100'
            )}
            onMouseEnter={() => setShowActionsMenu(true)}
            onMouseLeave={() => setShowActionsMenu(false)}
          >
            <FavoriteButton
              isFavorite={isFavorite}
              onToggle={handleFavoriteToggle}
              size="sm"
            />
            
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="touch-target p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                aria-label={t.common.edit}
              >
                <Edit3 size={18} />
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                vibrate(10);
                onDelete();
              }}
              className="touch-target p-2 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
              aria-label={t.common.delete}
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
        
        {/* Delete button - always visible for easy access */}
        {showActions && !state.isDragging && !showActionsMenu && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              vibrate(10);
              onDelete();
            }}
            onMouseEnter={() => setShowActionsMenu(true)}
            className="touch-target p-2 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
            aria-label={t.common.delete}
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

// Simplified item for shopping mode
interface ShoppingItemProps {
  item: GroceryItemType;
  onToggleChecked: () => void;
  onMarkOutOfStock: () => void;
}

export function ShoppingItem({
  item,
  onToggleChecked,
  onMarkOutOfStock,
}: ShoppingItemProps) {
  const { t, isRTL } = useTranslation();
  const { getCategory } = useCategories();
  const category = getCategory(item.categoryId);

  const { handlers, state } = useSwipeGesture({
    threshold: 100,
    onSwipeLeft: () => {
      vibrate(20);
      onMarkOutOfStock();
    },
    onTap: () => {
      vibrate(15);
      onToggleChecked();
    },
    disabled: false, // Allow interaction even when checked (to uncheck)
  });

  const isChecked = item.status === 'checked';
  const isOutOfStock = item.status === 'out_of_stock';

  // Handle click for desktop (tap handles mobile)
  const handleClick = () => {
    vibrate(15);
    onToggleChecked();
  };

  return (
    <div
      {...handlers}
      onClick={handleClick}
      className={cn(
        'relative flex items-center gap-4 p-5',
        'bg-[var(--card)] rounded-2xl',
        'border-2 transition-all duration-200',
        'cursor-pointer select-none',
        'min-h-[72px]',
        'active:scale-[0.98]', // Visual feedback on press
        isChecked
          ? 'border-emerald-500/30 bg-emerald-500/10 opacity-60'
          : isOutOfStock
          ? 'border-orange-500/50 bg-orange-500/10'
          : 'border-[var(--border)] hover:border-emerald-500/50'
      )}
      style={{
        transform: `translateX(${state.translateX}px)`,
      }}
    >
      {/* Large checkbox */}
      <div
        className={cn(
          'w-8 h-8 rounded-full border-3 flex-shrink-0',
          'flex items-center justify-center',
          'transition-all duration-200',
          isChecked
            ? 'bg-emerald-500 border-emerald-500'
            : isOutOfStock
            ? 'border-orange-500'
            : 'border-[var(--muted-foreground)]'
        )}
      >
        {isChecked && <Check size={20} className="text-white" strokeWidth={3} />}
        {isOutOfStock && <AlertTriangle size={16} className="text-orange-500" />}
      </div>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-lg font-semibold',
            isChecked
              ? 'line-through text-[var(--muted-foreground)]'
              : 'text-[var(--foreground)]'
          )}
        >
          {item.name}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <QuantityDisplay quantity={item.quantity} unit={item.unit} />
          {category && (
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                category.color
              )}
            />
          )}
        </div>
      </div>

      {/* Swipe hint */}
      {!isChecked && !isOutOfStock && state.isDragging && state.progress > 0.3 && (
        <div className="absolute end-4 text-orange-500">
          <AlertTriangle size={24} />
        </div>
      )}
    </div>
  );
}

