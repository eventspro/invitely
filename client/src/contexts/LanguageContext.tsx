import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, defaultLanguage, languages, LanguageConfig } from '@/config/languages';
import { en } from '@/config/languages/en';
import { hy } from '@/config/languages/hy';
import { ru } from '@/config/languages/ru';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: LanguageConfig;
  availableLanguages: typeof languages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const languageConfigs = {
  en,
  hy,
  ru
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Get language from localStorage or use default
  const getStoredLanguage = (): Language => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('preferred-language') as Language;
      if (stored && stored in languages) {
        return stored;
      }
    }
    return defaultLanguage;
  };

  const [currentLanguage, setCurrentLanguage] = useState<Language>(getStoredLanguage);

  // Save language preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', currentLanguage);
    }
  }, [currentLanguage]);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
  };

  const t = languageConfigs[currentLanguage];

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    availableLanguages: languages
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook for getting translations with fallback
export function useTranslation() {
  const { t, currentLanguage } = useLanguage();
  
  // Helper function to get nested translations
  const getTranslation = (key: string, fallback?: string): string => {
    const keys = key.split('.');
    let value: any = t;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    // Return fallback or key if translation not found
    return fallback || key;
  };
  
  return {
    t: getTranslation,
    currentLanguage,
    translations: t
  };
}
