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

const staticLanguageConfigs = {
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
  const [languageConfigs, setLanguageConfigs] = useState(staticLanguageConfigs);
  const [isLoading, setIsLoading] = useState(true);

  // Load translations from API
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/api/translations/${currentLanguage}`);
        if (response.ok) {
          const data = await response.json();
          if (data.config) {
            // Deep merge API config with static config - API values override static
            setLanguageConfigs(prev => ({
              ...prev,
              [currentLanguage]: {
                ...staticLanguageConfigs[currentLanguage],
                ...data.config,
                hero: {
                  ...staticLanguageConfigs[currentLanguage].hero,
                  ...data.config.hero
                },
                features: {
                  ...staticLanguageConfigs[currentLanguage].features,
                  ...data.config.features
                },
                pricing: {
                  ...staticLanguageConfigs[currentLanguage].pricing,
                  ...data.config.pricing
                }
              }
            }));
          }
        }
      } catch (error) {
        console.log('Using static translations:', error);
        // Fall back to static configs if API fails
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [currentLanguage]);

  // Save language preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', currentLanguage);
    }
  }, [currentLanguage]);

  const setLanguage = (language: Language) => {
    setIsLoading(true);
    setCurrentLanguage(language);
  };

  const t = languageConfigs[currentLanguage];

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t: t as LanguageConfig,
    availableLanguages: languages
  };

  // Show loading spinner while fetching API translations on initial load
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-rose-500 border-r-transparent mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
