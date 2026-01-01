import type { Unit, UnitType, ItemUnitDefault } from '@/types/grocery';

// Unit definitions with bilingual support
export const units: Record<UnitType, Unit> = {
  unit: {
    id: 'unit',
    name: { en: 'Units', he: 'יחידות' },
    shortName: { en: 'x', he: 'x' },
    step: 1,
    minValue: 1,
  },
  kg: {
    id: 'kg',
    name: { en: 'Kilograms', he: 'קילוגרם' },
    shortName: { en: 'kg', he: 'ק"ג' },
    step: 0.5,
    minValue: 0.5,
  },
  g: {
    id: 'g',
    name: { en: 'Grams', he: 'גרם' },
    shortName: { en: 'g', he: "גר'" },
    step: 100,
    minValue: 100,
  },
  l: {
    id: 'l',
    name: { en: 'Liters', he: 'ליטר' },
    shortName: { en: 'L', he: "ל'" },
    step: 0.5,
    minValue: 0.5,
  },
  ml: {
    id: 'ml',
    name: { en: 'Milliliters', he: 'מיליליטר' },
    shortName: { en: 'ml', he: 'מ"ל' },
    step: 100,
    minValue: 100,
  },
  package: {
    id: 'package',
    name: { en: 'Package', he: 'אריזה' },
    shortName: { en: 'pkg', he: "אר'" },
    step: 1,
    minValue: 1,
  },
  dozen: {
    id: 'dozen',
    name: { en: 'Dozen', he: 'תריסר' },
    shortName: { en: 'dz', he: "תר'" },
    step: 1,
    minValue: 1,
  },
  bunch: {
    id: 'bunch',
    name: { en: 'Bunch', he: 'צרור' },
    shortName: { en: 'bunch', he: 'צרור' },
    step: 1,
    minValue: 1,
  },
};

// Item-specific unit defaults (English keywords)
export const itemUnitDefaultsEn: Record<string, ItemUnitDefault> = {
  // Fruits - by weight (kg)
  apple: { unit: 'kg', default: 1 },
  apples: { unit: 'kg', default: 1 },
  banana: { unit: 'kg', default: 1 },
  bananas: { unit: 'kg', default: 1 },
  orange: { unit: 'kg', default: 1 },
  oranges: { unit: 'kg', default: 1 },
  grape: { unit: 'kg', default: 1 },
  grapes: { unit: 'kg', default: 1 },
  mango: { unit: 'kg', default: 1 },
  mangoes: { unit: 'kg', default: 1 },
  peach: { unit: 'kg', default: 1 },
  peaches: { unit: 'kg', default: 1 },
  pear: { unit: 'kg', default: 1 },
  pears: { unit: 'kg', default: 1 },
  plum: { unit: 'kg', default: 1 },
  plums: { unit: 'kg', default: 1 },
  strawberry: { unit: 'kg', default: 0.5 },
  strawberries: { unit: 'kg', default: 0.5 },
  cherry: { unit: 'kg', default: 0.5 },
  cherries: { unit: 'kg', default: 0.5 },
  watermelon: { unit: 'unit', default: 1 },
  melon: { unit: 'unit', default: 1 },
  pineapple: { unit: 'unit', default: 1 },
  coconut: { unit: 'unit', default: 1 },
  
  // Fruits - by unit
  avocado: { unit: 'unit', default: 2 },
  avocados: { unit: 'unit', default: 2 },
  lemon: { unit: 'unit', default: 3 },
  lemons: { unit: 'unit', default: 3 },
  lime: { unit: 'unit', default: 3 },
  limes: { unit: 'unit', default: 3 },
  kiwi: { unit: 'unit', default: 4 },
  pomegranate: { unit: 'unit', default: 2 },
  
  // Vegetables - by weight (kg)
  tomato: { unit: 'kg', default: 1 },
  tomatoes: { unit: 'kg', default: 1 },
  potato: { unit: 'kg', default: 1 },
  potatoes: { unit: 'kg', default: 1 },
  carrot: { unit: 'kg', default: 1 },
  carrots: { unit: 'kg', default: 1 },
  cucumber: { unit: 'kg', default: 1 },
  cucumbers: { unit: 'kg', default: 1 },
  onion: { unit: 'kg', default: 1 },
  onions: { unit: 'kg', default: 1 },
  pepper: { unit: 'kg', default: 1 },
  peppers: { unit: 'kg', default: 1 },
  zucchini: { unit: 'kg', default: 1 },
  eggplant: { unit: 'kg', default: 1 },
  spinach: { unit: 'kg', default: 0.5 },
  lettuce: { unit: 'unit', default: 1 },
  cabbage: { unit: 'unit', default: 1 },
  broccoli: { unit: 'unit', default: 1 },
  cauliflower: { unit: 'unit', default: 1 },
  mushroom: { unit: 'kg', default: 0.5 },
  mushrooms: { unit: 'kg', default: 0.5 },
  
  // Vegetables - by unit
  garlic: { unit: 'unit', default: 2 },
  ginger: { unit: 'unit', default: 1 },
  corn: { unit: 'unit', default: 3 },
  
  // Vegetables - by bunch
  parsley: { unit: 'bunch', default: 1 },
  cilantro: { unit: 'bunch', default: 1 },
  coriander: { unit: 'bunch', default: 1 },
  dill: { unit: 'bunch', default: 1 },
  mint: { unit: 'bunch', default: 1 },
  basil: { unit: 'bunch', default: 1 },
  'green onion': { unit: 'bunch', default: 1 },
  'green onions': { unit: 'bunch', default: 1 },
  scallion: { unit: 'bunch', default: 1 },
  scallions: { unit: 'bunch', default: 1 },
  celery: { unit: 'bunch', default: 1 },
  
  // Dairy - by unit/package
  milk: { unit: 'l', default: 1 },
  cheese: { unit: 'package', default: 1 },
  yogurt: { unit: 'unit', default: 4 },
  butter: { unit: 'package', default: 1 },
  cream: { unit: 'unit', default: 1 },
  'sour cream': { unit: 'unit', default: 1 },
  'cottage cheese': { unit: 'unit', default: 1 },
  'cream cheese': { unit: 'package', default: 1 },
  
  // Eggs
  eggs: { unit: 'package', default: 1 },
  egg: { unit: 'package', default: 1 },
  
  // Meat - by weight
  chicken: { unit: 'kg', default: 1 },
  beef: { unit: 'kg', default: 0.5 },
  pork: { unit: 'kg', default: 0.5 },
  lamb: { unit: 'kg', default: 0.5 },
  turkey: { unit: 'kg', default: 1 },
  fish: { unit: 'kg', default: 0.5 },
  salmon: { unit: 'kg', default: 0.5 },
  tuna: { unit: 'unit', default: 2 },
  'ground beef': { unit: 'kg', default: 0.5 },
  'ground chicken': { unit: 'kg', default: 0.5 },
  steak: { unit: 'kg', default: 0.5 },
  sausage: { unit: 'package', default: 1 },
  sausages: { unit: 'package', default: 1 },
  bacon: { unit: 'package', default: 1 },
  'deli meat': { unit: 'g', default: 200 },
  
  // Bakery - by unit
  bread: { unit: 'unit', default: 1 },
  bagel: { unit: 'unit', default: 4 },
  bagels: { unit: 'unit', default: 4 },
  croissant: { unit: 'unit', default: 4 },
  croissants: { unit: 'unit', default: 4 },
  muffin: { unit: 'unit', default: 4 },
  muffins: { unit: 'unit', default: 4 },
  roll: { unit: 'unit', default: 6 },
  rolls: { unit: 'unit', default: 6 },
  baguette: { unit: 'unit', default: 1 },
  pita: { unit: 'package', default: 1 },
  tortilla: { unit: 'package', default: 1 },
  tortillas: { unit: 'package', default: 1 },
  cake: { unit: 'unit', default: 1 },
  pie: { unit: 'unit', default: 1 },
  
  // Frozen - by package
  'ice cream': { unit: 'unit', default: 1 },
  'frozen pizza': { unit: 'unit', default: 1 },
  'frozen vegetables': { unit: 'package', default: 1 },
  'frozen fruit': { unit: 'package', default: 1 },
  'frozen fish': { unit: 'package', default: 1 },
  
  // Beverages - by volume
  juice: { unit: 'l', default: 1 },
  soda: { unit: 'l', default: 1.5 },
  water: { unit: 'l', default: 1.5 },
  'mineral water': { unit: 'l', default: 1.5 },
  coffee: { unit: 'package', default: 1 },
  tea: { unit: 'package', default: 1 },
  wine: { unit: 'unit', default: 1 },
  beer: { unit: 'unit', default: 6 },
  
  // Pantry - by package
  pasta: { unit: 'package', default: 1 },
  rice: { unit: 'package', default: 1 },
  cereal: { unit: 'package', default: 1 },
  oatmeal: { unit: 'package', default: 1 },
  flour: { unit: 'kg', default: 1 },
  sugar: { unit: 'kg', default: 1 },
  salt: { unit: 'package', default: 1 },
  oil: { unit: 'l', default: 1 },
  'olive oil': { unit: 'l', default: 1 },
  vinegar: { unit: 'unit', default: 1 },
  'soy sauce': { unit: 'unit', default: 1 },
  ketchup: { unit: 'unit', default: 1 },
  mayonnaise: { unit: 'unit', default: 1 },
  mustard: { unit: 'unit', default: 1 },
  honey: { unit: 'unit', default: 1 },
  jam: { unit: 'unit', default: 1 },
  'peanut butter': { unit: 'unit', default: 1 },
  nutella: { unit: 'unit', default: 1 },
  
  // Snacks - by package
  chips: { unit: 'package', default: 1 },
  cookies: { unit: 'package', default: 1 },
  crackers: { unit: 'package', default: 1 },
  nuts: { unit: 'package', default: 1 },
  chocolate: { unit: 'unit', default: 1 },
  candy: { unit: 'package', default: 1 },
  popcorn: { unit: 'package', default: 1 },
  granola: { unit: 'package', default: 1 },
  'protein bar': { unit: 'package', default: 1 },
  
  // Household - by unit
  'toilet paper': { unit: 'package', default: 1 },
  'paper towels': { unit: 'package', default: 1 },
  tissues: { unit: 'package', default: 1 },
  detergent: { unit: 'unit', default: 1 },
  'dish soap': { unit: 'unit', default: 1 },
  'laundry detergent': { unit: 'unit', default: 1 },
  'fabric softener': { unit: 'unit', default: 1 },
  bleach: { unit: 'unit', default: 1 },
  sponge: { unit: 'package', default: 1 },
  sponges: { unit: 'package', default: 1 },
  'trash bags': { unit: 'package', default: 1 },
  'aluminum foil': { unit: 'unit', default: 1 },
  'plastic wrap': { unit: 'unit', default: 1 },
  'zip bags': { unit: 'package', default: 1 },
  
  // Personal Care - by unit
  shampoo: { unit: 'unit', default: 1 },
  conditioner: { unit: 'unit', default: 1 },
  'body wash': { unit: 'unit', default: 1 },
  soap: { unit: 'unit', default: 1 },
  toothpaste: { unit: 'unit', default: 1 },
  toothbrush: { unit: 'unit', default: 1 },
  deodorant: { unit: 'unit', default: 1 },
  lotion: { unit: 'unit', default: 1 },
  sunscreen: { unit: 'unit', default: 1 },
  'razor blades': { unit: 'package', default: 1 },
  'cotton pads': { unit: 'package', default: 1 },
};

// Item-specific unit defaults (Hebrew keywords)
export const itemUnitDefaultsHe: Record<string, ItemUnitDefault> = {
  // Fruits - by weight
  תפוח: { unit: 'kg', default: 1 },
  תפוחים: { unit: 'kg', default: 1 },
  בננה: { unit: 'kg', default: 1 },
  בננות: { unit: 'kg', default: 1 },
  תפוז: { unit: 'kg', default: 1 },
  תפוזים: { unit: 'kg', default: 1 },
  ענבים: { unit: 'kg', default: 1 },
  מנגו: { unit: 'kg', default: 1 },
  אפרסק: { unit: 'kg', default: 1 },
  אפרסקים: { unit: 'kg', default: 1 },
  אגס: { unit: 'kg', default: 1 },
  שזיף: { unit: 'kg', default: 1 },
  תות: { unit: 'kg', default: 0.5 },
  תותים: { unit: 'kg', default: 0.5 },
  דובדבן: { unit: 'kg', default: 0.5 },
  אבטיח: { unit: 'unit', default: 1 },
  מלון: { unit: 'unit', default: 1 },
  אננס: { unit: 'unit', default: 1 },
  
  // Fruits - by unit
  אבוקדו: { unit: 'unit', default: 2 },
  לימון: { unit: 'unit', default: 3 },
  לימונים: { unit: 'unit', default: 3 },
  ליים: { unit: 'unit', default: 3 },
  קיווי: { unit: 'unit', default: 4 },
  רימון: { unit: 'unit', default: 2 },
  
  // Vegetables - by weight
  עגבניה: { unit: 'kg', default: 1 },
  עגבניות: { unit: 'kg', default: 1 },
  תפוחאדמה: { unit: 'kg', default: 1 },
  'תפוח אדמה': { unit: 'kg', default: 1 },
  גזר: { unit: 'kg', default: 1 },
  מלפפון: { unit: 'kg', default: 1 },
  מלפפונים: { unit: 'kg', default: 1 },
  בצל: { unit: 'kg', default: 1 },
  פלפל: { unit: 'kg', default: 1 },
  קישוא: { unit: 'kg', default: 1 },
  חציל: { unit: 'kg', default: 1 },
  תרד: { unit: 'kg', default: 0.5 },
  חסה: { unit: 'unit', default: 1 },
  כרוב: { unit: 'unit', default: 1 },
  ברוקולי: { unit: 'unit', default: 1 },
  כרובית: { unit: 'unit', default: 1 },
  פטריות: { unit: 'kg', default: 0.5 },
  
  // Vegetables - by unit
  שום: { unit: 'unit', default: 2 },
  "ג'ינג'ר": { unit: 'unit', default: 1 },
  תירס: { unit: 'unit', default: 3 },
  
  // Vegetables - by bunch
  פטרוזיליה: { unit: 'bunch', default: 1 },
  כוסברה: { unit: 'bunch', default: 1 },
  שמיר: { unit: 'bunch', default: 1 },
  נענע: { unit: 'bunch', default: 1 },
  בזיליקום: { unit: 'bunch', default: 1 },
  'בצל ירוק': { unit: 'bunch', default: 1 },
  סלרי: { unit: 'bunch', default: 1 },
  
  // Dairy
  חלב: { unit: 'l', default: 1 },
  גבינה: { unit: 'package', default: 1 },
  יוגורט: { unit: 'unit', default: 4 },
  חמאה: { unit: 'package', default: 1 },
  שמנת: { unit: 'unit', default: 1 },
  קוטג: { unit: 'unit', default: 1 },
  "קוטג'": { unit: 'unit', default: 1 },
  לבנה: { unit: 'unit', default: 1 },
  
  // Eggs
  ביצים: { unit: 'package', default: 1 },
  ביצה: { unit: 'package', default: 1 },
  
  // Meat
  עוף: { unit: 'kg', default: 1 },
  בקר: { unit: 'kg', default: 0.5 },
  כבש: { unit: 'kg', default: 0.5 },
  הודו: { unit: 'kg', default: 1 },
  דג: { unit: 'kg', default: 0.5 },
  סלמון: { unit: 'kg', default: 0.5 },
  טונה: { unit: 'unit', default: 2 },
  'בשר טחון': { unit: 'kg', default: 0.5 },
  סטייק: { unit: 'kg', default: 0.5 },
  נקניקיות: { unit: 'package', default: 1 },
  
  // Bakery
  לחם: { unit: 'unit', default: 1 },
  בייגל: { unit: 'unit', default: 4 },
  קרואסון: { unit: 'unit', default: 4 },
  מאפין: { unit: 'unit', default: 4 },
  לחמניה: { unit: 'unit', default: 6 },
  לחמניות: { unit: 'unit', default: 6 },
  באגט: { unit: 'unit', default: 1 },
  פיתה: { unit: 'package', default: 1 },
  טורטייה: { unit: 'package', default: 1 },
  עוגה: { unit: 'unit', default: 1 },
  
  // Beverages
  מיץ: { unit: 'l', default: 1 },
  מים: { unit: 'l', default: 1.5 },
  קפה: { unit: 'package', default: 1 },
  תה: { unit: 'package', default: 1 },
  יין: { unit: 'unit', default: 1 },
  בירה: { unit: 'unit', default: 6 },
  
  // Pantry
  פסטה: { unit: 'package', default: 1 },
  אורז: { unit: 'package', default: 1 },
  קורנפלקס: { unit: 'package', default: 1 },
  שיבולת: { unit: 'package', default: 1 },
  קמח: { unit: 'kg', default: 1 },
  סוכר: { unit: 'kg', default: 1 },
  מלח: { unit: 'package', default: 1 },
  שמן: { unit: 'l', default: 1 },
  'שמן זית': { unit: 'l', default: 1 },
  חומץ: { unit: 'unit', default: 1 },
  קטשופ: { unit: 'unit', default: 1 },
  מיונז: { unit: 'unit', default: 1 },
  חרדל: { unit: 'unit', default: 1 },
  דבש: { unit: 'unit', default: 1 },
  ריבה: { unit: 'unit', default: 1 },
  
  // Snacks
  "צ'יפס": { unit: 'package', default: 1 },
  עוגיות: { unit: 'package', default: 1 },
  קרקרים: { unit: 'package', default: 1 },
  אגוזים: { unit: 'package', default: 1 },
  שוקולד: { unit: 'unit', default: 1 },
  סוכריות: { unit: 'package', default: 1 },
  פופקורן: { unit: 'package', default: 1 },
  
  // Household
  'נייר טואלט': { unit: 'package', default: 1 },
  'מגבות נייר': { unit: 'package', default: 1 },
  טישו: { unit: 'package', default: 1 },
  'סבון כלים': { unit: 'unit', default: 1 },
  'אבקת כביסה': { unit: 'unit', default: 1 },
  מרכך: { unit: 'unit', default: 1 },
  אקונומיקה: { unit: 'unit', default: 1 },
  ספוג: { unit: 'package', default: 1 },
  'שקיות אשפה': { unit: 'package', default: 1 },
  'נייר כסף': { unit: 'unit', default: 1 },
  'ניילון נצמד': { unit: 'unit', default: 1 },
  
  // Personal Care
  שמפו: { unit: 'unit', default: 1 },
  'מרכך שיער': { unit: 'unit', default: 1 },
  'סבון גוף': { unit: 'unit', default: 1 },
  סבון: { unit: 'unit', default: 1 },
  'משחת שיניים': { unit: 'unit', default: 1 },
  'מברשת שיניים': { unit: 'unit', default: 1 },
  דאודורנט: { unit: 'unit', default: 1 },
  קרם: { unit: 'unit', default: 1 },
  'קרם הגנה': { unit: 'unit', default: 1 },
};

// Get all unit types
export function getAllUnits(): UnitType[] {
  return Object.keys(units) as UnitType[];
}

// Get unit by ID
export function getUnit(unitId: UnitType): Unit {
  return units[unitId];
}

// Get item unit default by name (checks both English and Hebrew)
export function getItemUnitDefault(itemName: string): ItemUnitDefault | null {
  const normalizedName = itemName.toLowerCase().trim();
  
  // Check English defaults first
  if (itemUnitDefaultsEn[normalizedName]) {
    return itemUnitDefaultsEn[normalizedName];
  }
  
  // Check Hebrew defaults
  if (itemUnitDefaultsHe[normalizedName]) {
    return itemUnitDefaultsHe[normalizedName];
  }
  
  return null;
}

// Format quantity with unit
export function formatQuantityWithUnit(
  quantity: number,
  unitType: UnitType,
  language: 'en' | 'he'
): string {
  const unit = units[unitType];
  const shortName = unit.shortName[language];
  
  // Format the number nicely
  const formattedQty = Number.isInteger(quantity) 
    ? quantity.toString() 
    : quantity.toFixed(1).replace(/\.0$/, '');
  
  if (unitType === 'unit') {
    return `x${formattedQty}`;
  }
  
  return `${formattedQty} ${shortName}`;
}

