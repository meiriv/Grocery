'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSettings, saveSettings, defaultSettings } from '@/services/storage';
import type { AppSettings } from '@/types/grocery';
import { isBrowser } from '@/lib/utils';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    if (!isBrowser()) return;
    
    const loaded = getSettings();
    setSettings(loaded);
    setIsLoading(false);
  }, []);

  // Apply theme
  useEffect(() => {
    if (!isBrowser()) return;
    
    const root = document.documentElement;
    
    if (settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', settings.theme === 'dark');
    }
  }, [settings.theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (!isBrowser() || settings.theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  
  return context;
}

// Hook for just the theme
export function useTheme() {
  const { settings, updateSettings } = useSettings();
  
  const setTheme = useCallback((theme: AppSettings['theme']) => {
    updateSettings({ theme });
  }, [updateSettings]);
  
  return {
    theme: settings.theme,
    setTheme,
    isDark: settings.theme === 'dark' || 
      (settings.theme === 'system' && 
        (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)),
  };
}

// Hook for AI settings
export function useAISettings() {
  const { settings, updateSettings } = useSettings();
  
  const setAIEnabled = useCallback((enabled: boolean) => {
    updateSettings({ aiEnabled: enabled });
  }, [updateSettings]);
  
  return {
    aiEnabled: settings.aiEnabled,
    hasApiKey: settings.hasApiKey,
    setAIEnabled,
  };
}

