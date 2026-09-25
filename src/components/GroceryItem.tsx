'use client';

import React, { useEffect, useRef } from 'react';
import { Check, AlertTriangle, Trash2, Edit3, MoreHorizontal } from 'lucide-react';
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
  showCategory = true,
  showActions = true,
  compact = false,
}: GroceryItemProps) {
  const { t } = useTranslation();
  const { getCategory } = useCategories();
  const { isFavorite, toggle } = useFavoriteButton(item.name);

  const category = getCategory(item.categoryId);

  const handleFavoriteToggle = () => {
    // Use the local toggle to update both storage and UI state
    toggle(item);
  };

  const isChecked = item.status === 'checked';
  const isOutOfStock = item.status === 'out_of_stock';

  // Swipe left to delete (physical left, regardless of RTL)
  const { handlers, state } = useSwipeGesture({
    threshold: 100,
    onSwipeLeft: () => {
      vibrate(20);
      onDelete();
    },
    disabled: false,
    ignoreRTL: true, // Delete is always swipe left physically
  });

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
      {/* Delete indicator background (revealed on swipe) */}
      <div className="absolute inset-y-0 end-0 w-24 bg-red-500 flex items-center justify-end pe-4">
        <Trash2 size={24} className="text-white" />
      </div>

      {/* Main content */}
      <div
        {...handlers}
        className={cn(
          'relative flex items-center gap-3 p-4',
          'bg-[var(--card)] touch-pan-y',
          !state.isDragging && 'transition-transform duration-200',
          compact ? 'py-3' : 'py-4'
        )}
        style={{
          transform: `translateX(${state.translateX}px)`,
        }}
      >
        {/* Checkbox - tapping only this control toggles the item, so that
            scrolling or swiping the row never checks something by accident */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            vibrate(10);
            onToggleChecked();
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          role="checkbox"
          aria-checked={isChecked}
          aria-label={isChecked ? t.list.uncheckItem : t.list.checkItem}
          className="flex-shrink-0 p-2 -m-2 flex items-center justify-center"
        >
          <span
            className={cn(
              'w-6 h-6 rounded-full border-2',
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
          </span>
        </button>

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

        {/* Action buttons - favorite and edit only (delete is via swipe) */}
        {showActions && (
          <div 
            className="flex items-center gap-1"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Favorite */}
            <FavoriteButton
              isFavorite={isFavorite}
              onToggle={handleFavoriteToggle}
              size="sm"
            />
            
            {/* Edit */}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  vibrate(10);
                  onEdit();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  vibrate(10);
                  onEdit();
                }}
                className="touch-target p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] active:text-[var(--foreground)] transition-colors"
                aria-label={t.common.edit}
              >
                <Edit3 size={18} className="lucide-edit-3" />
              </button>
            )}
          </div>
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
  /** Opens the item's actions (quantity, out of stock, delete) */
  onMore?: () => void;
}

// Touches on the actions button must not reach the row: they would toggle it
const stopTouch = (e: React.TouchEvent) => e.stopPropagation();

export function ShoppingItem({
  item,
  onToggleChecked,
  onMarkOutOfStock,
  onMore,
}: ShoppingItemProps) {
  const { t, interpolate, isRTL } = useTranslation();
  const { getCategory } = useCategories();
  const category = getCategory(item.categoryId);

  // Ticking off needs a deliberate swipe: a tap used to do it, and in a busy
  // aisle a stray tap - or a quick flick to scroll - made items vanish from
  // the list. Swipe towards the end of the line (right, or left in Hebrew)
  // for "got it"; the other way for "out of stock". A mouse click and the
  // keyboard still tick off, since they cannot swipe.
  const { handlers, state } = useSwipeGesture({
    threshold: 100,
    onSwipeRight: () => {
      vibrate(15);
      onToggleChecked();
    },
    onSwipeLeft: () => {
      vibrate(20);
      onMarkOutOfStock();
    },
    onTap: () => {
      vibrate(15);
      onToggleChecked();
    },
    tapOnTouch: false,
    disabled: false, // Allow interaction even when checked (to uncheck)
  });

  // Swipes are tracked on the whole card; the click (mouse / keyboard) only on
  // the checkbox area, so the actions button beside it stays independent
  const { onClick: handleTapClick, ...swipeHandlers } = handlers;

  const isChecked = item.status === 'checked';
  const isOutOfStock = item.status === 'out_of_stock';

  // What letting go would do, so the colour behind the card can say so
  const pendingAction =
    state.direction === 'right' ? 'got-it' : state.direction === 'left' ? 'out-of-stock' : null;
  const willAct = state.progress >= 1;

  // A small buzz at the moment letting go will act - you can feel it without
  // looking, one-handed in an aisle
  const armed = useRef(false);
  useEffect(() => {
    if (willAct && !armed.current) {
      armed.current = true;
      vibrate(10);
    } else if (!willAct) {
      armed.current = false;
    }
  }, [willAct]);

  // The card moves away from the side the icon should sit on
  const revealFromLeft = state.translateX > 0;

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Revealed behind the card while dragging */}
      {pendingAction && state.translateX !== 0 && (
        <div
          aria-hidden="true"
          className={cn(
            'absolute inset-0 flex items-center gap-2 px-6 rounded-2xl',
            'text-white font-semibold transition-colors',
            revealFromLeft ? 'justify-start' : 'justify-end',
            pendingAction === 'got-it'
              ? willAct ? 'bg-emerald-500' : 'bg-emerald-500/40'
              : willAct ? 'bg-orange-500' : 'bg-orange-500/40'
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {pendingAction === 'got-it' ? (
            <>
              <Check size={24} strokeWidth={3} className={cn(willAct && 'scale-125', 'transition-transform')} />
              <span>{t.shopping.gotIt}</span>
            </>
          ) : (
            <>
              <AlertTriangle size={22} className={cn(willAct && 'scale-125', 'transition-transform')} />
              <span>{t.list.outOfStock}</span>
            </>
          )}
        </div>
      )}

    <div
      {...swipeHandlers}
      className={cn(
        'relative flex items-stretch',
        'bg-[var(--card)] rounded-2xl',
        'border-2',
        'select-none min-h-[72px] touch-pan-y',
        !state.isDragging && 'transition-all duration-200',
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
      <div
        role="checkbox"
        aria-checked={isChecked}
        tabIndex={0}
        onClick={handleTapClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            vibrate(15);
            onToggleChecked();
          }
        }}
        className={cn(
          'flex-1 min-w-0 flex items-center gap-4 p-5 rounded-2xl',
          'cursor-pointer',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500'
        )}
      >
        {/* Large checkbox */}
        <div
          className={cn(
            'w-8 h-8 rounded-full border-[3px] flex-shrink-0',
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
              'text-lg font-semibold break-words',
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
      </div>

      {/* Actions: quantity, out of stock, delete - without leaving the aisle */}
      {onMore && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            vibrate(10);
            onMore();
          }}
          onTouchStart={stopTouch}
          onTouchMove={stopTouch}
          onTouchEnd={stopTouch}
          className={cn(
            'flex-shrink-0 w-14 flex items-center justify-center rounded-e-2xl',
            'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            'active:bg-[var(--secondary)] transition-colors'
          )}
          aria-label={interpolate(t.shopping.itemActions, { name: item.name })}
        >
          <MoreHorizontal size={22} />
        </button>
      )}

    </div>
    </div>
  );
}
