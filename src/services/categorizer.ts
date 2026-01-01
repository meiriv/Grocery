import type { UnitType } from '@/types/grocery';
import { categorizeByKeyword, type CategorizationResult } from './keyword-matcher';
import { categorizeWithAI, categorizeMultipleWithAI, isAIAvailable } from './gemini-client';
import { getSettings } from './storage';
import { parseQuantityFromName } from '@/lib/utils';

export interface ItemCategorizationResult {
  categoryId: string;
  unit: UnitType;
  quantity: number;
  confidence: number;
  source: 'ai' | 'keyword';
  parsedName: string; // The item name after extracting quantity
}

// Main categorization function - uses AI if available, falls back to keyword matching
export async function categorizeItem(itemName: string): Promise<ItemCategorizationResult> {
  const settings = getSettings();
  
  // Try AI first if enabled - AI will handle quantity extraction
  if (settings.aiEnabled) {
    try {
      const aiResult = await categorizeWithAI(itemName);
      
      if (aiResult) {
        return {
          categoryId: aiResult.categoryId,
          unit: aiResult.unit,
          quantity: aiResult.quantity,
          confidence: aiResult.confidence,
          source: 'ai',
          parsedName: aiResult.parsedName,
        };
      }
    } catch (error) {
      console.error('AI categorization failed, falling back to keyword:', error);
    }
  }
  
  // Fall back to keyword matching with local quantity parsing
  const parsed = parseQuantityFromName(itemName);
  const cleanName = parsed.name;
  const explicitQuantity = parsed.quantity;
  const explicitUnit = parsed.unit as UnitType | undefined;
  
  const keywordResult = categorizeByKeyword(cleanName);
  
  return {
    categoryId: keywordResult.categoryId,
    unit: explicitUnit || keywordResult.unit,
    quantity: explicitQuantity ?? keywordResult.quantity,
    confidence: keywordResult.confidence,
    source: 'keyword',
    parsedName: cleanName,
  };
}

// Synchronous categorization (keyword only) - for immediate UI feedback
export function categorizeItemSync(itemName: string): ItemCategorizationResult {
  // First, parse quantity from the name
  const parsed = parseQuantityFromName(itemName);
  const cleanName = parsed.name;
  const explicitQuantity = parsed.quantity;
  const explicitUnit = parsed.unit as UnitType | undefined;
  
  const keywordResult = categorizeByKeyword(cleanName);
  
  return {
    categoryId: keywordResult.categoryId,
    unit: explicitUnit || keywordResult.unit,
    quantity: explicitQuantity ?? keywordResult.quantity,
    confidence: keywordResult.confidence,
    source: 'keyword',
    parsedName: cleanName,
  };
}

// Batch categorization - more efficient for multiple items
export async function categorizeMultipleItems(
  itemNames: string[]
): Promise<Map<string, ItemCategorizationResult>> {
  const results = new Map<string, ItemCategorizationResult>();
  const settings = getSettings();
  
  // First, do keyword matching for all items (immediate)
  for (const name of itemNames) {
    const keywordResult = categorizeByKeyword(name);
    results.set(name.toLowerCase(), {
      categoryId: keywordResult.categoryId,
      unit: keywordResult.unit,
      quantity: keywordResult.quantity,
      confidence: keywordResult.confidence,
      source: 'keyword',
    });
  }
  
  // If AI is enabled, try to improve results for low-confidence items
  if (settings.aiEnabled) {
    const lowConfidenceItems = itemNames.filter(name => {
      const result = results.get(name.toLowerCase());
      return result && result.confidence < 0.8;
    });
    
    if (lowConfidenceItems.length > 0) {
      try {
        const aiResults = await categorizeMultipleWithAI(lowConfidenceItems);
        
        aiResults.forEach((aiResult, name) => {
          results.set(name, {
            categoryId: aiResult.categoryId,
            unit: aiResult.unit,
            quantity: aiResult.quantity,
            confidence: aiResult.confidence,
            source: 'ai',
          });
        });
      } catch (error) {
        console.error('AI batch categorization failed:', error);
      }
    }
  }
  
  return results;
}

// Get categorization status
export async function getCategorizationStatus(): Promise<{
  aiAvailable: boolean;
  aiEnabled: boolean;
  method: 'ai' | 'keyword';
}> {
  const settings = getSettings();
  const aiAvailable = await isAIAvailable();
  
  return {
    aiAvailable,
    aiEnabled: settings.aiEnabled,
    method: settings.aiEnabled && aiAvailable ? 'ai' : 'keyword',
  };
}

// Re-categorize an item (force new categorization)
export async function recategorizeItem(
  itemName: string,
  preferAI: boolean = true
): Promise<ItemCategorizationResult> {
  if (preferAI) {
    return categorizeItem(itemName);
  }
  
  return categorizeItemSync(itemName);
}

