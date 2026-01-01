'use client';

import React, { useState } from 'react';
import { List, Heart, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useFavorites } from '@/hooks/useFavorites';
import { useGroceryLists } from '@/hooks/useGroceryList';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Radio } from './ui/Toggle';
import { Select } from './ui/Select';
import { FavoritesPicker } from './FavoritesPicker';
import type { GroceryList, FavoriteItem, UnitType } from '@/types/grocery';

type StartOption = 'empty' | 'favorites' | 'copy';

interface NewListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateList: (list: GroceryList) => void;
}

export function NewListModal({ isOpen, onClose, onCreateList }: NewListModalProps) {
  const { t, language } = useTranslation();
  const { favorites, count: favoritesCount } = useFavorites();
  const { lists, createList } = useGroceryLists();
  
  const [name, setName] = useState('');
  const [startOption, setStartOption] = useState<StartOption>('empty');
  const [selectedListId, setSelectedListId] = useState('');
  const [showFavoritesPicker, setShowFavoritesPicker] = useState(false);
  const [selectedFavorites, setSelectedFavorites] = useState<FavoriteItem[]>([]);
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      setError(t.newList.listName);
      return;
    }

    let initialItems: Array<{
      name: string;
      categoryId: string;
      quantity: number;
      unit: UnitType;
    }> = [];

    if (startOption === 'favorites' && selectedFavorites.length > 0) {
      initialItems = selectedFavorites.map((f) => ({
        name: f.name,
        categoryId: f.categoryId,
        quantity: f.quantity,
        unit: f.unit,
      }));
    } else if (startOption === 'copy' && selectedListId) {
      const sourceList = lists.find((l) => l.id === selectedListId);
      if (sourceList) {
        initialItems = sourceList.items.map((item) => ({
          name: item.name,
          categoryId: item.categoryId,
          quantity: item.quantity,
          unit: item.unit,
        }));
      }
    }

    const newList = createList(name.trim(), initialItems);
    onCreateList(newList);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setStartOption('empty');
    setSelectedListId('');
    setSelectedFavorites([]);
    setError('');
    onClose();
  };

  const handleFavoritesSelect = (items: FavoriteItem[]) => {
    setSelectedFavorites(items);
    setShowFavoritesPicker(false);
  };

  const listOptions = lists.map((list) => ({
    value: list.id,
    label: `${list.name} (${list.items.length} ${t.common.items})`,
  }));

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={t.newList.title}>
        <div className="space-y-6">
          {/* List name */}
          <Input
            label={t.newList.listName}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder={t.newList.listNamePlaceholder}
            error={error}
            autoFocus
          />

          {/* Start options */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
              {t.newList.startWith}
            </label>
            
            <div className="space-y-2">
              {/* Empty list */}
              <div
                className={cn(
                  'p-3 rounded-xl border transition-colors cursor-pointer',
                  startOption === 'empty'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
                )}
                onClick={() => setStartOption('empty')}
              >
                <Radio
                  checked={startOption === 'empty'}
                  onChange={() => setStartOption('empty')}
                  label={t.newList.emptyList}
                />
              </div>

              {/* From favorites */}
              <div
                className={cn(
                  'p-3 rounded-xl border transition-colors',
                  startOption === 'favorites'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-[var(--border)] hover:border-[var(--muted-foreground)]',
                  favoritesCount === 0 && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => favoritesCount > 0 && setStartOption('favorites')}
              >
                <div className="flex items-center justify-between">
                  <Radio
                    checked={startOption === 'favorites'}
                    onChange={() => setStartOption('favorites')}
                    label={t.newList.fromFavorites}
                    description={
                      favoritesCount > 0
                        ? `${favoritesCount} ${t.common.items}`
                        : t.favorites.noFavorites
                    }
                    disabled={favoritesCount === 0}
                  />
                  <Heart
                    size={20}
                    className={cn(
                      'text-[var(--muted-foreground)]',
                      startOption === 'favorites' && 'text-red-500 fill-red-500'
                    )}
                  />
                </div>
                
                {startOption === 'favorites' && favoritesCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    {selectedFavorites.length > 0 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--muted-foreground)]">
                          {selectedFavorites.length} {t.common.items} selected
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowFavoritesPicker(true);
                          }}
                        >
                          {t.common.edit}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFavoritesPicker(true);
                        }}
                      >
                        {t.favorites.selectFavorites}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Copy from list */}
              <div
                className={cn(
                  'p-3 rounded-xl border transition-colors',
                  startOption === 'copy'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-[var(--border)] hover:border-[var(--muted-foreground)]',
                  lists.length === 0 && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => lists.length > 0 && setStartOption('copy')}
              >
                <div className="flex items-center justify-between">
                  <Radio
                    checked={startOption === 'copy'}
                    onChange={() => setStartOption('copy')}
                    label={t.newList.copyFromList}
                    disabled={lists.length === 0}
                  />
                  <Copy size={20} className="text-[var(--muted-foreground)]" />
                </div>
                
                {startOption === 'copy' && lists.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <Select
                      value={selectedListId}
                      onChange={setSelectedListId}
                      options={listOptions}
                      placeholder={t.newList.selectList}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={handleClose}>
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleCreate}
              disabled={!name.trim()}
            >
              {t.newList.create}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Favorites picker modal */}
      <FavoritesPicker
        isOpen={showFavoritesPicker}
        onClose={() => setShowFavoritesPicker(false)}
        onSelect={handleFavoritesSelect}
      />
    </>
  );
}

