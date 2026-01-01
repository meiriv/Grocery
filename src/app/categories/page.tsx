'use client';

import React, { useState } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
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
import { units } from '@/lib/units';
import type { Category, UnitType } from '@/types/grocery';

export default function CategoriesPage() {
  const { t, language } = useTranslation();
  const {
    categories,
    defaultCategories,
    customCategories,
    addCategory,
    updateCategory,
    removeCategory,
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
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {t.categories.title}
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 pb-safe">
        <div className="py-4 space-y-6">
          {/* Default categories */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              Default
            </h2>
            <div className="space-y-2">
              {defaultCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 p-3 bg-[var(--card)] rounded-xl border border-[var(--border)]"
                >
                  <span
                    className={cn('w-4 h-4 rounded-full flex-shrink-0', category.color)}
                  />
                  <span className="flex-1 font-medium text-[var(--foreground)]">
                    {category.name[language]}
                  </span>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {units[category.defaultUnit].shortName[language]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom categories */}
          {customCategories.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                Custom
              </h2>
              <div className="space-y-2">
                {customCategories.map((category) => (
                  <div
                    key={category.id}
                    className="group flex items-center gap-3 p-3 bg-[var(--card)] rounded-xl border border-[var(--border)]"
                  >
                    <span
                      className={cn('w-4 h-4 rounded-full flex-shrink-0', category.color)}
                    />
                    <span className="flex-1 font-medium text-[var(--foreground)]">
                      {category.name[language]}
                    </span>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {units[category.defaultUnit].shortName[language]}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconButton
                        onClick={() => handleEdit(category)}
                        className="text-[var(--muted-foreground)]"
                      >
                        <Edit3 size={18} />
                      </IconButton>
                      <IconButton
                        onClick={() => setCategoryToDelete(category.id)}
                        className="text-[var(--muted-foreground)] hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

