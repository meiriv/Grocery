import { isBrowser } from '@/lib/utils';
import type {
  GroceryList,
  SerializedGroceryList,
  FavoriteItem,
  SerializedFavoriteItem,
  FrequentItem,
  SerializedFrequentItem,
  Category,
  AppSettings,
  deserializeGroceryList,
  serializeGroceryList,
  deserializeFavoriteItem,
  serializeFavoriteItem,
  deserializeFrequentItem,
  serializeFrequentItem,
} from '@/types/grocery';
import {
  deserializeGroceryList as deserializeList,
  serializeGroceryList as serializeList,
  deserializeFavoriteItem as deserializeFav,
  serializeFavoriteItem as serializeFav,
  deserializeFrequentItem as deserializeFreq,
  serializeFrequentItem as serializeFreq,
} from '@/types/grocery';

// Storage keys
const STORAGE_KEYS = {
  LISTS: 'grocery-lists',
  FAVORITES: 'grocery-favorites',
  FREQUENT: 'grocery-frequent',
  CATEGORIES: 'grocery-categories',
  SETTINGS: 'grocery-settings',
  API_KEY_ENCRYPTED: 'grocery-api-key-encrypted',
} as const;

// Default settings
export const defaultSettings: AppSettings = {
  aiEnabled: false,
  hasApiKey: false,
  language: 'en',
  theme: 'dark',
};

// Generic storage helpers
function getItem<T>(key: string, defaultValue: T): T {
  if (!isBrowser()) return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    console.error(`Error reading ${key} from localStorage`);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage`, error);
  }
}

function removeItem(key: string): void {
  if (!isBrowser()) return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage`, error);
  }
}

// Lists storage
export function getLists(): GroceryList[] {
  const serialized = getItem<SerializedGroceryList[]>(STORAGE_KEYS.LISTS, []);
  return serialized.map(deserializeList);
}

export function saveLists(lists: GroceryList[]): void {
  const serialized = lists.map(serializeList);
  setItem(STORAGE_KEYS.LISTS, serialized);
}

export function getList(id: string): GroceryList | null {
  const lists = getLists();
  return lists.find(list => list.id === id) || null;
}

export function saveList(list: GroceryList): void {
  const lists = getLists();
  const index = lists.findIndex(l => l.id === list.id);
  
  if (index >= 0) {
    lists[index] = list;
  } else {
    lists.push(list);
  }
  
  saveLists(lists);
}

export function deleteList(id: string): void {
  const lists = getLists();
  const filtered = lists.filter(list => list.id !== id);
  saveLists(filtered);
}

// Favorites storage
export function getFavorites(): FavoriteItem[] {
  const serialized = getItem<SerializedFavoriteItem[]>(STORAGE_KEYS.FAVORITES, []);
  return serialized.map(deserializeFav);
}

export function saveFavorites(favorites: FavoriteItem[]): void {
  const serialized = favorites.map(serializeFav);
  setItem(STORAGE_KEYS.FAVORITES, serialized);
}

export function addFavorite(item: FavoriteItem): void {
  const favorites = getFavorites();
  // Check if already exists (by name, case-insensitive)
  const exists = favorites.some(
    f => f.name.toLowerCase() === item.name.toLowerCase()
  );
  
  if (!exists) {
    favorites.push(item);
    saveFavorites(favorites);
  }
}

export function removeFavorite(id: string): void {
  const favorites = getFavorites();
  const filtered = favorites.filter(f => f.id !== id);
  saveFavorites(filtered);
}

export function updateFavorite(item: FavoriteItem): void {
  const favorites = getFavorites();
  const index = favorites.findIndex(f => f.id === item.id);
  
  if (index >= 0) {
    favorites[index] = item;
    saveFavorites(favorites);
  }
}

export function isFavorite(name: string): boolean {
  const favorites = getFavorites();
  return favorites.some(f => f.name.toLowerCase() === name.toLowerCase());
}

export function getFavoriteByName(name: string): FavoriteItem | null {
  const favorites = getFavorites();
  return favorites.find(f => f.name.toLowerCase() === name.toLowerCase()) || null;
}

// Frequent items storage
export function getFrequentItems(): FrequentItem[] {
  const serialized = getItem<SerializedFrequentItem[]>(STORAGE_KEYS.FREQUENT, []);
  return serialized.map(deserializeFreq);
}

export function saveFrequentItems(items: FrequentItem[]): void {
  const serialized = items.map(serializeFreq);
  setItem(STORAGE_KEYS.FREQUENT, serialized);
}

export function trackItemUsage(
  name: string,
  categoryId: string,
  quantity: number,
  unit: string
): void {
  const items = getFrequentItems();
  const normalizedName = name.toLowerCase().trim();
  const index = items.findIndex(
    i => i.name.toLowerCase() === normalizedName
  );
  
  if (index >= 0) {
    items[index].useCount++;
    items[index].lastUsed = new Date();
    items[index].quantity = quantity;
    items[index].unit = unit as FrequentItem['unit'];
  } else {
    items.push({
      name: normalizedName,
      categoryId,
      quantity,
      unit: unit as FrequentItem['unit'],
      useCount: 1,
      lastUsed: new Date(),
    });
  }
  
  // Keep only top 50 most used items
  items.sort((a, b) => b.useCount - a.useCount);
  saveFrequentItems(items.slice(0, 50));
}

export function getTopFrequentItems(limit: number = 10): FrequentItem[] {
  const items = getFrequentItems();
  return items
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, limit);
}

// Custom categories storage
export function getCustomCategories(): Category[] {
  return getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
}

export function saveCustomCategories(categories: Category[]): void {
  setItem(STORAGE_KEYS.CATEGORIES, categories);
}

export function addCustomCategory(category: Category): void {
  const categories = getCustomCategories();
  categories.push(category);
  saveCustomCategories(categories);
}

export function updateCustomCategory(category: Category): void {
  const categories = getCustomCategories();
  const index = categories.findIndex(c => c.id === category.id);
  
  if (index >= 0) {
    categories[index] = category;
    saveCustomCategories(categories);
  }
}

export function deleteCustomCategory(id: string): void {
  const categories = getCustomCategories();
  const filtered = categories.filter(c => c.id !== id);
  saveCustomCategories(filtered);
}

// Settings storage
export function getSettings(): AppSettings {
  return getItem<AppSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
}

export function saveSettings(settings: AppSettings): void {
  setItem(STORAGE_KEYS.SETTINGS, settings);
}

export function updateSettings(updates: Partial<AppSettings>): void {
  const current = getSettings();
  saveSettings({ ...current, ...updates });
}

// Encrypted API key storage
export function getEncryptedApiKey(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(STORAGE_KEYS.API_KEY_ENCRYPTED);
}

export function saveEncryptedApiKey(encrypted: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.API_KEY_ENCRYPTED, encrypted);
  updateSettings({ hasApiKey: true });
}

export function removeEncryptedApiKey(): void {
  removeItem(STORAGE_KEYS.API_KEY_ENCRYPTED);
  updateSettings({ hasApiKey: false, aiEnabled: false });
}

// Clear all data
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeItem(key);
  });
}

// Export data for backup
export function exportData(): string {
  const data = {
    lists: getLists(),
    favorites: getFavorites(),
    frequent: getFrequentItems(),
    categories: getCustomCategories(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
  };
  
  return JSON.stringify(data, null, 2);
}

// Import data from backup
export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    
    if (data.lists) saveLists(data.lists);
    if (data.favorites) saveFavorites(data.favorites);
    if (data.frequent) saveFrequentItems(data.frequent);
    if (data.categories) saveCustomCategories(data.categories);
    if (data.settings) saveSettings(data.settings);
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

