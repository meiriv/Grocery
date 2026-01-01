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
} from '@/services/storage';
import { generateId } from '@/lib/utils';
import { useTranslation } from './useTranslation';

export function useCategories() {
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useTranslation();

  // Load custom categories
  useEffect(() => {
    const loaded = getCustomCategories();
    setCustomCategories(loaded);
    setIsLoading(false);
  }, []);

  // All categories (default + custom)
  const allCategories = useMemo(() => {
    return [...defaultCategories, ...customCategories];
  }, [customCategories]);

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

