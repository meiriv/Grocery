'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ShoppingCart, Trash2, MoreVertical, Clock } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useGroceryLists } from '@/hooks/useGroceryList';
import { BottomNav } from '@/components/BottomNav';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { NewListModal } from '@/components/NewListModal';
import { ConfirmDialog } from '@/components/ui/Modal';
import type { GroceryList } from '@/types/grocery';

export default function HomePage() {
  const router = useRouter();
  const { t, language, interpolate } = useTranslation();
  const { lists, deleteList, isLoading } = useGroceryLists();
  
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleListCreated = (list: GroceryList) => {
    router.push(`/list/${list.id}`);
  };

  const handleDeleteList = () => {
    if (listToDelete) {
      deleteList(listToDelete);
      setListToDelete(null);
    }
  };

  const getListStats = (list: GroceryList) => {
    const total = list.items.length;
    const checked = list.items.filter((i) => i.status === 'checked').length;
    return { total, checked, pending: total - checked };
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {t.home.title}
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 pb-safe">
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
            {lists
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((list) => {
                const stats = getListStats(list);
                const progress = stats.total > 0 ? (stats.checked / stats.total) * 100 : 0;

                return (
                  <div
                    key={list.id}
                    className={cn(
                      'relative bg-[var(--card)] rounded-2xl border border-[var(--border)]',
                      'transition-all duration-200',
                      'hover:border-[var(--muted-foreground)]'
                    )}
                  >
                    <button
                      onClick={() => router.push(`/list/${list.id}`)}
                      className="w-full p-4 text-start"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-[var(--foreground)] truncate">
                            {list.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-[var(--muted-foreground)]">
                            <span>
                              {interpolate(t.home.listItems, { count: stats.total })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {formatRelativeTime(new Date(list.updatedAt), language)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Progress indicator */}
                        {stats.total > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 relative">
                              <svg className="w-10 h-10 -rotate-90">
                                <circle
                                  cx="20"
                                  cy="20"
                                  r="16"
                                  fill="none"
                                  stroke="var(--secondary)"
                                  strokeWidth="4"
                                />
                                <circle
                                  cx="20"
                                  cy="20"
                                  r="16"
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="4"
                                  strokeDasharray={`${progress} 100`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                                {stats.checked}/{stats.total}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Menu button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === list.id ? null : list.id);
                      }}
                      className="absolute top-4 end-4 p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    >
                      <MoreVertical size={18} className="lucide-more-vertical" />
                    </button>

                    {/* Dropdown menu */}
                    {activeMenu === list.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setActiveMenu(null)}
                        />
                        <div className="absolute top-12 end-4 z-50 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg py-1 min-w-[140px] animate-scale-in">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenu(null);
                              setListToDelete(list.id);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-red-500 hover:bg-[var(--accent)] transition-colors"
                          >
                            <Trash2 size={16} className="lucide-trash-2" />
                            {t.home.deleteList}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </main>

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

