'use client';

import React, { useState } from 'react';
import { Plus, Edit3, Trash2, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useCategories } from '@/hooks/useCategories';
import { BottomNav } from '@/components/BottomNav';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ColorPicker, Select } from '@/components/ui/Select';
import { QuantityEditor } from '@/components/QuantityEditor';
import { availableCategoryColors } from '@/lib/categories';
import { units, getUnit } from '@/lib/units';
import type { Category, UnitType } from '@/types/grocery';

export default function CategoriesPage() {
  const { t, language } = useTranslation();
  const {
    categories,
    addCategory,
    updateCategory,
    removeCategory,
    isCustomCategory,
    moveCategory,
    resetCategoryOrder,
    hasCustomOrder,
  } = useCategories();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Form state
  const [nameEn, setNameEn] = useState('');
  const [nameHe, setNameHe] = useState('');
  const [color, setColor] = useState('bg-emerald-500');
  const [defaultUnit, setDefaultUnit] = useState<UnitType>('unit');
  const [defaultQuantity, setDefaultQuantity] = useState(1);
  const [keywordsEn, setKeywordsEn] = useState('');
  const [keywordsHe, setKeywordsHe] = useState('');

  const resetForm = () => {
    setNameEn('');
    setNameHe('');
    setColor('bg-emerald-500');
    setDefaultUnit('unit');
    setDefaultQuantity(1);
    setKeywordsEn('');
    setKeywordsHe('');
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setNameEn(category.name.en);
    setNameHe(category.name.he);
    setColor(category.color);
    setDefaultUnit(category.defaultUnit);
    setDefaultQuantity(category.defaultQuantity);
    setKeywordsEn(category.keywords.en.join(', '));
    setKeywordsHe(category.keywords.he.join(', '));
  };

  const handleSave = () => {
    if (!nameEn.trim() || !nameHe.trim()) return;

    const categoryData = {
      name: { en: nameEn.trim(), he: nameHe.trim() },
      color,
      defaultUnit,
      defaultQuantity,
      keywords: {
        en: keywordsEn.split(',').map((k) => k.trim()).filter(Boolean),
        he: keywordsHe.split(',').map((k) => k.trim()).filter(Boolean),
      },
    };

    if (editingCategory) {
      updateCategory({
        ...editingCategory,
        ...categoryData,
      });
      setEditingCategory(null);
    } else {
      addCategory(categoryData);
      setShowAddModal(false);
    }

    resetForm();
  };

  const handleDelete = () => {
    if (categoryToDelete) {
      removeCategory(categoryToDelete);
      setCategoryToDelete(null);
    }
  };

  const unitOptions = Object.entries(units).map(([id, unit]) => ({
    value: id,
    label: unit.name[language],
  }));

  const colorOptions = availableCategoryColors.map((c) => ({
    id: c.id,
    class: c.class,
    name: c.name[language],
  }));

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        {/* Safe area spacer for iPhone notch/dynamic island */}
        <div className="h-[calc(env(safe-area-inset-top,0px)+12px)]" />
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {t.categories.title}
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 pb-safe">
        <div className="py-4 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              {t.categories.shoppingOrder}
            </h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {t.categories.shoppingOrderHint}
            </p>
          </div>

          <div className="space-y-2">
            {categories.map((category, index) => {
              const isCustom = isCustomCategory(category.id);

              return (
                <div
                  key={category.id}
                  className="flex items-center gap-2 p-3 bg-[var(--card)] rounded-xl border border-[var(--border)]"
                >
                  {/* Reorder controls */}
                  <div className="flex flex-col flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveCategory(category.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-25 transition-colors"
                      aria-label={`${t.categories.moveUp}: ${category.name[language]}`}
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategory(category.id, 'down')}
                      disabled={index === categories.length - 1}
                      className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-25 transition-colors"
                      aria-label={`${t.categories.moveDown}: ${category.name[language]}`}
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>

                  <span
                    className={cn('w-4 h-4 rounded-full flex-shrink-0', category.color)}
                  />
                  <span className="flex-1 min-w-0 font-medium text-[var(--foreground)] truncate">
                    {category.name[language]}
                  </span>

                  {isCustom && (
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)]">
                      {t.categories.customSection}
                    </span>
                  )}

                  <span className="text-sm text-[var(--muted-foreground)]">
                    {getUnit(category.defaultUnit).shortName[language]}
                  </span>

                  {isCustom && (
                    <div className="flex items-center gap-1">
                      <IconButton
                        onClick={() => handleEdit(category)}
                        className="text-[var(--muted-foreground)]"
                        aria-label={t.categories.editCategory}
                      >
                        <Edit3 size={18} />
                      </IconButton>
                      <IconButton
                        onClick={() => setCategoryToDelete(category.id)}
                        className="text-[var(--muted-foreground)] hover:text-red-500"
                        aria-label={t.categories.deleteCategory}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {hasCustomOrder && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-[var(--muted-foreground)]"
              leftIcon={<RotateCcw size={16} />}
              onClick={resetCategoryOrder}
            >
              {t.categories.resetOrder}
            </Button>
          )}
        </div>
      </main>

      {/* FAB */}
      <FloatingAddButton
        onClick={() => setShowAddModal(true)}
        label={t.categories.addNew}
      />

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || !!editingCategory}
        onClose={() => {
          setShowAddModal(false);
          setEditingCategory(null);
          resetForm();
        }}
        title={editingCategory ? t.categories.editCategory : t.categories.addNew}
      >
        <div className="space-y-4">
          <Input
            label={t.categories.categoryNameEn}
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="e.g., Spices"
          />

          <Input
            label={t.categories.categoryNameHe}
            value={nameHe}
            onChange={(e) => setNameHe(e.target.value)}
            placeholder="לדוגמה: תבלינים"
            dir="rtl"
          />

          <ColorPicker
            label={t.categories.categoryColor}
            value={color}
            onChange={setColor}
            colors={colorOptions}
          />

          <Select
            label={t.categories.defaultUnit}
            value={defaultUnit}
            onChange={(v) => setDefaultUnit(v as UnitType)}
            options={unitOptions}
          />

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              {t.categories.defaultQuantity}
            </label>
            <QuantityEditor
              quantity={defaultQuantity}
              unit={defaultUnit}
              onQuantityChange={setDefaultQuantity}
              onUnitChange={setDefaultUnit}
            />
          </div>

          <Input
            label={`${t.categories.keywords} (English)`}
            value={keywordsEn}
            onChange={(e) => setKeywordsEn(e.target.value)}
            placeholder="spice, seasoning, herb"
            hint={t.categories.keywordsHint}
          />

          <Input
            label={`${t.categories.keywords} (עברית)`}
            value={keywordsHe}
            onChange={(e) => setKeywordsHe(e.target.value)}
            placeholder="תבלין, עשב תיבול"
            dir="rtl"
          />

          <div className="flex gap-3 mt-6">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowAddModal(false);
                setEditingCategory(null);
                resetForm();
              }}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSave}
              disabled={!nameEn.trim() || !nameHe.trim()}
            >
              {t.common.save}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
        title={t.categories.deleteCategory}
        message={t.categories.deleteCategoryConfirm}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        variant="danger"
      />
    </div>
  );
}

