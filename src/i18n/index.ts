import { en, TranslationKeys } from './en';
import { he } from './he';

export type Language = 'en' | 'he';

export const translations: Record<Language, TranslationKeys> = {
  en,
  he,
};

export const languageConfig: Record<Language, { name: string; dir: 'ltr' | 'rtl'; nativeName: string }> = {
  en: { name: 'English', dir: 'ltr', nativeName: 'English' },
  he: { name: 'Hebrew', dir: 'rtl', nativeName: 'עברית' },
};

export function getTranslation(language: Language): TranslationKeys {
  return translations[language] || translations.en;
}

export function getDirection(language: Language): 'ltr' | 'rtl' {
  return languageConfig[language]?.dir || 'ltr';
}

// Helper to interpolate variables in translation strings
export function interpolate(str: string, params: Record<string, string | number>): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] ?? `{{${key}}}`));
}

export { en, he };
export type { TranslationKeys };

