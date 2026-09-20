'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Category, UnitType } from '@/types/grocery';
import { defaultCategories, getCategoryById, getCategoryName } from '@/lib/categories';
import {
  getCustomCategories,
  saveCustomCategories,
  addCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
  getCategoryOrder,
  saveCategoryOrder,
  clearCategoryOrder,
} from '@/services/storage';
import { generateId } from '@/lib/utils';
import { useTranslation } from './useTranslation';

// Sort categories by the user's shopping order. Ids missing from the saved
// order keep their natural position, so adding or removing a category never
// invalidates it.
function applyOrder(categories: Category[], order: string[]): Category[] {
  if (order.length === 0) return categories;
  
  const rank = new Map(order.map((id, index) => [id, index]));
  
  return [...categories].sort((a, b) => {
    const rankA = rank.get(a.id);
    const rankB = rank.get(b.id);
    
    if (rankA === undefined && rankB === undefined) return 0;
    if (rankA === undefined) return 1;
    if (rankB === undefined) return -1;
    return rankA - rankB;
  });
}

export function useCategories() {
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useTranslation();

  // Load custom categories and the saved shopping order
  useEffect(() => {
    setCustomCategories(getCustomCategories());
    setCategoryOrder(getCategoryOrder());
    setIsLoading(false);
  }, []);

  // All categories (default + custom), in shopping order
  const allCategories = useMemo(() => {
    return applyOrder([...defaultCategories, ...customCategories], categoryOrder);
  }, [customCategories, categoryOrder]);

  // Get category by ID
  const getCategory = useCallback((id: string): Category | undefined => {
    return getCategoryById(allCategories, id);
  }, [allCategories]);

  // Get category name in current language
  const getCategoryDisplayName = useCallback((id: string): string => {
    return getCategoryName(allCategories, id, language);
  }, [allCategories, language]);

  // Add new custom category
  const addCategory = useCallback((category: Omit<Category, 'id' | 'isDefault'>): Category => {
    const newCategory: Category = {
      ...category,
      id: generateId(),
      isDefault: false,
    };
    
    addCustomCategory(newCategory);
    setCustomCategories(prev => [...prev, newCategory]);
    
    return newCategory;
  }, []);

  // Update custom category
  const updateCategory = useCallback((category: Category) => {
    if (category.isDefault) {
      console.error('Cannot update default category');
      return;
    }
    
    updateCustomCategory(category);
    setCustomCategories(prev =>
      prev.map(c => (c.id === category.id ? category : c))
    );
  }, []);

  // Delete custom category
  const removeCategory = useCallback((id: string) => {
    const category = getCategoryById(allCategories, id);
    
    if (category?.isDefault) {
      console.error('Cannot delete default category');
      return;
    }
    
    deleteCustomCategory(id);
    setCustomCategories(prev => prev.filter(c => c.id !== id));
  }, [allCategories]);

  // Move a category one step up or down the shopping order
  const moveCategory = useCallback((id: string, direction: 'up' | 'down') => {
    // Work from the previous order rather than the rendered list: tapping the
    // arrow twice in quick succession would otherwise compute both moves from
    // the same pre-render state and only apply one of them. Saving here is
    // derived purely from `previous`, so running it twice is harmless.
    setCategoryOrder(previous => {
      const ids = applyOrder(
        [...defaultCategories, ...customCategories],
        previous
      ).map(c => c.id);
      
      const index = ids.indexOf(id);
      const target = direction === 'up' ? index - 1 : index + 1;
      
      if (index < 0 || target < 0 || target >= ids.length) return previous;
      
      [ids[index], ids[target]] = [ids[target], ids[index]];
      saveCategoryOrder(ids);
      return ids;
    });
  }, [customCategories]);

  // Commit a whole order at once (used by drag and drop)
  const reorderCategories = useCallback((ids: string[]) => {
    saveCategoryOrder(ids);
    setCategoryOrder(ids);
  }, []);

  // Back to the built-in order
  const resetCategoryOrder = useCallback(() => {
    clearCategoryOrder();
    setCategoryOrder([]);
  }, []);

  const hasCustomOrder = categoryOrder.length > 0;

  // Get categories grouped by type
  const categoriesByType = useMemo(() => {
    return {
      default: defaultCategories,
      custom: customCategories,
    };
  }, [customCategories]);

  // Check if category is custom
  const isCustomCategory = useCallback((id: string): boolean => {
    return customCategories.some(c => c.id === id);
  }, [customCategories]);

  return {
    categories: allCategories,
    defaultCategories,
    customCategories,
    categoriesByType,
    isLoading,
    getCategory,
    getCategoryDisplayName,
    addCategory,
    updateCategory,
    removeCategory,
    isCustomCategory,
    moveCategory,
    reorderCategories,
    resetCategoryOrder,
    hasCustomOrder,
  };
}

// Hook for category selection
export function useCategorySelect() {
  const { categories, getCategoryDisplayName } = useCategories();
  const { language } = useTranslation();

  // Get options for select/dropdown
  const options = useMemo(() => {
    return categories.map(cat => ({
      value: cat.id,
      label: cat.name[language],
      color: cat.color,
      icon: cat.icon,
    }));
  }, [categories, language]);

  return {
    options,
    getLabel: getCategoryDisplayName,
  };
}

