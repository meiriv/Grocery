'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GroceryList, GroceryItem, UnitType } from '@/types/grocery';
import { getList, saveList, deleteList as removeList, getLists, saveLists } from '@/services/storage';
import { trackItemUsage } from '@/services/storage';
import { categorizeItemSync } from '@/services/categorizer';
import { generateId, sortGroceryItems } from '@/lib/utils';

export function useGroceryList(listId: string | null) {
  const [list, setList] = useState<GroceryList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load list
  useEffect(() => {
    if (!listId) {
      setList(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const loaded = getList(listId);
    
    if (loaded) {
      setList(loaded);
      setError(null);
    } else {
      setError('List not found');
    }
    
    setIsLoading(false);
  }, [listId]);

  // Save list whenever it changes
  const persistList = useCallback((updatedList: GroceryList) => {
    saveList(updatedList);
    setList(updatedList);
  }, []);

  // Check if item already exists in list (case-insensitive)
  const findExistingItem = useCallback((name: string): GroceryItem | undefined => {
    if (!list) return undefined;
    const normalizedName = name.trim().toLowerCase();
    return list.items.find(item => item.name.toLowerCase() === normalizedName);
  }, [list]);

  // Add item to list
  const addItem = useCallback((
    name: string,
    options?: {
      categoryId?: string;
      quantity?: number;
      unit?: UnitType;
      price?: number;
    }
  ): { item: GroceryItem | null; isDuplicate: boolean; existingItem?: GroceryItem } => {
    if (!list) return { item: null, isDuplicate: false };
    
    // Check for duplicate
    const existingItem = findExistingItem(name);
    if (existingItem) {
      return { item: null, isDuplicate: true, existingItem };
    }
    
    // Auto-categorize if no category provided
    const categorization = options?.categoryId 
      ? { categoryId: options.categoryId, unit: options.unit || 'unit', quantity: options.quantity || 1 }
      : categorizeItemSync(name);
    
    const newItem: GroceryItem = {
      id: generateId(),
      name: name.trim(),
      categoryId: options?.categoryId || categorization.categoryId,
      quantity: options?.quantity ?? categorization.quantity,
      unit: options?.unit || categorization.unit,
      status: 'pending',
      price: options?.price,
      addedAt: new Date(),
    };
    
    // Track usage for frequent items
    trackItemUsage(newItem.name, newItem.categoryId, newItem.quantity, newItem.unit);
    
    const updatedList: GroceryList = {
      ...list,
      items: [...list.items, newItem],
      updatedAt: new Date(),
    };
    
    persistList(updatedList);
    return { item: newItem, isDuplicate: false };
  }, [list, persistList, findExistingItem]);

  // Add multiple items
  const addItems = useCallback((
    items: Array<{
      name: string;
      categoryId?: string;
      quantity?: number;
      unit?: UnitType;
      price?: number;
    }>
  ): { added: GroceryItem[]; duplicates: string[] } => {
    if (!list) return { added: [], duplicates: [] };
    
    const duplicates: string[] = [];
    const newItems: GroceryItem[] = [];
    const addedNames = new Set<string>(); // Track names added in this batch
    
    for (const item of items) {
      const normalizedName = item.name.trim().toLowerCase();
      
      // Check if already exists in list or was already added in this batch
      const existsInList = list.items.some(i => i.name.toLowerCase() === normalizedName);
      const existsInBatch = addedNames.has(normalizedName);
      
      if (existsInList || existsInBatch) {
        duplicates.push(item.name.trim());
        continue;
      }
      
      const categorization = item.categoryId 
        ? { categoryId: item.categoryId, unit: item.unit || 'unit', quantity: item.quantity || 1 }
        : categorizeItemSync(item.name);
      
      const newItem: GroceryItem = {
        id: generateId(),
        name: item.name.trim(),
        categoryId: item.categoryId || categorization.categoryId,
        quantity: item.quantity ?? categorization.quantity,
        unit: item.unit || categorization.unit,
        status: 'pending',
        price: item.price,
        addedAt: new Date(),
      };
      
      trackItemUsage(newItem.name, newItem.categoryId, newItem.quantity, newItem.unit);
      newItems.push(newItem);
      addedNames.add(normalizedName);
    }
    
    if (newItems.length > 0) {
      const updatedList: GroceryList = {
        ...list,
        items: [...list.items, ...newItems],
        updatedAt: new Date(),
      };
      
      persistList(updatedList);
    }
    
    return { added: newItems, duplicates };
  }, [list, persistList]);

  // Update item
  const updateItem = useCallback((itemId: string, updates: Partial<GroceryItem>) => {
    if (!list) return;
    
    const updatedItems = list.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    
    const updatedList: GroceryList = {
      ...list,
      items: updatedItems,
      updatedAt: new Date(),
    };
    
    persistList(updatedList);
  }, [list, persistList]);

  // Remove item
  const removeItem = useCallback((itemId: string) => {
    if (!list) return;
    
    const updatedList: GroceryList = {
      ...list,
      items: list.items.filter(item => item.id !== itemId),
      updatedAt: new Date(),
    };
    
    persistList(updatedList);
  }, [list, persistList]);

  // Toggle item checked status
  const toggleItemChecked = useCallback((itemId: string) => {
    if (!list) return;
    
    const updatedItems = list.items.map(item => {
      if (item.id !== itemId) return item;
      
      const newStatus: 'pending' | 'checked' = item.status === 'checked' ? 'pending' : 'checked';
      return {
        ...item,
        status: newStatus,
        checkedAt: newStatus === 'checked' ? new Date() : undefined,
      };
    });
    
    const updatedList: GroceryList = {
      ...list,
      items: updatedItems,
      updatedAt: new Date(),
    };
    
    persistList(updatedList);
  }, [list, persistList]);

  // Mark item as out of stock
  const markOutOfStock = useCallback((itemId: string) => {
    if (!list) return;
    
    const updatedItems = list.items.map(item =>
      item.id === itemId
        ? { ...item, status: 'out_of_stock' as const }
        : item
    );
    
    const updatedList: GroceryList = {
      ...list,
      items: updatedItems,
      updatedAt: new Date(),
    };
    
    persistList(updatedList);
  }, [list, persistList]);

  // Clear all checked items
  const clearChecked = useCallback(() => {
    if (!list) return;
    
    const updatedList: GroceryList = {
      ...list,
      items: list.items.filter(item => item.status !== 'checked'),
      updatedAt: new Date(),
    };
    
    persistList(updatedList);
  }, [list, persistList]);

  // Uncheck all items
  const uncheckAll = useCallback(() => {
    if (!list) return;
    
    const updatedItems = list.items.map(item => ({
      ...item,
      status: 'pending' as const,
      checkedAt: undefined,
    }));
    
    const updatedList: GroceryList = {
      ...list,
      items: updatedItems,
      updatedAt: new Date(),
    };
    
    persistList(updatedList);
  }, [list, persistList]);

  // Update list name
  const updateListName = useCallback((name: string) => {
    if (!list) return;
    
    const updatedList: GroceryList = {
      ...list,
      name,
      updatedAt: new Date(),
    };
    
    persistList(updatedList);
  }, [list, persistList]);

  // Delete entire list
  const deleteList = useCallback(() => {
    if (!listId) return;
    removeList(listId);
    setList(null);
  }, [listId]);

  // Get sorted items
  const sortedItems = list ? sortGroceryItems(list.items) : [];

  // Get items by status
  const pendingItems = sortedItems.filter(item => item.status === 'pending');
  const checkedItems = sortedItems.filter(item => item.status === 'checked');
  const outOfStockItems = sortedItems.filter(item => item.status === 'out_of_stock');

  // Calculate totals
  const totalItems = list?.items.length || 0;
  const checkedCount = checkedItems.length;
  const pendingCount = pendingItems.length;
  const totalPrice = list?.items.reduce((sum, item) => sum + (item.price || 0), 0) || 0;

  return {
    list,
    isLoading,
    error,
    items: sortedItems,
    pendingItems,
    checkedItems,
    outOfStockItems,
    totalItems,
    checkedCount,
    pendingCount,
    totalPrice,
    addItem,
    addItems,
    updateItem,
    removeItem,
    toggleItemChecked,
    markOutOfStock,
    clearChecked,
    uncheckAll,
    updateListName,
    deleteList,
  };
}

// Hook for managing all lists
export function useGroceryLists() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all lists
  useEffect(() => {
    const loaded = getLists();
    setLists(loaded);
    setIsLoading(false);
  }, []);

  // Create new list
  const createList = useCallback((
    name: string,
    initialItems?: Array<{
      name: string;
      categoryId: string;
      quantity: number;
      unit: UnitType;
    }>
  ): GroceryList => {
    const newList: GroceryList = {
      id: generateId(),
      name,
      items: initialItems?.map(item => ({
        id: generateId(),
        ...item,
        status: 'pending' as const,
        addedAt: new Date(),
      })) || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedLists = [...lists, newList];
    saveLists(updatedLists);
    setLists(updatedLists);
    
    return newList;
  }, [lists]);

  // Delete list
  const deleteList = useCallback((listId: string) => {
    removeList(listId);
    setLists(prev => prev.filter(l => l.id !== listId));
  }, []);

  // Duplicate list
  const duplicateList = useCallback((listId: string, newName?: string): GroceryList | null => {
    const original = lists.find(l => l.id === listId);
    if (!original) return null;
    
    const duplicate: GroceryList = {
      id: generateId(),
      name: newName || `${original.name} (copy)`,
      items: original.items.map(item => ({
        ...item,
        id: generateId(),
        status: 'pending',
        checkedAt: undefined,
        addedAt: new Date(),
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedLists = [...lists, duplicate];
    saveLists(updatedLists);
    setLists(updatedLists);
    
    return duplicate;
  }, [lists]);

  // Refresh lists from storage
  const refreshLists = useCallback(() => {
    const loaded = getLists();
    setLists(loaded);
  }, []);

  return {
    lists,
    isLoading,
    createList,
    deleteList,
    duplicateList,
    refreshLists,
  };
}

