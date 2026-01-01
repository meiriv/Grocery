'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
}: ToggleProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          `relative w-12 h-7 rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[var(--background)]`,
          checked ? 'bg-emerald-500' : 'bg-[var(--secondary)]'
        )}
      >
        <span
          className={cn(
            `absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md
            transition-transform duration-200 ease-in-out`,
            checked && 'translate-x-5'
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-[var(--foreground)]">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-[var(--muted-foreground)]">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}

// Checkbox variant
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  indeterminate = false,
}: CheckboxProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 cursor-pointer touch-target',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          `w-6 h-6 rounded-lg border-2 
          flex items-center justify-center
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[var(--background)]`,
          checked || indeterminate
            ? 'bg-emerald-500 border-emerald-500'
            : 'bg-transparent border-[var(--border)]'
        )}
      >
        {checked && (
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        {indeterminate && !checked && (
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12h14"
            />
          </svg>
        )}
      </button>
      {label && (
        <span className="text-sm text-[var(--foreground)]">{label}</span>
      )}
    </label>
  );
}

// Radio button
interface RadioProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  name?: string;
}

export function Radio({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  name,
}: RadioProps) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 cursor-pointer touch-target py-1',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange()}
        className={cn(
          `w-6 h-6 rounded-full border-2 
          flex items-center justify-center flex-shrink-0
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[var(--background)]`,
          checked
            ? 'border-emerald-500'
            : 'border-[var(--border)]'
        )}
      >
        {checked && (
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
        )}
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-[var(--foreground)]">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-[var(--muted-foreground)]">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}

