'use client';

import React, { useState, useMemo } from 'react';
import { Search, Heart } from 'lucide-react';
import { cn, groupBy } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useFavorites } from '@/hooks/useFavorites';
import { useCategories } from '@/hooks/useCategories';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Toggle';
import { QuantityDisplay } from './QuantityEditor';
import type { FavoriteItem } from '@/types/grocery';

interface FavoritesPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (items: FavoriteItem[]) => void;
  title?: string;
}

export function FavoritesPicker({
  isOpen,
  onClose,
  onSelect,
  title,
}: FavoritesPickerProps) {
  const { t, language } = useTranslation();
  const { favorites } = useFavorites();
  const { categories, getCategoryDisplayName } = useCategories();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const displayTitle = title || t.favorites.selectFavorites;

  // Filter favorites by search
  const filteredFavorites = useMemo(() => {
    if (!searchQuery.trim()) return favorites;
    
    const query = searchQuery.toLowerCase();
    return favorites.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        getCategoryDisplayName(f.categoryId).toLowerCase().includes(query)
    );
  }, [favorites, searchQuery, getCategoryDisplayName]);

  // Group by category
  const groupedFavorites = useMemo(() => {
    return groupBy(filteredFavorites, (f) => f.categoryId);
  }, [filteredFavorites]);

  // Get active categories
  const activeCategories = categories.filter(
    (cat) => groupedFavorites[cat.id]?.length > 0
  );

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredFavorites.map((f) => f.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleConfirm = () => {
    const selected = favorites.filter((f) => selectedIds.has(f.id));
    onSelect(selected);
    onClose();
    // Reset state
    setSelectedIds(new Set());
    setSearchQuery('');
  };

  const handleClose = () => {
    onClose();
    setSelectedIds(new Set());
    setSearchQuery('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={displayTitle}>
      {favorites.length === 0 ? (
        <div className="py-8 text-center">
          <Heart size={48} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
          <p className="text-[var(--muted-foreground)]">{t.favorites.noFavorites}</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={18}
              className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.common.search}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-[var(--input)] border border-[var(--border)] text-sm"
            />
          </div>

          {/* Select all / Deselect all */}
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {t.favorites.selectAll}
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              {t.favorites.deselectAll}
            </Button>
            <span className="ms-auto text-sm text-[var(--muted-foreground)]">
              {selectedIds.size} / {filteredFavorites.length}
            </span>
          </div>

          {/* Favorites list */}
          <div className="max-h-[40vh] overflow-y-auto space-y-4">
            {activeCategories.map((category) => {
              const items = groupedFavorites[category.id] || [];
              
              return (
                <div key={category.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn('w-3 h-3 rounded-full', category.color)}
                    />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {category.name[language]}
                    </span>
                  </div>
                  
                  <div className="space-y-1 ps-5">
                    {items.map((item) => (
                      <label
                        key={item.id}
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-lg cursor-pointer',
                          'hover:bg-[var(--accent)] transition-colors',
                          selectedIds.has(item.id) && 'bg-[var(--accent)]'
                        )}
                      >
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleItem(item.id)}
                        />
                        <span className="flex-1 text-[var(--foreground)]">
                          {item.name}
                        </span>
                        <QuantityDisplay
                          quantity={item.quantity}
                          unit={item.unit}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button variant="secondary" className="flex-1" onClick={handleClose}>
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
            >
              {t.favorites.addToList} ({selectedIds.size})
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

