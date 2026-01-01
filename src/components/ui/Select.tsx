'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  error?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  label,
  disabled = false,
  error,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            `w-full flex items-center justify-between gap-2
            px-4 py-3 rounded-xl
            bg-[var(--input)] border border-[var(--border)]
            text-[var(--foreground)]
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
            min-h-[48px]`,
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-red-500',
            isOpen && 'ring-2 ring-emerald-500 border-transparent'
          )}
          disabled={disabled}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.icon}
            {selectedOption?.color && (
              <span
                className={cn('w-3 h-3 rounded-full', selectedOption.color)}
              />
            )}
            <span className={!selectedOption ? 'text-[var(--muted-foreground)]' : ''}>
              {selectedOption?.label || placeholder}
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
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  `w-full flex items-center gap-2 px-4 py-3
                  text-start transition-colors
                  hover:bg-[var(--accent)]`,
                  option.value === value && 'bg-[var(--accent)]'
                )}
              >
                {option.icon}
                {option.color && (
                  <span className={cn('w-3 h-3 rounded-full', option.color)} />
                )}
                <span className="flex-1 truncate">{option.label}</span>
                {option.value === value && (
                  <Check size={18} className="text-emerald-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
}

// Color picker as a select variant
interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  colors: Array<{ id: string; class: string; name: string }>;
  label?: string;
}

export function ColorPicker({ value, onChange, colors, label }: ColorPickerProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {colors.map(color => (
          <button
            key={color.id}
            type="button"
            onClick={() => onChange(color.class)}
            className={cn(
              'w-10 h-10 rounded-xl transition-all',
              color.class,
              value === color.class
                ? 'ring-2 ring-offset-2 ring-offset-[var(--background)] ring-white scale-110'
                : 'hover:scale-105'
            )}
            title={color.name}
          >
            {value === color.class && (
              <Check size={20} className="text-white mx-auto" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

