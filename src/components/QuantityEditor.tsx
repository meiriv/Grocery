'use client';

import React, { useState } from 'react';
import { Minus, Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import type { UnitType } from '@/types/grocery';
import { units, getUnit, formatQuantityWithUnit } from '@/lib/units';
import { adjustQuantity, getAvailableUnitsForCategory } from '@/services/unit-resolver';

interface QuantityEditorProps {
  quantity: number;
  unit: UnitType;
  onQuantityChange: (quantity: number) => void;
  onUnitChange: (unit: UnitType) => void;
  categoryId?: string;
  compact?: boolean;
  disabled?: boolean;
}

export function QuantityEditor({
  quantity,
  unit,
  onQuantityChange,
  onUnitChange,
  categoryId,
  compact = false,
  disabled = false,
}: QuantityEditorProps) {
  const { language } = useTranslation();
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  // Local draft so the field can be cleared or hold "1." while typing a decimal
  const [draft, setDraft] = useState<string | null>(null);

  const availableUnits = categoryId
    ? getAvailableUnitsForCategory(categoryId)
    : (Object.keys(units) as UnitType[]);

  const handleIncrement = () => {
    setDraft(null);
    onQuantityChange(adjustQuantity(quantity, unit, 'up'));
  };

  const handleDecrement = () => {
    setDraft(null);
    onQuantityChange(adjustQuantity(quantity, unit, 'down'));
  };

  const unitData = getUnit(unit);
  const shortName = unitData.shortName[language];

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
        <span>{formatQuantityWithUnit(quantity, unit, language)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Quantity controls */}
      <div className="flex items-center bg-[var(--secondary)] rounded-xl">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-s-xl',
            'text-[var(--foreground)] hover:bg-[var(--accent)]',
            'transition-colors touch-target',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Decrease quantity"
        >
          <Minus size={18} />
        </button>
        
        <input
          type="number"
          inputMode="decimal"
          value={draft ?? quantity}
          onChange={(e) => {
            const raw = e.target.value;
            setDraft(raw);
            
            const val = parseFloat(raw);
            if (!isNaN(val) && val > 0) {
              onQuantityChange(val);
            }
          }}
          onBlur={() => {
            // Restore the last valid quantity if the field was left empty
            setDraft(null);
          }}
          disabled={disabled}
          aria-label="Quantity"
          className={cn(
            'w-14 h-10 text-center bg-transparent',
            'text-[var(--foreground)] font-medium',
            'focus:outline-none',
            disabled && 'opacity-50'
          )}
          min={unitData.minValue}
          step={unitData.step}
        />
        
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-e-xl',
            'text-[var(--foreground)] hover:bg-[var(--accent)]',
            'transition-colors touch-target',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Increase quantity"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Unit selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setShowUnitPicker(!showUnitPicker)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1 px-3 h-10',
            'bg-[var(--secondary)] rounded-xl',
            'text-sm font-medium text-[var(--foreground)]',
            'hover:bg-[var(--accent)] transition-colors',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span>{shortName}</span>
          <ChevronDown size={16} className={cn(showUnitPicker && 'rotate-180')} />
        </button>

        {showUnitPicker && (
          <div
            className="absolute top-full mt-1 end-0 z-50
              bg-[var(--card)] border border-[var(--border)]
              rounded-xl shadow-lg py-1 min-w-[120px]
              animate-scale-in"
          >
            {availableUnits.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  onUnitChange(u);
                  setShowUnitPicker(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-start text-sm',
                  'hover:bg-[var(--accent)] transition-colors',
                  u === unit && 'bg-[var(--accent)] font-medium'
                )}
              >
                {units[u].name[language]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Inline quantity display (read-only)
interface QuantityDisplayProps {
  quantity: number;
  unit: UnitType;
  className?: string;
  highlightMultiple?: boolean;
}

export function QuantityDisplay({ quantity, unit, className, highlightMultiple = true }: QuantityDisplayProps) {
  const { language } = useTranslation();
  
  const unitData = getUnit(unit);
  const shortName = unitData.shortName[language];
  
  // Format the number nicely
  const formattedQty = Number.isInteger(quantity) 
    ? quantity.toString() 
    : quantity.toFixed(1).replace(/\.0$/, '');
  
  // Determine if we should highlight (quantity > 1 for units, or > default minimum for weight)
  const shouldHighlight = highlightMultiple && (
    (unit === 'unit' && quantity > 1) ||
    (unit === 'kg' && quantity > 1) ||
    (unit === 'l' && quantity > 1) ||
    (unit === 'package' && quantity > 1) ||
    (unit === 'dozen' && quantity > 1) ||
    (unit === 'bunch' && quantity > 1) ||
    (unit === 'g' && quantity > 100) ||
    (unit === 'ml' && quantity > 100)
  );
  
  if (unit === 'unit') {
    return (
      <span className={cn('text-base text-[var(--muted-foreground)]', className)}>
        x
        <span className={shouldHighlight ? 'font-bold text-emerald-500' : ''}>
          {formattedQty}
        </span>
      </span>
    );
  }
  
  return (
    <span className={cn('text-base text-[var(--muted-foreground)]', className)}>
      <span className={shouldHighlight ? 'font-bold text-emerald-500' : ''}>
        {formattedQty}
      </span>
      {' '}{shortName}
    </span>
  );
}

