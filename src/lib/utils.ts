import { v4 as uuidv4 } from 'uuid';

// Generate a unique ID
export function generateId(): string {
  return uuidv4();
}

// Generate a short share code
export function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Format relative time
export function formatRelativeTime(date: Date, language: 'en' | 'he'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return language === 'en' ? 'Just now' : 'עכשיו';
  }
  if (diffMins < 60) {
    return language === 'en' 
      ? `${diffMins} min ago` 
      : `לפני ${diffMins} דקות`;
  }
  if (diffHours < 24) {
    return language === 'en' 
      ? `${diffHours} hours ago` 
      : `לפני ${diffHours} שעות`;
  }
  if (diffDays === 1) {
    return language === 'en' ? 'Yesterday' : 'אתמול';
  }
  if (diffDays < 7) {
    return language === 'en' 
      ? `${diffDays} days ago` 
      : `לפני ${diffDays} ימים`;
  }
  
  // Format as date
  return date.toLocaleDateString(language === 'en' ? 'en-US' : 'he-IL', {
    month: 'short',
    day: 'numeric',
  });
}

// Format currency
export function formatCurrency(amount: number, currency: string = '₪'): string {
  return `${currency}${amount.toFixed(2)}`;
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Clamp a number between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Check if running in browser
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// Check if PWA is installed
export function isPWAInstalled(): boolean {
  if (!isBrowser()) return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error - navigator.standalone is iOS specific
    window.navigator.standalone === true
  );
}

// Parse item list from various formats (new lines, commas, or intelligent space separation)
export function parseItemList(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  // First, check if input contains new lines - split by new lines
  if (trimmed.includes('\n')) {
    return trimmed
      .split(/\n+/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      // Further split each line by commas if present
      .flatMap(line => {
        if (line.includes(',') || line.includes('،')) {
          return line.split(/[,،]/).map(i => i.trim()).filter(i => i.length > 0);
        }
        return [line];
      });
  }

  // Check if input contains commas (English or Hebrew/Arabic)
  if (trimmed.includes(',') || trimmed.includes('،')) {
    return trimmed
      .split(/[,،]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  // For space-separated input, be smart about it:
  // - If all "words" are single words (no spaces within items), treat as separate items
  // - Common grocery items are usually 1-3 words
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  
  // If only 1-2 words, treat as a single item
  if (words.length <= 2) {
    return [trimmed];
  }

  // Check if it looks like a list of single-word items (common for grocery lists)
  // Heuristic: if most words are short and could be item names
  // BUT: only split if there are 4+ words to avoid splitting phrases like "Item To Delete"
  const couldBeSingleWordItems = words.every(word => {
    // Hebrew or English single words that could be grocery items
    return word.length >= 2 && word.length <= 20;
  });

  // If it looks like a space-separated list of items (4+ words to be safe)
  if (couldBeSingleWordItems && words.length >= 4) {
    return words;
  }

  // Default: treat as a single item
  return [trimmed];
}

// Normalize text for comparison (lowercase, trim, remove extra spaces)
export function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Parse quantity from item name
// Supports formats like: "milk x3", "3 milk", "milk 3", "חלב x3", "3 חלב", "חלבx3"
// Also supports: "2kg apples", "apples 2kg", "1.5l milk"
export interface ParsedItemWithQuantity {
  name: string;
  quantity?: number;
  unit?: string;
}

export function parseQuantityFromName(input: string): ParsedItemWithQuantity {
  const trimmed = input.trim();
  if (!trimmed) return { name: '' };

  // Patterns to match quantity
  // Pattern 1: "item x3" or "item X3" or "itemx3" (quantity at end with x)
  const xPatternEnd = /^(.+?)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*$/;
  // Pattern 2: "x3 item" or "X3 item" (quantity at start with x)
  const xPatternStart = /^\s*[xX×]\s*(\d+(?:\.\d+)?)\s+(.+)$/;
  // Pattern 3: "3 items" or "3items" (number at start)
  const numberStart = /^(\d+(?:\.\d+)?)\s*(.+)$/;
  // Pattern 4: "item 3" (number at end, no x)
  const numberEnd = /^(.+?)\s+(\d+(?:\.\d+)?)\s*$/;
  // Pattern 5: "2kg item" or "2 kg item" (quantity with unit at start)
  const unitStart = /^(\d+(?:\.\d+)?)\s*(kg|g|l|ml|ק"ג|גרם|ליטר|מ"ל)\s+(.+)$/i;
  // Pattern 6: "item 2kg" or "item 2 kg" (quantity with unit at end)
  const unitEnd = /^(.+?)\s+(\d+(?:\.\d+)?)\s*(kg|g|l|ml|ק"ג|גרם|ליטר|מ"ל)\s*$/i;

  let match: RegExpMatchArray | null;

  // Try x pattern at end first (most explicit)
  match = trimmed.match(xPatternEnd);
  if (match) {
    return {
      name: match[1].trim(),
      quantity: parseFloat(match[2]),
    };
  }

  // Try x pattern at start
  match = trimmed.match(xPatternStart);
  if (match) {
    return {
      name: match[2].trim(),
      quantity: parseFloat(match[1]),
    };
  }

  // Try unit pattern at end
  match = trimmed.match(unitEnd);
  if (match) {
    return {
      name: match[1].trim(),
      quantity: parseFloat(match[2]),
      unit: normalizeUnitFromText(match[3]),
    };
  }

  // Try unit pattern at start
  match = trimmed.match(unitStart);
  if (match) {
    return {
      name: match[3].trim(),
      quantity: parseFloat(match[1]),
      unit: normalizeUnitFromText(match[2]),
    };
  }

  // Try number at start (but be careful - "2% milk" should not match)
  match = trimmed.match(numberStart);
  if (match && !match[2].startsWith('%')) {
    const possibleName = match[2].trim();
    // Only use if the remaining text looks like an item name (has letters)
    if (/[a-zA-Z\u0590-\u05FF]/.test(possibleName)) {
      return {
        name: possibleName,
        quantity: parseFloat(match[1]),
      };
    }
  }

  // Try number at end (only if it's clearly a quantity, not part of name)
  match = trimmed.match(numberEnd);
  if (match) {
    const possibleName = match[1].trim();
    // Make sure name has letters and number is reasonable (1-999)
    const qty = parseFloat(match[2]);
    if (/[a-zA-Z\u0590-\u05FF]/.test(possibleName) && qty >= 1 && qty <= 999) {
      return {
        name: possibleName,
        quantity: qty,
      };
    }
  }

  // No quantity found, return original
  return { name: trimmed };
}

// Helper to normalize unit text to our unit types
function normalizeUnitFromText(unitText: string): string {
  const lower = unitText.toLowerCase();
  const unitMap: Record<string, string> = {
    'kg': 'kg',
    'ק"ג': 'kg',
    'קילו': 'kg',
    'g': 'g',
    'גרם': 'g',
    'גר': 'g',
    'l': 'l',
    'ליטר': 'l',
    'ml': 'ml',
    'מ"ל': 'ml',
  };
  return unitMap[lower] || lower;
}

// Check if text contains Hebrew characters
export function containsHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

// Detect language from text
export function detectLanguage(text: string): 'en' | 'he' {
  return containsHebrew(text) ? 'he' : 'en';
}

// Sleep function for async operations
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isBrowser()) return false;
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

// Group items by a key
export function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// Sort items with checked items at the bottom
export function sortGroceryItems<T extends { status: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // Pending items first, then out_of_stock, then checked
    const statusOrder = { pending: 0, out_of_stock: 1, checked: 2 };
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 0;
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 0;
    return aOrder - bOrder;
  });
}

// Vibrate device (for haptic feedback)
export function vibrate(pattern: number | number[] = 10): void {
  if (isBrowser() && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

// Class name helper (simple cn function)
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

