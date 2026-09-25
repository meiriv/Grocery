'use client';

import React, { useEffect, useState } from 'react';
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
  const { t, language, interpolate } = useTranslation();
  const { favorites, count: favoritesCount } = useFavorites();
  const { lists, createList } = useGroceryLists();
  
  const [name, setName] = useState('');
  const [startOption, setStartOption] = useState<StartOption>('empty');
  const [selectedListId, setSelectedListId] = useState('');
  const [showFavoritesPicker, setShowFavoritesPicker] = useState(false);
  const [selectedFavorites, setSelectedFavorites] = useState<FavoriteItem[]>([]);

  // A dated default name means a list can be started with a single tap -
  // naming it is optional, not a gate in front of the Create button
  const defaultName = () =>
    interpolate(t.newList.defaultName, {
      date: new Date().toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
        month: 'short',
        day: 'numeric',
      }),
    });

  useEffect(() => {
    if (isOpen) setName(defaultName());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleCreate = (event?: React.FormEvent) => {
    event?.preventDefault();
    const listName = name.trim() || defaultName();

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

    const newList = createList(listName, initialItems);
    onCreateList(newList);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setStartOption('empty');
    setSelectedListId('');
    setSelectedFavorites([]);
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
        {/* A form, so the keyboard's Go key creates the list */}
        <form className="space-y-6" onSubmit={handleCreate}>
          {/* List name - prefilled, and selected on focus so typing replaces it.
              Not auto-focused: popping the keyboard would hide the Create
              button for someone happy with the default name. */}
          <Input
            label={t.newList.listName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            placeholder={t.newList.listNamePlaceholder}
            enterKeyHint="go"
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
                          type="button"
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
                        type="button"
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
            <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
              {t.common.cancel}
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {t.newList.create}
            </Button>
          </div>
        </form>
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

