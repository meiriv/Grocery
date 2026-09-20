import { generateShareCode, copyToClipboard, isBrowser, generateId } from '@/lib/utils';
import { getList, saveList, getLists } from './storage';
import { isValidUnit } from '@/lib/units';
import type { GroceryList } from '@/types/grocery';

// Compress and encode list data for URL sharing
function encodeListData(list: GroceryList): string {
  // Create a minimal version of the list for sharing
  const shareData = {
    n: list.name, // name
    i: list.items.map(item => ({
      n: item.name,           // name
      c: item.categoryId,     // categoryId
      q: item.quantity,       // quantity
      u: item.unit,           // unit
      s: item.status,         // status
      p: item.price,          // price (optional)
    })),
  };
  
  // Convert to JSON and encode as base64
  const json = JSON.stringify(shareData);
  
  // Use base64url encoding (URL-safe)
  if (isBrowser()) {
    const base64 = btoa(unescape(encodeURIComponent(json)));
    // Make URL-safe: replace + with -, / with _, remove =
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  
  return '';
}

// Decode list data from URL
function decodeListData(encoded: string): { name: string; items: Array<{ name: string; categoryId: string; quantity: number; unit: string; status: string; price?: number }> } | null {
  try {
    // Restore base64 from URL-safe format
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const json = decodeURIComponent(escape(atob(base64)));
    const data = JSON.parse(json);
    
    return {
      name: data.n,
      items: data.i.map((item: { n: string; c: string; q: number; u: string; s: string; p?: number }) => ({
        name: item.n,
        categoryId: item.c,
        quantity: item.q,
        unit: item.u,
        status: item.s,
        price: item.p,
      })),
    };
  } catch (error) {
    console.error('Failed to decode list data:', error);
    return null;
  }
}

// Generate a share code for a list (for display purposes)
export function generateListShareCode(listId: string): string | null {
  const list = getList(listId);
  
  if (!list) {
    return null;
  }
  
  // If list already has a share code, return it
  if (list.shareCode) {
    return list.shareCode;
  }
  
  // Generate new share code
  const shareCode = generateShareCode();
  
  // Save the share code to the list
  saveList({
    ...list,
    shareCode,
    updatedAt: new Date(),
  });
  
  return shareCode;
}

// Get share URL for a list (with encoded data)
export function getShareUrl(listId: string): string | null {
  const list = getList(listId);
  
  if (!list || !isBrowser()) {
    return null;
  }
  
  const encodedData = encodeListData(list);
  
  if (!encodedData) {
    return null;
  }
  
  const baseUrl = window.location.origin;
  // Use /share route with encoded data
  return `${baseUrl}/share?data=${encodedData}`;
}

// Copy share link to clipboard
export async function copyShareLink(listId: string): Promise<boolean> {
  const url = getShareUrl(listId);
  
  if (!url) {
    return false;
  }
  
  return copyToClipboard(url);
}

// Build a list name that does not collide with an existing one
function uniqueListName(name: string, existingNames: string[]): string {
  const taken = new Set(existingNames.map(n => n.trim().toLowerCase()));
  const base = name.trim() || 'Shared list';
  
  if (!taken.has(base.toLowerCase())) return base;
  
  let suffix = 2;
  while (taken.has(`${base} (${suffix})`.toLowerCase())) {
    suffix++;
  }
  
  return `${base} (${suffix})`;
}

const VALID_STATUSES = ['pending', 'checked', 'out_of_stock'] as const;

// Import a shared list from encoded data. A shared list is always added as a new
// list - importing must never overwrite a list the user already has.
export function importSharedList(encodedData: string): GroceryList | null {
  const decoded = decodeListData(encodedData);
  
  if (!decoded || !Array.isArray(decoded.items)) {
    return null;
  }
  
  const existingLists = getLists();
  const now = new Date();
  
  const newList: GroceryList = {
    id: generateId(),
    name: uniqueListName(decoded.name, existingLists.map(l => l.name)),
    items: decoded.items.map((item, index) => ({
      id: generateId(),
      name: String(item.name ?? '').trim(),
      categoryId: item.categoryId || 'other',
      quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
      unit: isValidUnit(item.unit) ? item.unit : 'unit',
      status: (VALID_STATUSES as readonly string[]).includes(item.status)
        ? (item.status as GroceryList['items'][0]['status'])
        : 'pending',
      price: typeof item.price === 'number' ? item.price : undefined,
      addedAt: new Date(now.getTime() + index), // Stagger times for ordering
    })).filter(item => item.name.length > 0),
    createdAt: now,
    updatedAt: now,
  };
  
  // Save the imported list
  saveList(newList);
  
  return newList;
}

// Find list by share code (legacy - searches local lists)
export function findListByShareCode(shareCode: string): GroceryList | null {
  const lists = getLists();
  return lists.find(list => list.shareCode === shareCode) || null;
}

// Validate share code format
export function isValidShareCode(code: string): boolean {
  // Share codes are 6 characters, alphanumeric (excluding confusing characters)
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}

// Check if a string looks like encoded share data
export function isEncodedShareData(data: string): boolean {
  // Base64url encoded data is typically longer and contains specific characters
  return data.length > 20 && /^[A-Za-z0-9_-]+$/.test(data);
}

// Remove share code from a list (revoke sharing)
export function revokeListSharing(listId: string): boolean {
  const list = getList(listId);
  
  if (!list) {
    return false;
  }
  
  saveList({
    ...list,
    shareCode: undefined,
    updatedAt: new Date(),
  });
  
  return true;
}

// Share via Web Share API (if available)
export async function shareViaWebShare(listId: string, listName: string): Promise<boolean> {
  if (!isBrowser() || !navigator.share) {
    return false;
  }
  
  const url = getShareUrl(listId);
  
  if (!url) {
    return false;
  }
  
  try {
    await navigator.share({
      title: `Grocery List: ${listName}`,
      text: `Check out my grocery list: ${listName}`,
      url,
    });
    return true;
  } catch (error) {
    // User cancelled or share failed
    if ((error as Error).name !== 'AbortError') {
      console.error('Share failed:', error);
    }
    return false;
  }
}

// Check if Web Share API is available
export function isWebShareAvailable(): boolean {
  return isBrowser() && typeof navigator.share === 'function';
}

// Copy share code to clipboard
export async function copyShareCode(listId: string): Promise<boolean> {
  const shareCode = generateListShareCode(listId);
  
  if (!shareCode) {
    return false;
  }
  
  return copyToClipboard(shareCode);
}
