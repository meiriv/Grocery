// Unit types for quantity measurement
export type UnitType = 'unit' | 'kg' | 'g' | 'l' | 'ml' | 'package' | 'dozen' | 'bunch';

// Bilingual text type
export interface BilingualText {
  en: string;
  he: string;
}

// Unit definition
export interface Unit {
  id: UnitType;
  name: BilingualText;
  shortName: BilingualText;
  step: number;
  minValue: number;
}

// Category definition
export interface Category {
  id: string;
  name: BilingualText;
  color: string;
  icon?: string;
  isDefault: boolean;
  keywords: {
    en: string[];
    he: string[];
  };
  defaultUnit: UnitType;
  defaultQuantity: number;
}

// Grocery item in a list
export interface GroceryItem {
  id: string;
  name: string;
  categoryId: string;
  quantity: number;
  unit: UnitType;
  status: 'pending' | 'checked' | 'out_of_stock';
  price?: number;
  addedAt: Date;
  checkedAt?: Date;
}

// Favorite item template
export interface FavoriteItem {
  id: string;
  name: string;
  categoryId: string;
  quantity: number;
  unit: UnitType;
  addedAt: Date;
}

// Grocery list
export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  shareCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

// App settings
export interface AppSettings {
  aiEnabled: boolean;
  hasApiKey: boolean;
  language: 'en' | 'he';
  theme: 'dark' | 'light' | 'system';
}

// Frequently bought item tracking
export interface FrequentItem {
  name: string;
  categoryId: string;
  quantity: number;
  unit: UnitType;
  useCount: number;
  lastUsed: Date;
}

// Item unit default mapping
export interface ItemUnitDefault {
  unit: UnitType;
  default: number;
}

// Serialized versions for localStorage (dates as strings)
export interface SerializedGroceryItem extends Omit<GroceryItem, 'addedAt' | 'checkedAt'> {
  addedAt: string;
  checkedAt?: string;
}

export interface SerializedGroceryList extends Omit<GroceryList, 'items' | 'createdAt' | 'updatedAt'> {
  items: SerializedGroceryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SerializedFavoriteItem extends Omit<FavoriteItem, 'addedAt'> {
  addedAt: string;
}

export interface SerializedFrequentItem extends Omit<FrequentItem, 'lastUsed'> {
  lastUsed: string;
}

// Coerce a value that may already be a Date, an ISO string (e.g. data that
// round-tripped through JSON in a backup file) or missing, into a valid Date.
function toDate(value: Date | string | number | undefined | null): Date {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function toISOString(value: Date | string | number | undefined | null): string {
  return toDate(value).toISOString();
}

function toOptionalDate(value: Date | string | number | undefined | null): Date | undefined {
  if (value === undefined || value === null) return undefined;
  return toDate(value);
}

function toOptionalISOString(value: Date | string | number | undefined | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  return toDate(value).toISOString();
}

// Helper functions for serialization
export function serializeGroceryItem(item: GroceryItem): SerializedGroceryItem {
  return {
    ...item,
    addedAt: toISOString(item.addedAt),
    checkedAt: toOptionalISOString(item.checkedAt),
  };
}

export function deserializeGroceryItem(item: SerializedGroceryItem): GroceryItem {
  return {
    ...item,
    addedAt: toDate(item.addedAt),
    checkedAt: toOptionalDate(item.checkedAt),
  };
}

export function serializeGroceryList(list: GroceryList): SerializedGroceryList {
  return {
    ...list,
    items: list.items.map(serializeGroceryItem),
    createdAt: toISOString(list.createdAt),
    updatedAt: toISOString(list.updatedAt),
  };
}

export function deserializeGroceryList(list: SerializedGroceryList): GroceryList {
  return {
    ...list,
    items: (list.items || []).map(deserializeGroceryItem),
    createdAt: toDate(list.createdAt),
    updatedAt: toDate(list.updatedAt),
  };
}

export function serializeFavoriteItem(item: FavoriteItem): SerializedFavoriteItem {
  return {
    ...item,
    addedAt: toISOString(item.addedAt),
  };
}

export function deserializeFavoriteItem(item: SerializedFavoriteItem): FavoriteItem {
  return {
    ...item,
    addedAt: toDate(item.addedAt),
  };
}

export function serializeFrequentItem(item: FrequentItem): SerializedFrequentItem {
  return {
    ...item,
    lastUsed: toISOString(item.lastUsed),
  };
}

export function deserializeFrequentItem(item: SerializedFrequentItem): FrequentItem {
  return {
    ...item,
    lastUsed: toDate(item.lastUsed),
  };
}

