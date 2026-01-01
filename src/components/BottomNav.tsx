'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, FolderOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  labelKey: 'home' | 'favorites' | 'categories' | 'settings';
}

const navItems: NavItem[] = [
  { href: '/', icon: <Home size={24} />, labelKey: 'home' },
  { href: '/favorites', icon: <Heart size={24} />, labelKey: 'favorites' },
  { href: '/categories', icon: <FolderOpen size={24} />, labelKey: 'categories' },
  { href: '/settings', icon: <Settings size={24} />, labelKey: 'settings' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const labels = {
    home: t.home.title,
    favorites: t.favorites.title,
    categories: t.categories.title,
    settings: t.settings.title,
  };

  // Don't show nav on shopping mode
  if (pathname?.includes('/shopping')) {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1',
                'flex-1 h-full max-w-[25%]',
                'transition-colors',
                isActive
                  ? 'text-emerald-500'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              )}
            >
              {item.icon}
              <span className="text-xs font-medium whitespace-nowrap truncate max-w-full px-1">
                {labels[item.labelKey]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

