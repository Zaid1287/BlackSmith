import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations, TranslationKeys } from '@/i18n/translations';

// Define supported locales and currencies - limited to English, Hindi, and Telugu as per request
export type LocaleOption = 'en-IN' | 'hi-IN' | 'te-IN';
export type CurrencyOption = 'INR';

// Map locale to currency - all use INR
const localeToCurrency: Record<LocaleOption, CurrencyOption> = {
  'en-IN': 'INR',
  'hi-IN': 'INR',
  'te-IN': 'INR',
};

// Locale display names
export const localeNames: Record<LocaleOption, string> = {
  'en-IN': 'English',
  'hi-IN': 'हिन्दी (Hindi)',
  'te-IN': 'తెలుగు (Telugu)',
};

// Currency symbols - only INR needed
export const currencySymbols: Record<CurrencyOption, string> = {
  'INR': '₹',
};

// Interface for the context
interface LocaleContextType {
  locale: LocaleOption;
  currency: CurrencyOption;
  setLocale: (locale: LocaleOption) => void;
  formatCurrency: (amount: number | null) => string;
  t: <T extends keyof TranslationKeys>(
    section: T,
    key: keyof TranslationKeys[T]
  ) => string;
}

// Create the context
const LocaleContext = createContext<LocaleContextType | null>(null);

// Get stored locale from localStorage or default to English
const getInitialLocale = (): LocaleOption => {
  const savedLocale = localStorage.getItem('locale');
  if (savedLocale && (savedLocale === 'en-IN' || savedLocale === 'hi-IN' || savedLocale === 'te-IN')) {
    return savedLocale;
  }
  return 'en-IN';
};

// Provider component
export function LocaleProvider({ children }: { children: ReactNode }) {
  // Use stored locale or default to Indian English
  const [locale, setLocaleState] = useState<LocaleOption>(getInitialLocale());
  const [currency, setCurrency] = useState<CurrencyOption>('INR');

  // Set locale with side effect to save it
  const setLocale = (newLocale: LocaleOption) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  // Update currency when locale changes
  useEffect(() => {
    setCurrency(localeToCurrency[locale]);
    // Set HTML lang attribute
    document.documentElement.lang = locale.split('-')[0]; // Just the language part
  }, [locale]);

  // Translation function
  const t = <T extends keyof TranslationKeys>(
    section: T,
    key: keyof TranslationKeys[T]
  ): string => {
    const translation = translations[locale];
    // Type assertion to ensure type safety
    const sectionContent = translation[section] as Record<string, string>;
    
    if (!translation || !sectionContent || !sectionContent[key as string]) {
      // Fallback to English if translation not found
      const fallback = translations['en-IN'];
      const fallbackSection = fallback[section] as Record<string, string>;
      return fallbackSection?.[key as string] || `${String(section)}.${String(key)}`;
    }
    return sectionContent[key as string];
  };

  // Currency formatter function
  const formatCurrency = (amount: number | null): string => {
    if (amount === null) return `${currencySymbols[currency]}0.00`;
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <LocaleContext.Provider value={{ locale, currency, setLocale, formatCurrency, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

// Hook for using the locale context
export function useLocale() {
  const context = useContext(LocaleContext);
  
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  
  return context;
}