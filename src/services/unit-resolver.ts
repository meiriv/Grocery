import type { UnitType, Category } from '@/types/grocery';
import { getItemUnitDefault, units } from '@/lib/units';
import { defaultCategories, getCategoryById } from '@/lib/categories';
import { getCustomCategories } from './storage';

export interface UnitResolution {
  unit: UnitType;
  quantity: number;
  source: 'item' | 'category' | 'default';
}

// Get all categories
function getAllCategories(): Category[] {
  const custom = getCustomCategories();
  return [...defaultCategories, ...custom];
}

// Resolve unit and quantity for an item
export function resolveItemUnit(
  itemName: string,
  categoryId?: string
): UnitResolution {
  // First, check item-specific defaults
  const itemDefault = getItemUnitDefault(itemName);
  
  if (itemDefault) {
    return {
      unit: itemDefault.unit,
      quantity: itemDefault.default,
      source: 'item',
    };
  }
  
  // If category is provided, use category defaults
  if (categoryId) {
    const categories = getAllCategories();
    const category = getCategoryById(categories, categoryId);
    
    if (category) {
      return {
        unit: category.defaultUnit,
        quantity: category.defaultQuantity,
        source: 'category',
      };
    }
  }
  
  // Default fallback
  return {
    unit: 'unit',
    quantity: 1,
    source: 'default',
  };
}

// Get available units for a category (some categories have more relevant units)
export function getAvailableUnitsForCategory(categoryId: string): UnitType[] {
  const categories = getAllCategories();
  const category = getCategoryById(categories, categoryId);
  
  // Define relevant units per category type
  const categoryUnitMap: Record<string, UnitType[]> = {
    fruits: ['kg', 'g', 'unit', 'bunch'],
    vegetables: ['kg', 'g', 'unit', 'bunch'],
    dairy: ['unit', 'l', 'ml', 'package', 'g'],
    meat: ['kg', 'g', 'unit', 'package'],
    bakery: ['unit', 'package', 'dozen'],
    frozen: ['package', 'unit', 'kg', 'g'],
    beverages: ['l', 'ml', 'unit', 'package'],
    snacks: ['package', 'unit', 'g'],
    household: ['unit', 'package'],
    personal: ['unit', 'package', 'ml'],
    other: ['unit', 'kg', 'g', 'l', 'ml', 'package'],
  };
  
  // Get units for this category or return all units
  return categoryUnitMap[categoryId] || Object.keys(units) as UnitType[];
}

// Get unit step (for increment/decrement)
export function getUnitStep(unitType: UnitType): number {
  return units[unitType]?.step || 1;
}

// Get unit minimum value
export function getUnitMinValue(unitType: UnitType): number {
  return units[unitType]?.minValue || 1;
}

// Format quantity for display
export function formatQuantity(quantity: number, unitType: UnitType): string {
  const step = getUnitStep(unitType);
  
  // For units with decimal steps, show one decimal place
  if (step < 1) {
    return quantity.toFixed(1).replace(/\.0$/, '');
  }
  
  return Math.round(quantity).toString();
}

// Adjust quantity by step (for +/- buttons)
export function adjustQuantity(
  currentQuantity: number,
  unitType: UnitType,
  direction: 'up' | 'down'
): number {
  const step = getUnitStep(unitType);
  const minValue = getUnitMinValue(unitType);
  
  let newQuantity: number;
  
  if (direction === 'up') {
    newQuantity = currentQuantity + step;
  } else {
    newQuantity = currentQuantity - step;
  }
  
  // Ensure minimum value
  if (newQuantity < minValue) {
    newQuantity = minValue;
  }
  
  // Round to avoid floating point issues
  return Math.round(newQuantity * 10) / 10;
}

// Validate quantity for a unit type
export function validateQuantity(quantity: number, unitType: UnitType): number {
  const minValue = getUnitMinValue(unitType);
  const step = getUnitStep(unitType);
  
  // Ensure minimum
  if (quantity < minValue) {
    return minValue;
  }
  
  // Round to nearest step
  return Math.round(quantity / step) * step;
}

// Convert between units (basic conversions)
export function convertUnit(
  quantity: number,
  fromUnit: UnitType,
  toUnit: UnitType
): number | null {
  // Define conversion factors
  const conversions: Record<string, number> = {
    'kg_g': 1000,
    'g_kg': 0.001,
    'l_ml': 1000,
    'ml_l': 0.001,
  };
  
  const conversionKey = `${fromUnit}_${toUnit}`;
  const factor = conversions[conversionKey];
  
  if (factor !== undefined) {
    return quantity * factor;
  }
  
  // No conversion available
  return null;
}

