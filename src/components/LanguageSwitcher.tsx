'use client';

import React, { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { languageConfig, type Language } from '@/i18n';

interface LanguageSwitcherProps {
  variant?: 'button' | 'dropdown' | 'inline';
}

export function LanguageSwitcher({ variant = 'button' }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages: Array<{ code: Language; name: string; nativeName: string }> = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  ];

  const currentLang = languages.find((l) => l.code === language);

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              language === lang.code
                ? 'bg-emerald-500 text-white'
                : 'bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)]'
            )}
          >
            {lang.nativeName}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-[var(--secondary)] text-[var(--foreground)]',
            'hover:bg-[var(--accent)] transition-colors'
          )}
        >
          <Globe size={18} />
          <span>{currentLang?.nativeName}</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div
              className="absolute top-full mt-2 end-0 z-50
                bg-[var(--card)] border border-[var(--border)]
                rounded-xl shadow-lg py-1 min-w-[140px]
                animate-scale-in"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-2.5 text-start',
                    'hover:bg-[var(--accent)] transition-colors',
                    language === lang.code && 'bg-[var(--accent)]'
                  )}
                >
                  <span className="flex-1">{lang.nativeName}</span>
                  {language === lang.code && (
                    <Check size={16} className="text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Default button variant - toggles between languages
  const nextLang = language === 'en' ? 'he' : 'en';
  const nextLangData = languages.find((l) => l.code === nextLang);

  return (
    <button
      onClick={() => setLanguage(nextLang)}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-[var(--secondary)] text-[var(--foreground)]',
        'hover:bg-[var(--accent)] transition-colors',
        'touch-target'
      )}
      aria-label={`Switch to ${nextLangData?.name}`}
    >
      <Globe size={18} />
      <span className="text-sm font-medium">{nextLangData?.nativeName}</span>
    </button>
  );
}

