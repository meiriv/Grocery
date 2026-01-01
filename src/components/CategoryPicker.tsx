'use client';

import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useTranslation } from '@/hooks/useTranslation';
import * as Icons from 'lucide-react';

interface CategoryPickerProps {
  value: string;
  onChange: (categoryId: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
}

export function CategoryPicker({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  compact = false,
}: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { categories, getCategoryDisplayName } = useCategories();
  const { t, language } = useTranslation();

  const selectedCategory = categories.find(c => c.id === value);
  const displayPlaceholder = placeholder || t.list.category;

  // Get icon component by name
  const getIconComponent = (iconName?: string) => {
    if (!iconName) return null;
    const IconsMap = Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>;
    const IconComponent = IconsMap[iconName];
    return IconComponent ? <IconComponent size={16} /> : null;
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium',
          'transition-colors',
          selectedCategory?.color || 'bg-gray-500',
          'text-white',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {getIconComponent(selectedCategory?.icon)}
        <span>{selectedCategory?.name[language] || displayPlaceholder}</span>
        <ChevronDown size={12} className={cn(isOpen && 'rotate-180')} />
        
        {isOpen && (
          <div
            className="absolute top-full mt-1 start-0 z-50
              bg-[var(--card)] border border-[var(--border)]
              rounded-xl shadow-lg py-1 min-w-[160px]
              animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange(cat.id);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-start text-sm',
                  'text-[var(--foreground)]',
                  'hover:bg-[var(--accent)] transition-colors',
                  cat.id === value && 'bg-[var(--accent)]'
                )}
              >
                <span className={cn('w-3 h-3 rounded-full', cat.color)} />
                <span className="flex-1">{cat.name[language]}</span>
                {cat.id === value && <Check size={16} className="text-emerald-500" />}
              </button>
            ))}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            `w-full flex items-center justify-between gap-2
            px-4 py-3 rounded-xl
            bg-[var(--input)] border border-[var(--border)]
            text-[var(--foreground)]
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
            min-h-[48px]`,
            disabled && 'opacity-50 cursor-not-allowed',
            isOpen && 'ring-2 ring-emerald-500 border-transparent'
          )}
        >
          <span className="flex items-center gap-2">
            {selectedCategory && (
              <span className={cn('w-3 h-3 rounded-full', selectedCategory.color)} />
            )}
            {getIconComponent(selectedCategory?.icon)}
            <span className={!selectedCategory ? 'text-[var(--muted-foreground)]' : ''}>
              {selectedCategory?.name[language] || displayPlaceholder}
            </span>
          </span>
          <ChevronDown
            size={20}
            className={cn(
              'text-[var(--muted-foreground)] transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {isOpen && (
          <div
            className="absolute z-50 w-full mt-2 py-1
              bg-[var(--card)] border border-[var(--border)]
              rounded-xl shadow-lg
              max-h-60 overflow-y-auto
              animate-scale-in"
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange(cat.id);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-start',
                  'hover:bg-[var(--accent)] transition-colors',
                  cat.id === value && 'bg-[var(--accent)]'
                )}
              >
                <span className={cn('w-4 h-4 rounded-full flex-shrink-0', cat.color)} />
                {getIconComponent(cat.icon)}
                <span className="flex-1">{cat.name[language]}</span>
                {cat.id === value && (
                  <Check size={18} className="text-emerald-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Category badge (display only)
interface CategoryBadgeProps {
  categoryId: string;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

export function CategoryBadge({ categoryId, size = 'sm', onClick }: CategoryBadgeProps) {
  const { categories, getCategoryDisplayName } = useCategories();
  const category = categories.find(c => c.id === categoryId);

  if (!category) return null;

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium text-white',
        category.color,
        sizes[size],
        onClick && 'cursor-pointer hover:opacity-90'
      )}
    >
      {getCategoryDisplayName(categoryId)}
    </span>
  );
}

