import type { Category, UnitType } from '@/types/grocery';
import { defaultCategories } from '@/lib/categories';
import { getCustomCategories } from './storage';
import { getItemUnitDefault } from '@/lib/units';
import { normalizeText, detectLanguage } from '@/lib/utils';

export interface CategorizationResult {
  categoryId: string;
  confidence: number;
  unit: UnitType;
  quantity: number;
}

// Get all categories (default + custom)
function getAllCategories(): Category[] {
  const custom = getCustomCategories();
  return [...defaultCategories, ...custom];
}

// Compound terms that override ingredient-based categorization
// These are products where the final form determines category, not the ingredient
const COMPOUND_OVERRIDES: Record<string, { categoryId: string; unit: UnitType; quantity: number }> = {
  // Juices -> beverages (not fruits)
  'juice': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'orange juice': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'apple juice': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'grape juice': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'cranberry juice': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'tomato juice': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'carrot juice': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'מיץ': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'מיץ תפוזים': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'מיץ תפוחים': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'מיץ ענבים': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'מיץ גזר': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  // Plant milks -> beverages
  'almond milk': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'oat milk': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'soy milk': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'חלב שקדים': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'חלב שיבולת שועל': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  'חלב סויה': { categoryId: 'beverages', unit: 'l', quantity: 1 },
  // Canned items -> canned category
  'tuna': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'canned': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'canned tuna': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'canned corn': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'canned beans': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'canned tomatoes': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'canned peas': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'canned chickpeas': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'tomato sauce': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'tomato paste': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'coconut milk': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'sardines': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'olives': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'pickles': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'chickpeas': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'beans': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'lentils': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'טונה': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'שימורים': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'תירס': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'תירס משומר': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'טונה בשימורים': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'רסק עגבניות': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'רוטב עגבניות': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'חלב קוקוס': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'סרדינים': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'זיתים': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'חמוצים': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'חומוס': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'שעועית': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'עדשים': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  // Ketchup/condiments -> canned
  'קטשופ': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  'ketchup': { categoryId: 'canned', unit: 'unit', quantity: 1 },
  // Frozen items -> frozen
  'frozen': { categoryId: 'frozen', unit: 'package', quantity: 1 },
  'קפוא': { categoryId: 'frozen', unit: 'package', quantity: 1 },
  'קפואים': { categoryId: 'frozen', unit: 'package', quantity: 1 },
  'קפואה': { categoryId: 'frozen', unit: 'package', quantity: 1 },
  // Dried fruits -> snacks
  'dried fruit': { categoryId: 'snacks', unit: 'package', quantity: 1 },
  'dried fruits': { categoryId: 'snacks', unit: 'package', quantity: 1 },
  'פירות יבשים': { categoryId: 'snacks', unit: 'package', quantity: 1 },
  // Baking items -> baking
  'sugar': { categoryId: 'baking', unit: 'kg', quantity: 1 },
  'flour': { categoryId: 'baking', unit: 'kg', quantity: 1 },
  'baking powder': { categoryId: 'baking', unit: 'unit', quantity: 1 },
  'baking soda': { categoryId: 'baking', unit: 'unit', quantity: 1 },
  'yeast': { categoryId: 'baking', unit: 'unit', quantity: 1 },
  'vanilla': { categoryId: 'baking', unit: 'unit', quantity: 1 },
  'cocoa': { categoryId: 'baking', unit: 'unit', quantity: 1 },
  'honey': { categoryId: 'baking', unit: 'unit', quantity: 1 },
  'סוכר': { categoryId: 'baking', unit: 'kg', quantity: 1 },
  'קמח': { categoryId: 'baking', unit: 'kg', quantity: 1 },
  'אבקת אפייה': { categoryId: 'baking', unit: 'unit', quantity: 1 },
  'שמרים': { categoryId: 'baking', unit: 'unit', quantity: 1 },
  'וניל': { categoryId: 'baking', unit: 'unit', quantity: 1 },
  'קקאו': { categoryId: 'baking', unit: 'unit', quantity: 1 },
  'דבש': { categoryId: 'baking', unit: 'unit', quantity: 1 },
};

// Find category by keyword match
export function categorizeByKeyword(itemName: string): CategorizationResult {
  const normalized = normalizeText(itemName);
  const language = detectLanguage(itemName);
  const categories = getAllCategories();
  
  // FIRST: Check for compound term overrides (highest priority)
  // Check exact match first
  if (COMPOUND_OVERRIDES[normalized]) {
    const override = COMPOUND_OVERRIDES[normalized];
    return {
      categoryId: override.categoryId,
      confidence: 1.0,
      unit: override.unit,
      quantity: override.quantity,
    };
  }
  
  // Check if item contains any compound override term
  for (const [term, override] of Object.entries(COMPOUND_OVERRIDES)) {
    if (normalized.includes(normalizeText(term)) && term.length > 3) {
      return {
        categoryId: override.categoryId,
        confidence: 0.95,
        unit: override.unit,
        quantity: override.quantity,
      };
    }
  }
  
  // Check for exact keyword match
  for (const category of categories) {
    const keywords = category.keywords[language] || category.keywords.en;
    
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);
      
      // Exact match
      if (normalized === normalizedKeyword) {
        const itemDefault = getItemUnitDefault(itemName);
        return {
          categoryId: category.id,
          confidence: 1.0,
          unit: itemDefault?.unit || category.defaultUnit,
          quantity: itemDefault?.default || category.defaultQuantity,
        };
      }
    }
  }
  
  // Check for partial match (item contains keyword or keyword contains item)
  for (const category of categories) {
    const keywords = category.keywords[language] || category.keywords.en;
    
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);
      
      // Item contains keyword
      if (normalized.includes(normalizedKeyword) || normalizedKeyword.includes(normalized)) {
        const itemDefault = getItemUnitDefault(itemName);
        return {
          categoryId: category.id,
          confidence: 0.8,
          unit: itemDefault?.unit || category.defaultUnit,
          quantity: itemDefault?.default || category.defaultQuantity,
        };
      }
    }
  }
  
  // Check for word-by-word match (for multi-word items)
  const words = normalized.split(/\s+/);
  for (const category of categories) {
    const keywords = category.keywords[language] || category.keywords.en;
    
    for (const word of words) {
      if (word.length < 3) continue; // Skip short words
      
      for (const keyword of keywords) {
        const normalizedKeyword = normalizeText(keyword);
        
        if (word === normalizedKeyword || normalizedKeyword.includes(word)) {
          const itemDefault = getItemUnitDefault(itemName);
          return {
            categoryId: category.id,
            confidence: 0.6,
            unit: itemDefault?.unit || category.defaultUnit,
            quantity: itemDefault?.default || category.defaultQuantity,
          };
        }
      }
    }
  }
  
  // No match found - return "other" category
  const otherCategory = categories.find(c => c.id === 'other') || categories[categories.length - 1];
  const itemDefault = getItemUnitDefault(itemName);
  
  return {
    categoryId: otherCategory.id,
    confidence: 0,
    unit: itemDefault?.unit || otherCategory.defaultUnit,
    quantity: itemDefault?.default || otherCategory.defaultQuantity,
  };
}

// Batch categorize multiple items
export function categorizeMultipleByKeyword(itemNames: string[]): CategorizationResult[] {
  return itemNames.map(name => categorizeByKeyword(name));
}

// Get category suggestions for an item (top 3 matches)
export function getCategorySuggestions(itemName: string, limit: number = 3): Array<{
  categoryId: string;
  score: number;
}> {
  const normalized = normalizeText(itemName);
  const language = detectLanguage(itemName);
  const categories = getAllCategories();
  const scores: Array<{ categoryId: string; score: number }> = [];
  
  for (const category of categories) {
    if (category.id === 'other') continue;
    
    const keywords = category.keywords[language] || category.keywords.en;
    let maxScore = 0;
    
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);
      
      // Calculate similarity score
      let score = 0;
      
      if (normalized === normalizedKeyword) {
        score = 1.0;
      } else if (normalized.includes(normalizedKeyword)) {
        score = 0.8;
      } else if (normalizedKeyword.includes(normalized)) {
        score = 0.7;
      } else {
        // Check word overlap
        const words = normalized.split(/\s+/);
        for (const word of words) {
          if (word.length >= 3 && normalizedKeyword.includes(word)) {
            score = Math.max(score, 0.5);
          }
        }
      }
      
      maxScore = Math.max(maxScore, score);
    }
    
    if (maxScore > 0) {
      scores.push({ categoryId: category.id, score: maxScore });
    }
  }
  
  // Sort by score and return top matches
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Check if a category matches an item well
export function doesCategoryMatch(itemName: string, categoryId: string): boolean {
  const result = categorizeByKeyword(itemName);
  return result.categoryId === categoryId && result.confidence > 0.5;
}

