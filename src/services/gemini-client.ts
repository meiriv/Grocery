import { getApiKey } from './secure-storage';
import { getSettings } from './storage';
import type { Category, UnitType } from '@/types/grocery';
import { defaultCategories } from '@/lib/categories';
import { getCustomCategories } from './storage';
import { units } from '@/lib/units';

export interface AICategorizationResult {
  categoryId: string;
  unit: UnitType;
  quantity: number;
  confidence: number;
  parsedName: string; // The clean item name after extracting quantity
}

// Get the working model name from storage, or use default
function getModelName(): string {
  if (typeof window !== 'undefined') {
    const storedModelName = localStorage.getItem('gemini-model-name');
    if (storedModelName) return storedModelName;
  }
  return 'gemini-3-flash-preview';
}

// Get all categories for the prompt
function getAllCategories(): Category[] {
  const custom = getCustomCategories();
  return [...defaultCategories, ...custom];
}

// Build the system prompt for categorization
function buildCategorizationPrompt(categories: Category[]): string {
  const categoryList = categories
    .map(c => `- ${c.id}: ${c.name.en} (${c.name.he})`)
    .join('\n');
  
  const unitList = Object.entries(units)
    .map(([id, u]) => `- ${id}: ${u.name.en}`)
    .join('\n');
  
  return `You are a smart grocery list assistant. Your job is to parse grocery item input and extract:
1. The clean item name (without quantity/unit info)
2. The quantity (if specified in the input, otherwise use smart defaults)
3. The appropriate unit of measurement
4. The most appropriate category

CRITICAL CATEGORIZATION RULES:
- Categorize by the FINAL PRODUCT TYPE, not by ingredients!
- "orange juice", "apple juice", "grape juice" → beverages (NOT fruits)
- "almond milk", "oat milk", "soy milk" → beverages (NOT fruits/nuts)
- "frozen vegetables", "frozen fruits" → frozen (NOT vegetables/fruits)
- "dried fruits" → snacks (NOT fruits)
- "fruit yogurt" → dairy (NOT fruits)

CANNED PRODUCTS - use "canned" category for:
- "tuna", "canned tuna", "טונה" → canned (NOT meat!)
- "tomato sauce", "tomato paste", "רסק עגבניות" → canned (NOT vegetables)
- "canned corn", "canned beans", "canned peas" → canned (NOT vegetables)
- "chickpeas", "lentils", "beans" → canned
- "olives", "pickles", "חמוצים", "זיתים" → canned
- "sardines", "anchovies", "סרדינים" → canned (NOT meat)
- "coconut milk", "חלב קוקוס" → canned
- Any preserved/jarred/canned item → canned

BAKING PRODUCTS - use "baking" category for:
- "sugar", "סוכר" → baking
- "flour", "קמח" → baking
- "baking powder", "baking soda", "אבקת אפייה" → baking
- "yeast", "שמרים" → baking
- "vanilla", "וניל" → baking
- "cocoa", "קקאו" → baking
- "honey", "דבש" → baking
- "chocolate chips", "brown sugar", "powdered sugar" → baking
- Any baking ingredient → baking

IMPORTANT: Users may specify quantities in various formats. You MUST extract the quantity from the input text.

Quantity formats to recognize:
- "item x5" or "item X5" or "itemx5" → quantity: 5
- "5 items" or "5items" → quantity: 5
- "item 5" → quantity: 5
- "x5 item" → quantity: 5
- "2kg apples" → quantity: 2, unit: kg
- "apples 2kg" → quantity: 2, unit: kg
- "milk 1.5l" → quantity: 1.5, unit: l
- "טונה x8" or "טונהx8" → quantity: 8 (Hebrew)
- "8 טונה" → quantity: 8 (Hebrew)

Available categories:
${categoryList}

Available units:
${unitList}

Respond ONLY with a JSON object in this exact format:
{"name": "clean_item_name", "categoryId": "category_id", "unit": "unit_type", "quantity": number}

Examples:
- "milk" → {"name": "milk", "categoryId": "dairy", "unit": "l", "quantity": 1}
- "milk x3" → {"name": "milk", "categoryId": "dairy", "unit": "l", "quantity": 3}
- "apples 2kg" → {"name": "apples", "categoryId": "fruits", "unit": "kg", "quantity": 2}
- "eggs x12" → {"name": "eggs", "categoryId": "dairy", "unit": "package", "quantity": 12}
- "orange juice" → {"name": "orange juice", "categoryId": "beverages", "unit": "l", "quantity": 1}
- "מיץ תפוזים" → {"name": "מיץ תפוזים", "categoryId": "beverages", "unit": "l", "quantity": 1}
- "apple juice 2L" → {"name": "apple juice", "categoryId": "beverages", "unit": "l", "quantity": 2}
- "tuna" → {"name": "tuna", "categoryId": "canned", "unit": "unit", "quantity": 1}
- "טונה" → {"name": "טונה", "categoryId": "canned", "unit": "unit", "quantity": 1}
- "טונה x8" → {"name": "טונה", "categoryId": "canned", "unit": "unit", "quantity": 8}
- "tomato sauce" → {"name": "tomato sauce", "categoryId": "canned", "unit": "unit", "quantity": 1}
- "רסק עגבניות" → {"name": "רסק עגבניות", "categoryId": "canned", "unit": "unit", "quantity": 1}
- "canned corn" → {"name": "canned corn", "categoryId": "canned", "unit": "unit", "quantity": 1}
- "chickpeas" → {"name": "chickpeas", "categoryId": "canned", "unit": "unit", "quantity": 1}
- "olives" → {"name": "olives", "categoryId": "canned", "unit": "unit", "quantity": 1}
- "חלב" → {"name": "חלב", "categoryId": "dairy", "unit": "l", "quantity": 1}
- "8 בננות" → {"name": "בננות", "categoryId": "fruits", "unit": "unit", "quantity": 8}
- "תפוחים 2 קילו" → {"name": "תפוחים", "categoryId": "fruits", "unit": "kg", "quantity": 2}
- "frozen peas" → {"name": "frozen peas", "categoryId": "frozen", "unit": "package", "quantity": 1}
- "chicken" → {"name": "chicken", "categoryId": "meat", "unit": "kg", "quantity": 1}

Default quantities when not specified:
- Fruits/Vegetables: 1 kg
- Beverages/Juices: 1 liter
- Dairy (milk, etc.): 1 liter
- Eggs: 1 package
- Most other items: 1 unit

If unsure about category, use "other". Always extract quantity if present in the input!`;
}

// Categorize a single item using Gemini
export async function categorizeWithAI(itemName: string): Promise<AICategorizationResult | null> {
  const settings = getSettings();
  
  // Check if AI is enabled
  if (!settings.aiEnabled) {
    return null;
  }
  
  // Get API key
  const apiKey = await getApiKey();
  if (!apiKey) {
    return null;
  }
  
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: getModelName() });
    
    const categories = getAllCategories();
    const systemPrompt = buildCategorizationPrompt(categories);
    
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `Parse and categorize this grocery item: "${itemName}"` },
    ]);
    
    const response = result.response;
    const text = response.text();
    
    // Parse the JSON response
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      console.error('Invalid AI response format:', text);
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate the response
    const validCategory = categories.find(c => c.id === parsed.categoryId);
    const validUnit = Object.keys(units).includes(parsed.unit);
    
    if (!validCategory || !validUnit) {
      console.error('Invalid category or unit in AI response:', parsed);
      return null;
    }
    
    return {
      categoryId: parsed.categoryId,
      unit: parsed.unit as UnitType,
      quantity: typeof parsed.quantity === 'number' ? parsed.quantity : 1,
      confidence: 0.9, // AI responses are generally confident
      parsedName: parsed.name || itemName, // Use the clean name from AI, fallback to original
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return null;
  }
}

// Batch categorize multiple items
export async function categorizeMultipleWithAI(
  itemNames: string[]
): Promise<Map<string, AICategorizationResult>> {
  const results = new Map<string, AICategorizationResult>();
  const settings = getSettings();
  
  if (!settings.aiEnabled) {
    return results;
  }
  
  const apiKey = await getApiKey();
  if (!apiKey) {
    return results;
  }
  
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: getModelName() });
    
    const categories = getAllCategories();
    const systemPrompt = buildCategorizationPrompt(categories);
    
    const batchPrompt = `Parse and categorize each of these grocery items. Extract quantities if specified.
Items: ${itemNames.map((n, i) => `${i + 1}. "${n}"`).join(', ')}

Return format: [{"original": "original_input", "name": "clean_name", "categoryId": "...", "unit": "...", "quantity": ...}, ...]

Remember to extract quantities from inputs like "item x5", "5 items", "2kg apples", "טונה x8", etc.`;
    
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: batchPrompt },
    ]);
    
    const response = result.response;
    const text = response.text();
    
    // Parse the JSON array response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Invalid AI batch response format:', text);
      return results;
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      original: string;
      name: string;
      categoryId: string;
      unit: string;
      quantity: number;
    }>;
    
    for (const item of parsed) {
      const validCategory = categories.find(c => c.id === item.categoryId);
      const validUnit = Object.keys(units).includes(item.unit);
      
      if (validCategory && validUnit) {
        // Use original input as key for lookup
        const key = (item.original || item.name).toLowerCase();
        results.set(key, {
          categoryId: item.categoryId,
          unit: item.unit as UnitType,
          quantity: item.quantity || 1,
          confidence: 0.9,
          parsedName: item.name || item.original,
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error calling Gemini API for batch:', error);
    return results;
  }
}

// Check if AI categorization is available
export async function isAIAvailable(): Promise<boolean> {
  const settings = getSettings();
  if (!settings.aiEnabled) return false;
  
  const apiKey = await getApiKey();
  return apiKey !== null;
}

