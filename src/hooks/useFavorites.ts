'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FavoriteItem, GroceryItem } from '@/types/grocery';
import {
  getAllFavorites,
  getFavoritesByCategory,
  addToFavorites,
  removeFromFavorites,
  updateFavoriteItem,
  isItemFavorite,
  toggleFavorite as toggleFav,
  favoritesToGroceryItems,
  allFavoritesToGroceryItems,
  getFavoriteCount,
  searchFavorites,
} from '@/services/favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites
  useEffect(() => {
    const loaded = getAllFavorites();
    setFavorites(loaded);
    setIsLoading(false);
  }, []);

  // Refresh favorites from storage
  const refresh = useCallback(() => {
    const loaded = getAllFavorites();
    setFavorites(loaded);
  }, []);

  // Add item to favorites
  const addFavorite = useCallback((item: {
    name: string;
    categoryId: string;
    quantity: number;
    unit: string;
  }) => {
    const favorite = addToFavorites(item as Parameters<typeof addToFavorites>[0]);
    setFavorites(prev => [...prev, favorite]);
    return favorite;
  }, []);

  // Remove from favorites
  const removeFavorite = useCallback((id: string) => {
    removeFromFavorites(id);
    setFavorites(prev => prev.filter(f => f.id !== id));
  }, []);

  // Update favorite
  const updateFavorite = useCallback((item: FavoriteItem) => {
    updateFavoriteItem(item);
    setFavorites(prev => prev.map(f => (f.id === item.id ? item : f)));
  }, []);

  // Check if item is favorite
  const isFavorite = useCallback((name: string): boolean => {
    return isItemFavorite(name);
  }, []);

  // Toggle favorite status for a grocery item
  const toggleFavorite = useCallback((item: GroceryItem): boolean => {
    const result = toggleFav(item);
    refresh();
    return result;
  }, [refresh]);

  // Get favorites grouped by category
  const favoritesByCategory = useMemo(() => {
    return getFavoritesByCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites.length]);

  // Search favorites
  const search = useCallback((query: string): FavoriteItem[] => {
    return searchFavorites(query);
  }, []);

  // Convert selected favorites to grocery items
  const toGroceryItems = useCallback((ids: string[]) => {
    return favoritesToGroceryItems(ids);
  }, []);

  // Convert all favorites to grocery items
  const allToGroceryItems = useCallback(() => {
    return allFavoritesToGroceryItems();
  }, []);

  return {
    favorites,
    favoritesByCategory,
    count: favorites.length,
    isLoading,
    addFavorite,
    removeFavorite,
    updateFavorite,
    isFavorite,
    toggleFavorite,
    search,
    toGroceryItems,
    allToGroceryItems,
    refresh,
  };
}

// Hook for favorite button state
export function useFavoriteButton(itemName: string) {
  const [isFav, setIsFav] = useState(false);
  
  useEffect(() => {
    setIsFav(isItemFavorite(itemName));
  }, [itemName]);
  
  const toggle = useCallback((item: GroceryItem) => {
    const result = toggleFav(item);
    setIsFav(result);
    return result;
  }, []);
  
  return {
    isFavorite: isFav,
    toggle,
  };
}

