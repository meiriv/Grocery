import type { Category, UnitType } from '@/types/grocery';

// Default categories with bilingual support
export const defaultCategories: Category[] = [
  {
    id: 'fruits',
    name: { en: 'Fruits', he: 'פירות' },
    color: 'bg-emerald-500',
    icon: 'Apple',
    isDefault: true,
    keywords: {
      en: [
        'apple', 'apples', 'banana', 'bananas', 'orange', 'oranges', 'grape', 'grapes',
        'mango', 'mangoes', 'peach', 'peaches', 'pear', 'pears', 'plum', 'plums',
        'strawberry', 'strawberries', 'cherry', 'cherries', 'watermelon', 'melon',
        'pineapple', 'coconut', 'avocado', 'avocados', 'lemon', 'lemons', 'lime', 'limes',
        'kiwi', 'pomegranate', 'blueberry', 'blueberries', 'raspberry', 'raspberries',
        'blackberry', 'blackberries', 'papaya', 'passion fruit', 'dragon fruit',
        'grapefruit', 'tangerine', 'clementine', 'nectarine', 'apricot', 'fig', 'date',
      ],
      he: [
        'תפוח', 'תפוחים', 'בננה', 'בננות', 'תפוז', 'תפוזים', 'ענבים', 'מנגו',
        'אפרסק', 'אפרסקים', 'אגס', 'שזיף', 'תות', 'תותים', 'דובדבן', 'אבטיח',
        'מלון', 'אננס', 'קוקוס', 'אבוקדו', 'לימון', 'לימונים', 'ליים', 'קיווי',
        'רימון', 'אוכמניות', 'פטל', 'פפאיה', 'פסיפלורה', 'אשכולית', 'קלמנטינה',
        'נקטרינה', 'משמש', 'תאנה', 'תמר',
      ],
    },
    defaultUnit: 'kg',
    defaultQuantity: 1,
  },
  {
    id: 'vegetables',
    name: { en: 'Vegetables', he: 'ירקות' },
    color: 'bg-lime-500',
    icon: 'Carrot',
    isDefault: true,
    keywords: {
      en: [
        'tomato', 'tomatoes', 'potato', 'potatoes', 'carrot', 'carrots', 'cucumber',
        'cucumbers', 'onion', 'onions', 'pepper', 'peppers', 'zucchini', 'eggplant',
        'spinach', 'lettuce', 'cabbage', 'broccoli', 'cauliflower', 'mushroom',
        'mushrooms', 'garlic', 'ginger', 'corn', 'parsley', 'cilantro', 'coriander',
        'dill', 'mint', 'basil', 'green onion', 'green onions', 'scallion', 'scallions',
        'celery', 'asparagus', 'artichoke', 'beet', 'beets', 'radish', 'turnip',
        'sweet potato', 'pumpkin', 'squash', 'kale', 'arugula', 'chard', 'leek',
        'fennel', 'okra', 'peas', 'green beans', 'bean sprouts',
      ],
      he: [
        'עגבניה', 'עגבניות', 'תפוח אדמה', 'תפוחי אדמה', 'גזר', 'מלפפון', 'מלפפונים',
        'בצל', 'פלפל', 'קישוא', 'חציל', 'תרד', 'חסה', 'כרוב', 'ברוקולי', 'כרובית',
        'פטריות', 'שום', "ג'ינג'ר", 'תירס', 'פטרוזיליה', 'כוסברה', 'שמיר', 'נענע',
        'בזיליקום', 'בצל ירוק', 'סלרי', 'אספרגוס', 'ארטישוק', 'סלק', 'צנון',
        'בטטה', 'דלעת', 'קייל', 'רוקט', 'מנגולד', 'כרישה', 'שומר', 'במיה',
        'אפונה', 'שעועית ירוקה', 'נבטים',
      ],
    },
    defaultUnit: 'kg',
    defaultQuantity: 1,
  },
  {
    id: 'dairy',
    name: { en: 'Dairy', he: 'מוצרי חלב' },
    color: 'bg-sky-500',
    icon: 'Milk',
    isDefault: true,
    keywords: {
      en: [
        'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream', 'cottage cheese',
        'cream cheese', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'brie', 'gouda',
        'ricotta', 'mascarpone', 'whipped cream', 'half and half', 'eggs', 'egg',
      ],
      he: [
        'חלב', 'גבינה', 'יוגורט', 'חמאה', 'שמנת', 'שמנת חמוצה', 'קוטג', "קוטג'",
        'גבינת שמנת', 'מוצרלה', "צ'דר", 'פרמזן', 'פטה', 'ברי', 'גאודה', 'ריקוטה',
        'מסקרפונה', 'קצפת', 'ביצים', 'ביצה', 'לבנה', 'גבינה צהובה', 'גבינה לבנה',
      ],
    },
    defaultUnit: 'unit',
    defaultQuantity: 1,
  },
  {
    id: 'meat',
    name: { en: 'Meat', he: 'בשר' },
    color: 'bg-rose-500',
    icon: 'Beef',
    isDefault: true,
    keywords: {
      en: [
        'chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'salmon',
        'ground beef', 'ground chicken', 'ground turkey', 'steak', 'sausage',
        'sausages', 'bacon', 'ham', 'deli meat', 'hot dog', 'hot dogs', 'meatballs',
        'ribs', 'wings', 'drumsticks', 'thighs', 'breast', 'fillet', 'shrimp',
        'prawns', 'crab', 'lobster', 'scallops', 'mussels', 'clams', 'oysters',
        'cod', 'tilapia', 'trout', 'halibut', 'fresh fish',
      ],
      he: [
        'עוף', 'בקר', 'כבש', 'הודו', 'דג', 'סלמון', 'בשר טחון', 'סטייק',
        'נקניקיות', 'נקניק', 'שניצל', 'כנפיים', 'שוקיים', 'חזה', 'פילה', 'שרימפס',
        'סרטנים', 'לובסטר', 'צדפות', 'קלמרי', 'דג בורי', 'דג טרי',
        'דג אמנון', 'קבב', 'המבורגר', 'קציצות',
      ],
    },
    defaultUnit: 'kg',
    defaultQuantity: 0.5,
  },
  {
    id: 'bakery',
    name: { en: 'Bakery', he: 'מאפים' },
    color: 'bg-amber-500',
    icon: 'Croissant',
    isDefault: true,
    keywords: {
      en: [
        'bread', 'bagel', 'bagels', 'croissant', 'croissants', 'muffin', 'muffins',
        'roll', 'rolls', 'baguette', 'pita', 'tortilla', 'tortillas', 'cake', 'pie',
        'donut', 'donuts', 'pastry', 'pastries', 'danish', 'scone', 'biscuit',
        'cornbread', 'focaccia', 'ciabatta', 'sourdough', 'rye bread', 'whole wheat',
        'brioche', 'challah', 'naan', 'flatbread', 'crackers', 'breadsticks',
      ],
      he: [
        'לחם', 'בייגל', 'קרואסון', 'מאפין', 'לחמניה', 'לחמניות', 'באגט', 'פיתה',
        'טורטייה', 'עוגה', 'פאי', 'סופגניה', 'מאפה', 'דניש', 'סקון', 'ביסקוויט',
        'פוקאצ\'ה', "צ'באטה", 'לחם שאור', 'לחם שיפון', 'לחם מלא', 'בריוש', 'חלה',
        'נאן', 'לחם שטוח', 'קרקרים', 'מקלות לחם', 'בורקס', 'רוגלך', 'שטרודל',
      ],
    },
    defaultUnit: 'unit',
    defaultQuantity: 1,
  },
  {
    id: 'frozen',
    name: { en: 'Frozen', he: 'קפואים' },
    color: 'bg-cyan-500',
    icon: 'Snowflake',
    isDefault: true,
    keywords: {
      en: [
        'ice cream', 'frozen pizza', 'frozen vegetables', 'frozen fruit', 'frozen fish',
        'frozen chicken', 'frozen dinner', 'frozen meal', 'frozen yogurt', 'popsicle',
        'ice', 'sorbet', 'gelato', 'frozen waffles', 'frozen pancakes', 'frozen fries',
        'frozen peas', 'frozen corn', 'frozen berries', 'frozen shrimp',
      ],
      he: [
        'גלידה', 'פיצה קפואה', 'ירקות קפואים', 'פירות קפואים', 'דג קפוא', 'עוף קפוא',
        'ארוחה קפואה', 'יוגורט קפוא', 'ארטיק', 'קרח', 'סורבה', "ג'לטו", 'וופל קפוא',
        'פנקייק קפוא', "צ'יפס קפוא", 'אפונה קפואה', 'תירס קפוא', 'פירות יער קפואים',
      ],
    },
    defaultUnit: 'package',
    defaultQuantity: 1,
  },
  {
    id: 'beverages',
    name: { en: 'Beverages', he: 'משקאות' },
    color: 'bg-violet-500',
    icon: 'Coffee',
    isDefault: true,
    keywords: {
      en: [
        'juice', 'soda', 'water', 'mineral water', 'sparkling water', 'coffee', 'tea',
        'wine', 'beer', 'energy drink', 'sports drink', 'lemonade', 'iced tea',
        'smoothie', 'milkshake', 'hot chocolate', 'espresso', 'cappuccino', 'latte',
        'coconut water', 'almond milk', 'oat milk', 'soy milk', 'kombucha',
      ],
      he: [
        'מיץ', 'סודה', 'מים', 'מים מינרליים', 'מים מוגזים', 'קפה', 'תה', 'יין',
        'בירה', 'משקה אנרגיה', 'לימונדה', 'תה קר', 'סמוזי', 'מילקשייק', 'שוקו חם',
        'אספרסו', 'קפוצ\'ינו', 'לאטה', 'מי קוקוס', 'חלב שקדים', 'חלב שיבולת שועל',
        'חלב סויה', 'קומבוצ\'ה',
      ],
    },
    defaultUnit: 'l',
    defaultQuantity: 1,
  },
  {
    id: 'snacks',
    name: { en: 'Snacks', he: 'חטיפים' },
    color: 'bg-orange-500',
    icon: 'Cookie',
    isDefault: true,
    keywords: {
      en: [
        'chips', 'cookies', 'crackers', 'nuts', 'chocolate', 'candy', 'popcorn',
        'granola', 'protein bar', 'energy bar', 'pretzels', 'trail mix', 'dried fruit',
        'gummy', 'gummies', 'licorice', 'jerky', 'rice cakes', 'peanuts', 'almonds',
        'cashews', 'pistachios', 'walnuts', 'sunflower seeds', 'pumpkin seeds',
      ],
      he: [
        "צ'יפס", 'עוגיות', 'קרקרים', 'אגוזים', 'שוקולד', 'סוכריות', 'פופקורן',
        'גרנולה', 'חטיף חלבון', 'בייגלה', 'פירות יבשים', 'סוכריות גומי', 'בשר מיובש',
        'פריכיות', 'בוטנים', 'שקדים', 'קשיו', 'פיסטוק', 'אגוזי מלך', 'גרעיני חמניה',
        'גרעיני דלעת', 'במבה', 'ביסלי', 'קליק',
      ],
    },
    defaultUnit: 'package',
    defaultQuantity: 1,
  },
  {
    id: 'household',
    name: { en: 'Household', he: 'מוצרי בית' },
    color: 'bg-slate-500',
    icon: 'Home',
    isDefault: true,
    keywords: {
      en: [
        'toilet paper', 'paper towels', 'tissues', 'detergent', 'dish soap',
        'laundry detergent', 'fabric softener', 'bleach', 'sponge', 'sponges',
        'trash bags', 'aluminum foil', 'plastic wrap', 'zip bags', 'cleaning spray',
        'glass cleaner', 'floor cleaner', 'disinfectant', 'air freshener', 'candles',
        'light bulbs', 'batteries', 'matches', 'garbage bags', 'sandwich bags',
      ],
      he: [
        'נייר טואלט', 'מגבות נייר', 'טישו', 'סבון כלים', 'אבקת כביסה', 'מרכך כביסה',
        'אקונומיקה', 'ספוג', 'שקיות אשפה', 'נייר כסף', 'ניילון נצמד', 'שקיות זיפלוק',
        'תרסיס ניקוי', 'מנקה חלונות', 'מנקה רצפות', 'חומר חיטוי', 'מפיץ ריח',
        'נרות', 'נורות', 'סוללות', 'גפרורים', 'שקיות כריכים',
      ],
    },
    defaultUnit: 'unit',
    defaultQuantity: 1,
  },
  {
    id: 'personal',
    name: { en: 'Personal Care', he: 'טיפוח אישי' },
    color: 'bg-pink-500',
    icon: 'Heart',
    isDefault: true,
    keywords: {
      en: [
        'shampoo', 'conditioner', 'body wash', 'soap', 'toothpaste', 'toothbrush',
        'deodorant', 'lotion', 'sunscreen', 'razor blades', 'cotton pads', 'q-tips',
        'floss', 'mouthwash', 'hand sanitizer', 'face wash', 'moisturizer', 'lip balm',
        'makeup', 'mascara', 'foundation', 'nail polish', 'perfume', 'cologne',
        'hair gel', 'hair spray', 'body lotion', 'hand cream', 'shaving cream',
      ],
      he: [
        'שמפו', 'מרכך שיער', 'סבון גוף', 'סבון', 'משחת שיניים', 'מברשת שיניים',
        'דאודורנט', 'קרם', 'קרם הגנה', 'סכיני גילוח', 'פדים', 'מקלוני אוזניים',
        'חוט דנטלי', 'מי פה', 'ג\'ל חיטוי', 'סבון פנים', 'קרם לחות', 'שפתון',
        'איפור', 'מסקרה', 'פאונדיישן', 'לק', 'בושם', "ג'ל לשיער", 'ספריי לשיער',
        'קרם גוף', 'קרם ידיים', 'קצף גילוח',
      ],
    },
    defaultUnit: 'unit',
    defaultQuantity: 1,
  },
  {
    id: 'baking',
    name: { en: 'Baking', he: 'אפייה' },
    color: 'bg-amber-400',
    icon: 'CakeSlice',
    isDefault: true,
    keywords: {
      en: [
        'sugar', 'flour', 'baking powder', 'baking soda', 'yeast', 'vanilla', 'vanilla extract',
        'cocoa', 'cocoa powder', 'chocolate chips', 'brown sugar', 'powdered sugar', 'icing sugar',
        'cornstarch', 'corn starch', 'honey', 'maple syrup', 'molasses', 'food coloring',
        'sprinkles', 'frosting', 'icing', 'cake mix', 'brownie mix', 'muffin mix',
        'almond flour', 'coconut flour', 'bread flour', 'all purpose flour', 'self rising flour',
        'gelatin', 'pectin', 'cream of tartar', 'salt', 'cinnamon', 'nutmeg', 'ginger',
        'baking chocolate', 'white chocolate', 'dark chocolate', 'milk chocolate',
        'condensed milk', 'evaporated milk', 'coconut cream', 'shortening', 'lard',
        'pie crust', 'puff pastry', 'phyllo dough', 'fondant', 'marzipan',
      ],
      he: [
        'סוכר', 'קמח', 'אבקת אפייה', 'סודה לשתייה', 'שמרים', 'וניל', 'תמצית וניל',
        'קקאו', 'אבקת קקאו', 'שוקולד צ\'יפס', 'סוכר חום', 'אבקת סוכר', 'סוכר דק',
        'עמילן', 'עמילן תירס', 'דבש', 'סילאן', 'מייפל', 'צבע מאכל',
        'סוכריות לקישוט', 'ציפוי', 'תערובת עוגה', 'תערובת בראוניז', 'תערובת מאפינס',
        'קמח שקדים', 'קמח קוקוס', 'קמח לחם', 'קמח רב תכליתי', 'קמח תופח',
        "ג'לטין", 'פקטין', 'מלח', 'קינמון', 'אגוז מוסקט', "ג'ינג'ר",
        'שוקולד לאפייה', 'שוקולד לבן', 'שוקולד מריר', 'שוקולד חלב',
        'חלב מרוכז', 'חלב מאודה', 'קרם קוקוס', 'שומן צמחי', 'מרגרינה',
        'בצק פריך', 'בצק עלים', 'בצק פילו', 'פונדנט', 'מרציפן',
      ],
    },
    defaultUnit: 'package',
    defaultQuantity: 1,
  },
  {
    id: 'canned',
    name: { en: 'Canned', he: 'שימורים' },
    color: 'bg-yellow-600',
    icon: 'Package',
    isDefault: true,
    keywords: {
      en: [
        'canned', 'tuna', 'canned tuna', 'canned beans', 'canned corn', 'canned tomatoes',
        'canned peas', 'canned chickpeas', 'canned olives', 'canned mushrooms',
        'canned fruit', 'canned peaches', 'canned pineapple', 'sardines', 'anchovies',
        'tomato paste', 'tomato sauce', 'coconut milk', 'condensed milk', 'evaporated milk',
        'canned soup', 'canned vegetables', 'pickles', 'olives', 'capers', 'artichoke hearts',
        'baked beans', 'refried beans', 'black beans', 'kidney beans', 'chickpeas', 'lentils',
      ],
      he: [
        'שימורים', 'טונה', 'טונה בשימורים', 'תירס', 'תירס משומר', 'עגבניות משומרות',
        'אפונה משומרת', 'חומוס משומר', 'זיתים', 'פטריות משומרות', 'פירות משומרים',
        'אפרסקים משומרים', 'אננס משומר', 'סרדינים', 'אנשובי', 'רסק עגבניות',
        'רוטב עגבניות', 'חלב קוקוס', 'חלב מרוכז', 'מרק משומר', 'ירקות משומרים',
        'מלפפון חמוץ', 'חמוצים', 'צלפים', 'לבבות ארטישוק', 'שעועית', 'עדשים',
      ],
    },
    defaultUnit: 'unit',
    defaultQuantity: 1,
  },
  {
    id: 'other',
    name: { en: 'Other', he: 'אחר' },
    color: 'bg-gray-500',
    icon: 'Package',
    isDefault: true,
    keywords: {
      en: [],
      he: [],
    },
    defaultUnit: 'unit',
    defaultQuantity: 1,
  },
];

// Category color map for quick lookup
export const categoryColors: Record<string, string> = {
  fruits: 'bg-emerald-500',
  vegetables: 'bg-lime-500',
  dairy: 'bg-sky-500',
  meat: 'bg-rose-500',
  bakery: 'bg-amber-500',
  baking: 'bg-amber-400',
  frozen: 'bg-cyan-500',
  beverages: 'bg-violet-500',
  snacks: 'bg-orange-500',
  household: 'bg-slate-500',
  personal: 'bg-pink-500',
  canned: 'bg-yellow-600',
  other: 'bg-gray-500',
};

// Category text color map
export const categoryTextColors: Record<string, string> = {
  fruits: 'text-emerald-500',
  vegetables: 'text-lime-500',
  dairy: 'text-sky-500',
  meat: 'text-rose-500',
  bakery: 'text-amber-500',
  baking: 'text-amber-400',
  frozen: 'text-cyan-500',
  beverages: 'text-violet-500',
  snacks: 'text-orange-500',
  household: 'text-slate-500',
  personal: 'text-pink-500',
  canned: 'text-yellow-600',
  other: 'text-gray-500',
};

// Available colors for custom categories
export const availableCategoryColors = [
  { id: 'emerald', class: 'bg-emerald-500', name: { en: 'Green', he: 'ירוק' } },
  { id: 'lime', class: 'bg-lime-500', name: { en: 'Lime', he: 'ליים' } },
  { id: 'sky', class: 'bg-sky-500', name: { en: 'Blue', he: 'כחול' } },
  { id: 'rose', class: 'bg-rose-500', name: { en: 'Rose', he: 'ורוד' } },
  { id: 'amber', class: 'bg-amber-500', name: { en: 'Amber', he: 'ענבר' } },
  { id: 'cyan', class: 'bg-cyan-500', name: { en: 'Cyan', he: 'טורקיז' } },
  { id: 'violet', class: 'bg-violet-500', name: { en: 'Purple', he: 'סגול' } },
  { id: 'orange', class: 'bg-orange-500', name: { en: 'Orange', he: 'כתום' } },
  { id: 'slate', class: 'bg-slate-500', name: { en: 'Gray', he: 'אפור' } },
  { id: 'pink', class: 'bg-pink-500', name: { en: 'Pink', he: 'ורוד בהיר' } },
  { id: 'red', class: 'bg-red-500', name: { en: 'Red', he: 'אדום' } },
  { id: 'indigo', class: 'bg-indigo-500', name: { en: 'Indigo', he: 'אינדיגו' } },
];

// Get category by ID
export function getCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find(cat => cat.id === id);
}

// Get category color class
export function getCategoryColor(categories: Category[], id: string): string {
  const category = getCategoryById(categories, id);
  return category?.color || 'bg-gray-500';
}

// Get category name in specified language
export function getCategoryName(categories: Category[], id: string, language: 'en' | 'he'): string {
  const category = getCategoryById(categories, id);
  return category?.name[language] || id;
}

// Get default unit for a category
export function getCategoryDefaultUnit(categories: Category[], id: string): UnitType {
  const category = getCategoryById(categories, id);
  return category?.defaultUnit || 'unit';
}

// Get default quantity for a category
export function getCategoryDefaultQuantity(categories: Category[], id: string): number {
  const category = getCategoryById(categories, id);
  return category?.defaultQuantity || 1;
}

