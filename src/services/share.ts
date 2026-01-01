import { generateShareCode, copyToClipboard, isBrowser } from '@/lib/utils';
import { getList, saveList, getLists } from './storage';
import type { GroceryList } from '@/types/grocery';

// Generate a share code for a list
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

// Get share URL for a list
export function getShareUrl(listId: string): string | null {
  const shareCode = generateListShareCode(listId);
  
  if (!shareCode || !isBrowser()) {
    return null;
  }
  
  const baseUrl = window.location.origin;
  return `${baseUrl}/list/${listId}?share=${shareCode}`;
}

// Copy share link to clipboard
export async function copyShareLink(listId: string): Promise<boolean> {
  const url = getShareUrl(listId);
  
  if (!url) {
    return false;
  }
  
  return copyToClipboard(url);
}

// Find list by share code
export function findListByShareCode(shareCode: string): GroceryList | null {
  const lists = getLists();
  return lists.find(list => list.shareCode === shareCode) || null;
}

// Validate share code format
export function isValidShareCode(code: string): boolean {
  // Share codes are 6 characters, alphanumeric (excluding confusing characters)
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
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

