'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Share2, MoreVertical, Trash2, Edit3, CheckCircle, XCircle, AlertCircle, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useGroceryList } from '@/hooks/useGroceryList';
import { BottomNav } from '@/components/BottomNav';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { SmartInput } from '@/components/SmartInput';
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
  const [duplicateNotification, setDuplicateNotification] = useState<string | null>(null);

  // Edit item form state
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editUnit, setEditUnit] = useState<UnitType>('unit');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState<string>('');

  // Show duplicate notification with auto-dismiss
  const showDuplicateAlert = (itemName: string) => {
    setDuplicateNotification(itemName);
    setTimeout(() => setDuplicateNotification(null), 3000);
  };

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
      showDuplicateAlert(result.existingItem.name);
    } else {
      setShowAddInput(false);
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
      showDuplicateAlert(result.duplicates.join(', '));
    }
    
    if (result.added.length > 0 || result.duplicates.length === items.length) {
      setShowAddInput(false);
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
              <p className="font-medium">{t.list.itemAlreadyExists || 'Item already exists'}</p>
              <p className="text-sm text-white/80 truncate">{duplicateNotification}</p>
            </div>
            <button
              onClick={() => setDuplicateNotification(null)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
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
          </div>
        )}

        {/* Items */}
        {allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[var(--muted-foreground)]">{t.list.emptyState}</p>
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

