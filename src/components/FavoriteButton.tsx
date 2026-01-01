'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { cn, vibrate } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  disabled?: boolean;
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  size = 'md',
  showLabel = false,
  disabled = false,
}: FavoriteButtonProps) {
  const { t } = useTranslation();

  const sizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled) {
      vibrate(10);
      onToggle();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled) {
      vibrate(10);
      onToggle();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      className={cn(
        'touch-target flex items-center gap-1.5',
        'transition-all duration-200',
        'hover:scale-110 active:scale-95',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={isFavorite ? t.favorites.removeFromFavorites : t.favorites.addToFavorites}
      title={isFavorite ? t.favorites.removeFromFavorites : t.favorites.addToFavorites}
    >
      <Heart
        size={sizes[size]}
        className={cn(
          'transition-all duration-200',
          isFavorite
            ? 'fill-red-500 text-red-500'
            : 'text-[var(--muted-foreground)] hover:text-red-400'
        )}
      />
      {showLabel && (
        <span className="text-sm text-[var(--muted-foreground)]">
          {isFavorite ? t.favorites.removeFromFavorites : t.favorites.addToFavorites}
        </span>
      )}
    </button>
  );
}

