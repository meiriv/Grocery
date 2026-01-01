'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Trash2, Edit3, Plus } from 'lucide-react';
import { cn, groupBy } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useFavorites } from '@/hooks/useFavorites';
import { useCategories } from '@/hooks/useCategories';
import { useGroceryLists } from '@/hooks/useGroceryList';
import { BottomNav } from '@/components/BottomNav';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { QuantityEditor, QuantityDisplay } from '@/components/QuantityEditor';
import { CategoryPicker } from '@/components/CategoryPicker';
import type { FavoriteItem, UnitType } from '@/types/grocery';

export default function FavoritesPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { favorites, removeFavorite, updateFavorite, toGroceryItems } = useFavorites();
  const { categories } = useCategories();
  const { lists, createList } = useGroceryLists();

  const [editingItem, setEditingItem] = useState<FavoriteItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showAddToList, setShowAddToList] = useState(false);
  const [selectedListId, setSelectedListId] = useState('');

  // Edit form state
  const [editQuantity, setEditQuantity] = useState(1);
  const [editUnit, setEditUnit] = useState<UnitType>('unit');
  const [editCategory, setEditCategory] = useState('');

  // Group favorites by category
  const groupedFavorites = groupBy(favorites, (f) => f.categoryId);
  const activeCategories = categories.filter(
    (cat) => groupedFavorites[cat.id]?.length > 0
  );

  const handleEdit = (item: FavoriteItem) => {
    setEditingItem(item);
    setEditQuantity(item.quantity);
    setEditUnit(item.unit);
    setEditCategory(item.categoryId);
  };

  const handleSaveEdit = () => {
    if (editingItem) {
      updateFavorite({
        ...editingItem,
        quantity: editQuantity,
        unit: editUnit,
        categoryId: editCategory,
      });
      setEditingItem(null);
    }
  };

  const handleDelete = () => {
    if (itemToDelete) {
      removeFavorite(itemToDelete);
      setItemToDelete(null);
    }
  };

  const handleAddAllToList = () => {
    if (selectedListId === 'new') {
      // Create new list with all favorites
      const items = favorites.map((f) => ({
        name: f.name,
        categoryId: f.categoryId,
        quantity: f.quantity,
        unit: f.unit,
      }));
      const newList = createList('Favorites', items);
      router.push(`/list/${newList.id}`);
    } else if (selectedListId) {
      // Add to existing list
      router.push(`/list/${selectedListId}?addFavorites=all`);
    }
    setShowAddToList(false);
    setSelectedListId('');
  };

  const listOptions = [
    { value: 'new', label: `+ ${t.home.newList}` },
    ...lists.map((list) => ({
      value: list.id,
      label: list.name,
    })),
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {t.favorites.title}
          </h1>
          
          {favorites.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddToList(true)}
              leftIcon={<Plus size={18} />}
            >
              {t.favorites.addAllToList}
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="px-4 pb-safe">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--secondary)] flex items-center justify-center mb-4">
              <Heart size={40} className="text-[var(--muted-foreground)]" />
            </div>
            <p className="text-[var(--muted-foreground)] max-w-xs">
              {t.favorites.noFavorites}
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            {activeCategories.map((category) => {
              const items = groupedFavorites[category.id] || [];
              
              return (
                <div key={category.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={cn('w-3 h-3 rounded-full', category.color)}
                    />
                    <span className="font-semibold text-[var(--foreground)]">
                      {category.name[language]}
                    </span>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      ({items.length})
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-3 p-3 bg-[var(--card)] rounded-xl border border-[var(--border)]"
                      >
                        <Heart
                          size={20}
                          className="text-red-500 fill-red-500 flex-shrink-0"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-[var(--foreground)]">
                            {item.name}
                          </span>
                          <div className="text-sm text-[var(--muted-foreground)]">
                            <QuantityDisplay quantity={item.quantity} unit={item.unit} />
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <IconButton
                            onClick={() => handleEdit(item)}
                            className="text-[var(--muted-foreground)]"
                          >
                            <Edit3 size={18} />
                          </IconButton>
                          <IconButton
                            onClick={() => setItemToDelete(item.id)}
                            className="text-[var(--muted-foreground)] hover:text-red-500"
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={t.common.edit}
      >
        {editingItem && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                {t.list.itemName}
              </label>
              <p className="text-[var(--foreground)]">{editingItem.name}</p>
            </div>

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

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setEditingItem(null)}
              >
                {t.common.cancel}
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleSaveEdit}>
                {t.common.save}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add to List Modal */}
      <Modal
        isOpen={showAddToList}
        onClose={() => {
          setShowAddToList(false);
          setSelectedListId('');
        }}
        title={t.favorites.addToList}
      >
        <div className="space-y-4">
          <p className="text-[var(--muted-foreground)]">
            {favorites.length} {t.common.items}
          </p>
          
          <Select
            value={selectedListId}
            onChange={setSelectedListId}
            options={listOptions}
            placeholder={t.newList.selectList}
          />

          <div className="flex gap-3 mt-6">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowAddToList(false);
                setSelectedListId('');
              }}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleAddAllToList}
              disabled={!selectedListId}
            >
              {t.common.add}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title={t.favorites.removeFromFavorites}
        message={t.common.confirm}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        variant="danger"
      />
    </div>
  );
}

