import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
}

// Create the context
const LocaleContext = createContext<LocaleContextType | null>(null);

// Provider component
export function LocaleProvider({ children }: { children: ReactNode }) {
  // Default to Indian locale
  const [locale, setLocale] = useState<LocaleOption>('en-IN');
  const [currency, setCurrency] = useState<CurrencyOption>('INR');

  // Update currency when locale changes
  useEffect(() => {
    setCurrency(localeToCurrency[locale]);
  }, [locale]);

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
    <LocaleContext.Provider value={{ locale, currency, setLocale, formatCurrency }}>
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