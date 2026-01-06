'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { X, Check, AlertTriangle, ShoppingBag, ChevronDown, RotateCcw } from 'lucide-react';
import { cn, groupBy, vibrate } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useGroceryList } from '@/hooks/useGroceryList';
import { useCategories } from '@/hooks/useCategories';
import { ShoppingItem } from '@/components/GroceryItem';
import { Button, IconButton } from '@/components/ui/Button';
import { QuantityDisplay } from '@/components/QuantityEditor';

export default function ShoppingModePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { t, language, interpolate, isRTL } = useTranslation();
  const { categories, getCategory } = useCategories();
  const {
    list,
    isLoading,
    error,
    pendingItems,
    checkedItems,
    outOfStockItems,
    toggleItemChecked,
    markOutOfStock,
  } = useGroceryList(id);

  const [showPickedItems, setShowPickedItems] = useState(true);

  // Group pending items by category
  const groupedItems = useMemo(() => {
    return groupBy(pendingItems, (item) => item.categoryId);
  }, [pendingItems]);

  // Get active categories
  const activeCategories = useMemo(() => {
    return categories.filter((cat) => groupedItems[cat.id]?.length > 0);
  }, [categories, groupedItems]);

  const handleComplete = () => {
    vibrate(30);
    router.push(`/list/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4">
        <p className="text-[var(--muted-foreground)] mb-4">{t.errors.listNotFound}</p>
        <Button onClick={() => router.push('/')}>{t.common.close}</Button>
      </div>
    );
  }

  const allDone = pendingItems.length === 0;

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header - minimal for shopping mode */}
      <header className="sticky top-0 z-30 bg-emerald-500 text-white flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-4">
          <IconButton
            onClick={() => router.push(`/list/${id}`)}
            className="text-white hover:bg-white/20"
          >
            <X size={24} className="lucide-x" />
          </IconButton>
          
          <div className="text-center">
            <h1 className="font-bold">{t.shopping.title}</h1>
            <p className="text-sm text-white/80">
              {allDone
                ? t.shopping.allDone
                : interpolate(t.shopping.itemsLeft, { count: pendingItems.length })}
            </p>
          </div>

          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/20">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{
              width: `${
                list.items.length > 0
                  ? ((checkedItems.length + outOfStockItems.length) / list.items.length) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        {allDone ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-scale-in">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
              <Check size={48} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              {t.shopping.allDone}
            </h2>
            <p className="text-[var(--muted-foreground)] mb-8">
              {checkedItems.length} {t.common.items}
            </p>
            
            {outOfStockItems.length > 0 && (
              <div className="flex items-center gap-2 text-orange-500 mb-8">
                <AlertTriangle size={18} />
                <span>
                  {interpolate(t.shopping.outOfStockItems, { count: outOfStockItems.length })}
                </span>
              </div>
            )}

            <Button onClick={handleComplete} size="lg">
              {t.shopping.complete}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="text-center text-sm text-[var(--muted-foreground)] space-y-1">
              <p>{t.shopping.tapToCheck}</p>
              <p>{t.shopping.swipeForActions}</p>
            </div>

            {/* Items by category */}
            {activeCategories.map((category) => {
              const items = groupedItems[category.id] || [];
              
              return (
                <div key={category.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={cn('w-4 h-4 rounded-full', category.color)}
                    />
                    <span className="font-semibold text-[var(--foreground)]">
                      {category.name[language]}
                    </span>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      ({items.length})
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {items.map((item) => (
                      <ShoppingItem
                        key={item.id}
                        item={item}
                        onToggleChecked={() => {
                          vibrate(15);
                          toggleItemChecked(item.id);
                        }}
                        onMarkOutOfStock={() => {
                          vibrate(20);
                          markOutOfStock(item.id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Out of stock section */}
            {outOfStockItems.length > 0 && (
              <div className="pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 mb-3 text-orange-500">
                  <AlertTriangle size={18} />
                  <span className="font-semibold">{t.list.outOfStock}</span>
                  <span className="text-sm">({outOfStockItems.length})</span>
                </div>
                
                <div className="space-y-3 opacity-60">
                  {outOfStockItems.map((item) => (
                    <ShoppingItem
                      key={item.id}
                      item={item}
                      onToggleChecked={() => toggleItemChecked(item.id)}
                      onMarkOutOfStock={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Picked items section */}
            {checkedItems.length > 0 && (
              <div className="pt-4 border-t border-[var(--border)]">
                <button
                  onClick={() => setShowPickedItems(!showPickedItems)}
                  className="w-full flex items-center gap-2 mb-3 text-emerald-500"
                >
                  <Check size={18} />
                  <span className="font-semibold">{t.list.checkedItems}</span>
                  <span className="text-sm">({checkedItems.length})</span>
                  <ChevronDown 
                    size={18} 
                    className={cn(
                      'ms-auto transition-transform',
                      !showPickedItems && '-rotate-90'
                    )}
                  />
                </button>
                
                {showPickedItems && (
                  <div className="space-y-2">
                    {checkedItems.map((item) => {
                      const category = getCategory(item.categoryId);
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'flex items-center gap-3 p-3',
                            'bg-emerald-500/10 rounded-xl',
                            'border border-emerald-500/20'
                          )}
                        >
                          {/* Checked indicator */}
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <Check size={14} className="text-white" strokeWidth={3} />
                          </div>
                          
                          {/* Item info */}
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-[var(--muted-foreground)] line-through">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <QuantityDisplay 
                                quantity={item.quantity} 
                                unit={item.unit} 
                                className="text-xs opacity-60"
                              />
                              {category && (
                                <span className={cn('w-2 h-2 rounded-full', category.color)} />
                              )}
                            </div>
                          </div>
                          
                          {/* Restore button */}
                          <button
                            onClick={() => {
                              vibrate(10);
                              toggleItemChecked(item.id);
                            }}
                            className={cn(
                              'flex items-center gap-1 px-3 py-1.5 rounded-lg',
                              'bg-[var(--background)] text-[var(--foreground)]',
                              'text-xs font-medium',
                              'hover:bg-[var(--accent)] transition-colors'
                            )}
                          >
                            <RotateCcw size={14} />
                            <span>{t.common.restore || 'Restore'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom action - sticky footer */}
      {!allDone && (
        <footer className="flex-shrink-0 p-4 bg-[var(--background)] border-t border-[var(--border)]">
          <Button
            onClick={handleComplete}
            variant="secondary"
            className="w-full"
            size="lg"
          >
            {t.shopping.exitShopping}
          </Button>
        </footer>
      )}
    </div>
  );
}

