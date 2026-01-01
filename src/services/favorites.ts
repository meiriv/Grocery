import type { FavoriteItem, GroceryItem, UnitType } from '@/types/grocery';
import { generateId } from '@/lib/utils';
import {
  getFavorites,
  saveFavorites,
  addFavorite as addFav,
  removeFavorite as removeFav,
  updateFavorite as updateFav,
  isFavorite as checkFavorite,
  getFavoriteByName,
} from './storage';

// Get all favorites
export function getAllFavorites(): FavoriteItem[] {
  return getFavorites();
}

// Get favorites grouped by category
export function getFavoritesByCategory(): Record<string, FavoriteItem[]> {
  const favorites = getFavorites();
  return favorites.reduce((groups, item) => {
    const categoryId = item.categoryId;
    if (!groups[categoryId]) {
      groups[categoryId] = [];
    }
    groups[categoryId].push(item);
    return groups;
  }, {} as Record<string, FavoriteItem[]>);
}

// Add item to favorites
export function addToFavorites(item: {
  name: string;
  categoryId: string;
  quantity: number;
  unit: UnitType;
}): FavoriteItem {
  const favorite: FavoriteItem = {
    id: generateId(),
    name: item.name,
    categoryId: item.categoryId,
    quantity: item.quantity,
    unit: item.unit,
    addedAt: new Date(),
  };
  
  addFav(favorite);
  return favorite;
}

// Add grocery item to favorites
export function addGroceryItemToFavorites(item: GroceryItem): FavoriteItem | null {
  // Check if already a favorite
  if (checkFavorite(item.name)) {
    return null;
  }
  
  return addToFavorites({
    name: item.name,
    categoryId: item.categoryId,
    quantity: item.quantity,
    unit: item.unit,
  });
}

// Remove from favorites by ID
export function removeFromFavorites(id: string): void {
  removeFav(id);
}

// Remove from favorites by name
export function removeFromFavoritesByName(name: string): void {
  const favorite = getFavoriteByName(name);
  if (favorite) {
    removeFav(favorite.id);
  }
}

// Update favorite item
export function updateFavoriteItem(item: FavoriteItem): void {
  updateFav(item);
}

// Check if item is a favorite
export function isItemFavorite(name: string): boolean {
  return checkFavorite(name);
}

// Toggle favorite status for a grocery item
export function toggleFavorite(item: GroceryItem): boolean {
  if (checkFavorite(item.name)) {
    removeFromFavoritesByName(item.name);
    return false;
  } else {
    addGroceryItemToFavorites(item);
    return true;
  }
}

// Convert favorites to grocery items for adding to list
export function favoritesToGroceryItems(
  favoriteIds: string[]
): Omit<GroceryItem, 'id' | 'addedAt'>[] {
  const favorites = getFavorites();
  
  return favoriteIds
    .map(id => favorites.find(f => f.id === id))
    .filter((f): f is FavoriteItem => f !== undefined)
    .map(f => ({
      name: f.name,
      categoryId: f.categoryId,
      quantity: f.quantity,
      unit: f.unit,
      status: 'pending' as const,
    }));
}

// Convert all favorites to grocery items
export function allFavoritesToGroceryItems(): Omit<GroceryItem, 'id' | 'addedAt'>[] {
  const favorites = getFavorites();
  
  return favorites.map(f => ({
    name: f.name,
    categoryId: f.categoryId,
    quantity: f.quantity,
    unit: f.unit,
    status: 'pending' as const,
  }));
}

// Get favorite count
export function getFavoriteCount(): number {
  return getFavorites().length;
}

// Search favorites
export function searchFavorites(query: string): FavoriteItem[] {
  if (!query.trim()) {
    return getFavorites();
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  const favorites = getFavorites();
  
  return favorites.filter(f =>
    f.name.toLowerCase().includes(normalizedQuery)
  );
}

// Bulk add to favorites
export function bulkAddToFavorites(
  items: Array<{
    name: string;
    categoryId: string;
    quantity: number;
    unit: UnitType;
  }>
): FavoriteItem[] {
  const added: FavoriteItem[] = [];
  
  for (const item of items) {
    if (!checkFavorite(item.name)) {
      const favorite = addToFavorites(item);
      added.push(favorite);
    }
  }
  
  return added;
}

// Bulk remove from favorites
export function bulkRemoveFromFavorites(ids: string[]): void {
  const favorites = getFavorites();
  const filtered = favorites.filter(f => !ids.includes(f.id));
  saveFavorites(filtered);
}

