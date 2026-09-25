'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ShoppingCart, Undo2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useGroceryLists } from '@/hooks/useGroceryList';
import { BottomNav } from '@/components/BottomNav';
import { ListCard } from '@/components/ListCard';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { NewListModal } from '@/components/NewListModal';
import { ConfirmDialog } from '@/components/ui/Modal';
import type { GroceryList } from '@/types/grocery';

export default function HomePage() {
  const router = useRouter();
  const { t, interpolate } = useTranslation();
  const { lists, deleteList, restoreList, isLoading } = useGroceryLists();
  
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  // Last list removed by a swipe, kept around so it can be restored
  const [recentlyDeleted, setRecentlyDeleted] = useState<GroceryList | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  // The home-screen shortcut ("New List" on a long-press of the app icon)
  // opens /?action=new-list - go straight to the new-list sheet
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new-list') {
      setShowNewListModal(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // An empty new list opens with the add field ready, so the next tap types
  const handleListCreated = (list: GroceryList) => {
    router.push(list.items.length === 0 ? `/list/${list.id}?add=1` : `/list/${list.id}`);
  };

  const handleDeleteList = () => {
    if (listToDelete) {
      deleteList(listToDelete);
      setListToDelete(null);
    }
  };

  // Swipe-to-delete: remove straight away and offer an undo instead of asking
  // for confirmation first
  const handleSwipeDelete = useCallback((list: GroceryList) => {
    deleteList(list.id);
    setActiveMenu(null);
    setRecentlyDeleted(list);
    
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRecentlyDeleted(null), 6000);
  }, [deleteList]);

  const handleUndoDelete = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    if (recentlyDeleted) {
      restoreList(recentlyDeleted);
    }
    setRecentlyDeleted(null);
  }, [recentlyDeleted, restoreList]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        {/* Safe area spacer for iPhone notch/dynamic island */}
        <div className="h-[calc(env(safe-area-inset-top,0px)+12px)]" />
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {t.home.title}
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 pb-fab">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--secondary)] flex items-center justify-center mb-4">
              <ShoppingCart size={40} className="text-[var(--muted-foreground)]" />
            </div>
            <p className="text-[var(--muted-foreground)] mb-6">
              {t.home.emptyState}
            </p>
            <button
              onClick={() => setShowNewListModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
            >
              <Plus size={20} />
              {t.home.newList}
            </button>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {[...lists]
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  onOpen={() => router.push(`/list/${list.id}`)}
                  onDelete={() => handleSwipeDelete(list)}
                  menuOpen={activeMenu === list.id}
                  onToggleMenu={() =>
                    setActiveMenu(activeMenu === list.id ? null : list.id)
                  }
                  onCloseMenu={() => setActiveMenu(null)}
                  onRequestDelete={() => {
                    setActiveMenu(null);
                    setListToDelete(list.id);
                  }}
                />
              ))}
            
            {/* The gesture is invisible otherwise */}
            <p className="pt-1 text-center text-xs text-[var(--muted-foreground)]">
              {t.home.swipeToDeleteHint}
            </p>
          </div>
        )}
      </main>

      {/* Undo toast after a swipe-to-delete */}
      {recentlyDeleted && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] left-4 right-4 z-50 flex justify-center animate-fade-in">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-lg max-w-md w-full">
            <span className="flex-1 min-w-0 text-sm text-[var(--foreground)] truncate">
              {interpolate(t.home.listDeleted, { name: recentlyDeleted.name })}
            </span>
            <button
              onClick={handleUndoDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--secondary)] text-sm font-semibold text-emerald-500 hover:bg-[var(--accent)] transition-colors"
            >
              <Undo2 size={16} />
              {t.common.undo}
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <FloatingAddButton onClick={() => setShowNewListModal(true)} label={t.home.newList} />

      {/* Bottom Navigation */}
      <BottomNav />

      {/* New List Modal */}
      <NewListModal
        isOpen={showNewListModal}
        onClose={() => setShowNewListModal(false)}
        onCreateList={handleListCreated}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!listToDelete}
        onClose={() => setListToDelete(null)}
        onConfirm={handleDeleteList}
        title={t.home.deleteList}
        message={t.home.deleteListConfirm}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        variant="danger"
      />
    </div>
  );
}

