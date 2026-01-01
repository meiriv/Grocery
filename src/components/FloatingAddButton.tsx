'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingAddButtonProps {
  onClick: () => void;
  label?: string;
}

export function FloatingAddButton({ onClick, label = 'Add' }: FloatingAddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fab"
      aria-label={label}
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
}

// Extended FAB with label
interface ExtendedFABProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export function ExtendedFAB({ onClick, icon, label }: ExtendedFABProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        `fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)]
        flex items-center gap-2 px-5 py-3
        bg-emerald-500 text-white
        rounded-full shadow-lg
        font-semibold
        transition-all duration-200
        hover:bg-emerald-600 hover:shadow-xl
        active:scale-95
        z-50`,
        '[dir="ltr"] &:right-4',
        '[dir="rtl"] &:left-4'
      )}
      style={{
        right: 'var(--fab-position, 1rem)',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

