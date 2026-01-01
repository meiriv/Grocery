'use client';

import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useSettings } from './useSettings';
import { translations, getDirection, interpolate, type Language, type TranslationKeys } from '@/i18n';
import { isBrowser } from '@/lib/utils';

interface TranslationContextType {
  t: TranslationKeys;
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
  interpolate: (str: string, params: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings, isLoading } = useSettings();
  const language = settings.language;
  const dir = getDirection(language);
  const t = translations[language];

  // Update document direction and language
  useEffect(() => {
    if (!isBrowser()) return;
    
    const html = document.documentElement;
    html.setAttribute('dir', dir);
    html.setAttribute('lang', language);
  }, [language, dir]);

  const setLanguage = useCallback((lang: Language) => {
    updateSettings({ language: lang });
  }, [updateSettings]);

  const value: TranslationContextType = {
    t,
    language,
    setLanguage,
    dir,
    isRTL: dir === 'rtl',
    interpolate,
  };

  // Don't render until settings are loaded to prevent hydration mismatch
  if (isLoading) {
    return null;
  }

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation(): TranslationContextType {
  const context = useContext(TranslationContext);
  
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  
  return context;
}

// Hook for just getting translated text
export function useT() {
  const { t, interpolate: interp } = useTranslation();
  
  return {
    t,
    // Helper to interpolate variables
    tx: (str: string, params: Record<string, string | number>) => interp(str, params),
  };
}

// Hook for RTL-aware styling
export function useRTL() {
  const { isRTL, dir } = useTranslation();
  
  return {
    isRTL,
    dir,
    // Helper classes for RTL-aware positioning
    start: isRTL ? 'right' : 'left',
    end: isRTL ? 'left' : 'right',
    // Transform direction for icons
    flipIcon: isRTL ? 'scale-x-[-1]' : '',
  };
}

