'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Share2, MoreVertical, Trash2, Edit3, CheckCircle, XCircle, AlertCircle, X, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useAISettings } from '@/hooks/useSettings';
import { useGroceryList } from '@/hooks/useGroceryList';
import { categorizeMultipleItems } from '@/services/categorizer';
import { BottomNav } from '@/components/BottomNav';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { SmartInput } from '@/components/SmartInput';
import { FrequentItems } from '@/components/FrequentItems';
import { CategoryGroup } from '@/components/CategoryGroup';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { QuantityEditor } from '@/components/QuantityEditor';
import { CategoryPicker } from '@/components/CategoryPicker';
import { ShareModal } from '@/components/ShareModal';
import type { GroceryItem, UnitType } from '@/types/grocery';

export default function ListPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { t, isRTL, interpolate } = useTranslation();
  const { aiEnabled, hasApiKey } = useAISettings();
  const {
    list,
    isLoading,
    error,
    pendingItems,
    checkedItems,
    outOfStockItems,
    addItem,
    addItems,
    updateItem,
    updateItems,
    increaseItemQuantity,
    removeItem,
    toggleItemChecked,
    markOutOfStock,
    clearChecked,
    uncheckAll,
    updateListName,
    deleteList,
  } = useGroceryList(id);

  const [showAddInput, setShowAddInput] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [editingListName, setEditingListName] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteListConfirm, setShowDeleteListConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [duplicateNotification, setDuplicateNotification] = useState<
    { label: string; existingItemId?: string; quantity?: number } | null
  >(null);
  const [isCategorizingWithAI, setIsCategorizingWithAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Edit item form state
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editUnit, setEditUnit] = useState<UnitType>('unit');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState<string>('');

  // Show duplicate notification with auto-dismiss
  const showDuplicateAlert = useCallback((
    notification: { label: string; existingItemId?: string; quantity?: number }
  ) => {
    if (notificationTimer.current) clearTimeout(notificationTimer.current);
    setDuplicateNotification(notification);
    notificationTimer.current = setTimeout(() => setDuplicateNotification(null), 6000);
  }, []);

  // Clear the pending timer when leaving the page
  useEffect(() => {
    return () => {
      if (notificationTimer.current) clearTimeout(notificationTimer.current);
    };
  }, []);

  // Items are categorized instantly with keyword matching. When AI
  // categorization is switched on, refine those guesses in the background and
  // only correct the ones the AI disagrees with.
  const refineCategoriesWithAI = useCallback(async (added: GroceryItem[]) => {
    if (!aiEnabled || !hasApiKey || added.length === 0) return;
    
    setIsCategorizingWithAI(true);
    setAiError(null);
    try {
      const { results, aiError } = await categorizeMultipleItems(
        added.map((item) => item.name)
      );
      
      const updates = added
        .map((item) => {
          const result = results.get(item.name.toLowerCase());
          if (!result || result.source !== 'ai') return null;
          if (result.categoryId === item.categoryId) return null;
          return { id: item.id, changes: { categoryId: result.categoryId } };
        })
        .filter((update): update is { id: string; changes: { categoryId: string } } => update !== null);
      
      updateItems(updates);
      
      // A failure leaves the keyword categories in place, which looks like
      // success - say so instead of only logging it
      if (aiError) setAiError(aiError);
    } catch (err) {
      console.error('AI categorization failed:', err);
      setAiError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCategorizingWithAI(false);
    }
  }, [aiEnabled, hasApiKey, updateItems]);

  const handleAddItem = (item: {
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
    
    if (result.isDuplicate && result.existingItem) {
      showDuplicateAlert({
        label: result.existingItem.name,
        existingItemId: result.existingItem.id,
        quantity: item.quantity ?? 1,
      });
    } else {
      setShowAddInput(false);
      if (result.item) {
        void refineCategoriesWithAI([result.item]);
      }
    }
  };

  const handleAddMultiple = (items: Array<{
    name: string;
    categoryId: string;
    quantity: number;
    unit: UnitType;
  }>) => {
    const result = addItems(items);
    
    if (result.duplicates.length > 0) {
      showDuplicateAlert({ label: result.duplicates.join(', ') });
    }
    
    if (result.added.length > 0 || result.duplicates.length === items.length) {
      setShowAddInput(false);
    }
    
    if (result.added.length > 0) {
      void refineCategoriesWithAI(result.added);
    }
  };

  // Quick-add from the history chips. The category comes from what the item was
  // filed under last time, so there is nothing for the AI to improve here.
  const handleAddFrequent = (item: {
    name: string;
    categoryId: string;
    quantity: number;
    unit: UnitType;
  }) => {
    const result = addItem(item.name, {
      categoryId: item.categoryId,
      quantity: item.quantity,
      unit: item.unit,
    });
    
    if (result.isDuplicate && result.existingItem) {
      showDuplicateAlert({
        label: result.existingItem.name,
        existingItemId: result.existingItem.id,
        quantity: item.quantity,
      });
    }
  };

  const handleEditItem = (itemId: string) => {
    const item = list?.items.find((i) => i.id === itemId);
    if (item) {
      setEditingItem(item);
      setEditName(item.name);
      setEditQuantity(item.quantity);
      setEditUnit(item.unit);
      setEditCategory(item.categoryId);
      setEditPrice(item.price?.toString() || '');
    }
  };

  const handleSaveEdit = () => {
    if (editingItem && editName.trim()) {
      updateItem(editingItem.id, {
        name: editName.trim(),
        quantity: editQuantity,
        unit: editUnit,
        categoryId: editCategory,
        price: editPrice ? parseFloat(editPrice) : undefined,
      });
      setEditingItem(null);
    }
  };

  const handleStartEditListName = () => {
    if (list) {
      setNewListName(list.name);
      setEditingListName(true);
      setShowMenu(false);
    }
  };

  const handleSaveListName = () => {
    if (newListName.trim()) {
      updateListName(newListName.trim());
      setEditingListName(false);
    }
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

  const allItems = [...pendingItems, ...outOfStockItems, ...checkedItems];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        {/* Safe area spacer for iPhone notch/dynamic island */}
        <div className="h-[calc(env(safe-area-inset-top,0px)+12px)]" />
        <div className="flex items-center gap-3 px-4 py-3">
          <IconButton onClick={() => router.push('/')}>
            <ArrowLeft size={24} className={cn('lucide-arrow-left', isRTL && 'rotate-180')} />
          </IconButton>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-[var(--foreground)] truncate">
              {list.name}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {interpolate(t.home.listItems, { count: list.items.length })}
            </p>
          </div>

          <Button
            onClick={() => router.push(`/list/${id}/shopping`)}
            variant="primary"
            size="sm"
            leftIcon={<ShoppingBag size={18} className="lucide-shopping-bag" />}
            className="whitespace-nowrap"
          >
            {t.list.startShopping}
          </Button>

          <div className="relative">
            <IconButton onClick={() => setShowMenu(!showMenu)}>
              <MoreVertical size={22} className="lucide-more-vertical" />
            </IconButton>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute top-full mt-1 end-0 z-50 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg py-1 min-w-[180px] animate-scale-in">
                  <button
                    onClick={handleStartEditListName}
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--accent)] transition-colors"
                  >
                    <Edit3 size={16} className="lucide-edit-3" />
                    {t.common.edit}
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowShareModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--accent)] transition-colors"
                  >
                    <Share2 size={16} className="lucide-share-2" />
                    {t.list.shareList}
                  </button>
                  {(checkedItems.length > 0 || outOfStockItems.length > 0) && (
                    <>
                      <div className="border-t border-[var(--border)] my-1" />
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowResetConfirm(true);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--accent)] transition-colors"
                      >
                        <RotateCcw size={16} />
                        {t.list.resetShopping}
                      </button>
                    </>
                  )}
                  {checkedItems.length > 0 && (
                    <>
                      <div className="border-t border-[var(--border)] my-1" />
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowClearConfirm(true);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--accent)] transition-colors"
                      >
                        <Trash2 size={16} />
                        {t.list.clearChecked}
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          uncheckAll();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--accent)] transition-colors"
                      >
                        <XCircle size={16} />
                        {t.list.uncheckAll}
                      </button>
                    </>
                  )}
                  <div className="border-t border-[var(--border)] my-1" />
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteListConfirm(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-500/10 text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                    {t.list.deleteList}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Duplicate Item Notification */}
      {duplicateNotification && (
        <div className="fixed top-20 left-4 right-4 z-50 animate-fade-in">
          <div className="bg-orange-500 text-white rounded-xl p-4 shadow-lg flex items-center gap-3">
            <AlertCircle size={20} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium">{t.list.itemAlreadyExists}</p>
              <p className="text-sm text-white/80 truncate">{duplicateNotification.label}</p>
            </div>
            {duplicateNotification.existingItemId && (
              <button
                onClick={() => {
                  increaseItemQuantity(
                    duplicateNotification.existingItemId as string,
                    duplicateNotification.quantity || 1
                  );
                  setDuplicateNotification(null);
                  setShowAddInput(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium whitespace-nowrap transition-colors"
              >
                +{duplicateNotification.quantity || 1}
              </button>
            )}
            <button
              onClick={() => setDuplicateNotification(null)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label={t.common.close}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* AI could not answer - the items are still there, categorized by keyword */}
      {aiError && (
        <div className="fixed bottom-24 left-4 right-4 z-40 flex justify-center">
          <div className="flex items-start gap-2 max-w-md w-full px-3 py-2 rounded-xl bg-orange-500/15 border border-orange-500/40 text-sm">
            <AlertCircle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[var(--foreground)]">{t.list.aiFailed}</p>
              <p className="text-xs text-[var(--muted-foreground)] break-words">{aiError}</p>
            </div>
            <button
              onClick={() => setAiError(null)}
              className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label={t.common.close}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* AI categorization indicator */}
      {isCategorizingWithAI && (
        <div className="fixed bottom-24 left-4 right-4 z-40 flex justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-lg text-sm text-[var(--muted-foreground)]">
            <Sparkles size={14} className="text-emerald-500 animate-pulse" />
            {t.list.aiCategorizing}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="px-4 pb-safe">
        {/* Add input */}
        {showAddInput && (
          <div className="py-4 animate-fade-in">
            <SmartInput
              onAddItem={handleAddItem}
              onAddMultiple={handleAddMultiple}
              onClose={() => setShowAddInput(false)}
              autoFocus
            />
            
            <div className="mt-4">
              <FrequentItems
                existingNames={list.items.map((item) => item.name)}
                onAdd={handleAddFrequent}
              />
            </div>
          </div>
        )}

        {/* Items */}
        {allItems.length === 0 ? (
          <div className="py-10">
            <p className="text-center text-[var(--muted-foreground)]">{t.list.emptyState}</p>
            
            {!showAddInput && (
              <div className="mt-8">
                <FrequentItems existingNames={[]} onAdd={handleAddFrequent} />
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 space-y-6">
            {/* Pending items grouped by category */}
            {pendingItems.length > 0 && (
              <CategoryGroup
                items={pendingItems}
                onToggleChecked={toggleItemChecked}
                onMarkOutOfStock={markOutOfStock}
                onDelete={removeItem}
                onEdit={handleEditItem}
              />
            )}

            {/* Out of stock items */}
            {outOfStockItems.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-orange-500 mb-3">
                  <span>{t.list.pendingNextTrip}</span>
                  <span className="text-xs bg-orange-500/20 px-2 py-0.5 rounded-full">
                    {outOfStockItems.length}
                  </span>
                </h3>
                <CategoryGroup
                  items={outOfStockItems}
                  onToggleChecked={toggleItemChecked}
                  onMarkOutOfStock={markOutOfStock}
                  onDelete={removeItem}
                  onEdit={handleEditItem}
                  collapsible={false}
                />
              </div>
            )}

            {/* Checked items */}
            {checkedItems.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)] mb-3">
                  <CheckCircle size={16} />
                  <span>{t.list.checkedItems}</span>
                  <span className="text-xs bg-[var(--secondary)] px-2 py-0.5 rounded-full">
                    {checkedItems.length}
                  </span>
                </h3>
                <CategoryGroup
                  items={checkedItems}
                  onToggleChecked={toggleItemChecked}
                  onMarkOutOfStock={markOutOfStock}
                  onDelete={removeItem}
                  collapsible={false}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* FAB */}
      <FloatingAddButton
        onClick={() => setShowAddInput(!showAddInput)}
        label={t.list.addItem}
      />

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Edit Item Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={t.list.editItem}
      >
        <div className="space-y-4">
          <Input
            label={t.list.itemName}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              {t.list.quantity}
            </label>
            <QuantityEditor
              quantity={editQuantity}
              unit={editUnit}
              onQuantityChange={setEditQuantity}
              onUnitChange={setEditUnit}
              categoryId={editCategory}
            />
          </div>

          <CategoryPicker
            label={t.list.category}
            value={editCategory}
            onChange={setEditCategory}
          />

          <Input
            label={t.list.price}
            type="number"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            placeholder="0.00"
          />

          <div className="flex gap-3 mt-6">
            <Button variant="secondary" className="flex-1" onClick={() => setEditingItem(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleSaveEdit}>
              {t.common.save}
            </Button>
          </div>

          {/* Deleting used to be possible only by swiping, which is invisible on
              desktop and hard to discover on touch */}
          <Button
            variant="ghost"
            className="w-full text-red-500"
            leftIcon={<Trash2 size={18} className="lucide-trash-2" />}
            onClick={() => {
              if (editingItem) {
                removeItem(editingItem.id);
                setEditingItem(null);
              }
            }}
          >
            {t.list.deleteItem}
          </Button>
        </div>
      </Modal>

      {/* Edit List Name Modal */}
      <Modal
        isOpen={editingListName}
        onClose={() => setEditingListName(false)}
        title={t.common.edit}
      >
        <div className="space-y-4">
          <Input
            label={t.newList.listName}
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setEditingListName(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleSaveListName}>
              {t.common.save}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clear Checked Confirmation */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          clearChecked();
          setShowClearConfirm(false);
        }}
        title={t.list.clearChecked}
        message={`${checkedItems.length} ${t.common.items}`}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        variant="danger"
      />

      {/* Reset Shopping Confirmation */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          uncheckAll();
          setShowResetConfirm(false);
        }}
        title={t.list.resetShopping}
        message={t.list.resetShoppingConfirm}
        confirmText={t.list.resetShopping}
        cancelText={t.common.cancel}
      />

      {/* Delete List Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteListConfirm}
        onClose={() => setShowDeleteListConfirm(false)}
        onConfirm={() => {
          deleteList();
          setShowDeleteListConfirm(false);
          router.push('/');
        }}
        title={t.list.deleteList}
        message={t.list.deleteListConfirm}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        variant="danger"
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        listId={id}
        listName={list.name}
      />
    </div>
  );
}

