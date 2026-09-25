'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { X, Check, AlertTriangle, ShoppingBag, ChevronDown, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { cn, groupBy, vibrate } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useGroceryList } from '@/hooks/useGroceryList';
import { useCategories } from '@/hooks/useCategories';
import { ShoppingItem } from '@/components/GroceryItem';
import { Button, IconButton } from '@/components/ui/Button';
import { QuantityDisplay, QuantityEditor } from '@/components/QuantityEditor';
import { Modal } from '@/components/ui/Modal';
import { SmartInput } from '@/components/SmartInput';
import { FrequentItems } from '@/components/FrequentItems';
import type { UnitType } from '@/types/grocery';

export default function ShoppingModePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { t, language, interpolate } = useTranslation();
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
    addItem,
    addItems,
    updateItem,
    removeItem,
  } = useGroceryList(id);

  const [showPickedItems, setShowPickedItems] = useState(true);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [actionItemId, setActionItemId] = useState<string | null>(null);

  // Read from the list on every render so the sheet shows live quantities
  const actionItem = list?.items.find((item) => item.id === actionItemId) || null;

  // Something added mid-shop that is already on the list is still needed -
  // if it was ticked off or marked out of stock, put it back
  const bringBack = (name: string) => {
    const existing = list?.items.find(
      (item) => item.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (existing && existing.status !== 'pending') {
      updateItem(existing.id, { status: 'pending', checkedAt: undefined });
    }
  };

  const handleAddWhileShopping = (item: {
    name: string;
    categoryId?: string;
    quantity?: number;
    unit?: UnitType;
  }) => {
    const result = addItem(item.name, {
      categoryId: item.categoryId,
      quantity: item.quantity,
      unit: item.unit,
    });
    if (result.isDuplicate) bringBack(item.name);
    setShowAddSheet(false);
  };

  const handleAddManyWhileShopping = (
    items: Array<{ name: string; categoryId: string; quantity: number; unit: UnitType }>
  ) => {
    const result = addItems(items);
    result.duplicates.forEach(bringBack);
    setShowAddSheet(false);
  };

  // History chips keep the sheet open, so several staples go in a row
  const handleAddFrequentWhileShopping = (item: {
    name: string;
    categoryId: string;
    quantity: number;
    unit: UnitType;
  }) => {
    vibrate(10);
    const result = addItem(item.name, {
      categoryId: item.categoryId,
      quantity: item.quantity,
      unit: item.unit,
    });
    if (result.isDuplicate) bringBack(item.name);
  };

  // Group pending items by category
  const groupedItems = useMemo(() => {
    return groupBy(pendingItems, (item) => item.categoryId);
  }, [pendingItems]);

  // Get active categories, plus a fallback group for items whose category no
  // longer exists so that they are never hidden while shopping.
  const activeGroups = useMemo(() => {
    const groups = categories
      .filter((cat) => groupedItems[cat.id]?.length > 0)
      .map((cat) => ({
        id: cat.id,
        name: cat.name[language],
        color: cat.color,
        items: groupedItems[cat.id],
      }));

    const knownIds = new Set(categories.map((cat) => cat.id));
    const orphanItems = pendingItems.filter((item) => !knownIds.has(item.categoryId));

    if (orphanItems.length > 0) {
      groups.push({
        id: '__uncategorized__',
        name: t.list.uncategorized,
        color: 'bg-slate-500',
        items: orphanItems,
      });
    }

    return groups;
  }, [categories, groupedItems, pendingItems, language, t]);

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
        {/* Safe area spacer for iPhone notch/dynamic island */}
        <div className="h-[calc(env(safe-area-inset-top,0px)+12px)]" />
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

          {/* Add without leaving shopping mode */}
          <IconButton
            onClick={() => setShowAddSheet(true)}
            className="text-white hover:bg-white/20"
            aria-label={t.shopping.addItem}
          >
            <Plus size={24} />
          </IconButton>
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
            {activeGroups.map((category) => {
              const items = category.items;
              
              return (
                <div key={category.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={cn('w-4 h-4 rounded-full', category.color)}
                    />
                    <span className="font-semibold text-[var(--foreground)]">
                      {category.name}
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
                        onMore={() => setActionItemId(item.id)}
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
                      onMore={() => setActionItemId(item.id)}
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

      {/* Add while shopping */}
      <Modal
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title={t.shopping.addItem}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted-foreground)]">{t.shopping.remembered}</p>
          <SmartInput
            onAddItem={handleAddWhileShopping}
            onAddMultiple={handleAddManyWhileShopping}
            onClose={() => setShowAddSheet(false)}
            autoFocus
          />
          <FrequentItems
            existingNames={pendingItems.map((item) => item.name)}
            onAdd={handleAddFrequentWhileShopping}
          />
        </div>
      </Modal>

      {/* One item's actions */}
      <Modal
        isOpen={!!actionItem}
        onClose={() => setActionItemId(null)}
        title={actionItem?.name}
      >
        {actionItem && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                {t.list.quantity}
              </p>
              {/* Saved as you change it - no Save button to hunt for */}
              <QuantityEditor
                quantity={actionItem.quantity}
                unit={actionItem.unit}
                categoryId={actionItem.categoryId}
                onQuantityChange={(quantity) => updateItem(actionItem.id, { quantity })}
                onUnitChange={(unit) => updateItem(actionItem.id, { unit })}
              />
            </div>

            <div className="space-y-2 pt-2">
              {actionItem.status === 'pending' ? (
                <Button
                  variant="secondary"
                  className="w-full text-orange-500"
                  leftIcon={<AlertTriangle size={18} />}
                  onClick={() => {
                    vibrate(20);
                    markOutOfStock(actionItem.id);
                    setActionItemId(null);
                  }}
                >
                  {t.list.markOutOfStock}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  leftIcon={<RotateCcw size={18} />}
                  onClick={() => {
                    updateItem(actionItem.id, { status: 'pending', checkedAt: undefined });
                    setActionItemId(null);
                  }}
                >
                  {t.shopping.backToList}
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full text-red-500"
                leftIcon={<Trash2 size={18} />}
                onClick={() => {
                  vibrate(20);
                  removeItem(actionItem.id);
                  setActionItemId(null);
                }}
              >
                {t.list.deleteItem}
              </Button>
            </div>
          </div>
        )}
      </Modal>

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

