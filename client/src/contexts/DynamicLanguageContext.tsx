import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Language, defaultLanguage, languages, LanguageConfig } from '@/config/languages';
import { en } from '@/config/languages/en';
import { hy } from '@/config/languages/hy';
import { ru } from '@/config/languages/ru';

interface DynamicLanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: LanguageConfig;
  availableLanguages: typeof languages;
  isLoading: boolean;
  overrideTranslations: (lang: Language, translations: any) => void;
}

const DynamicLanguageContext = createContext<DynamicLanguageContextType | undefined>(undefined);

// Default language configs
const defaultLanguageConfigs = {
  en,
  hy,
  ru
};

interface DynamicLanguageProviderProps {
  children: ReactNode;
  enableLiveEditing?: boolean;
}

export function DynamicLanguageProvider({ children, enableLiveEditing = false }: DynamicLanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(defaultLanguage);
  const [languageConfigs, setLanguageConfigs] = useState(defaultLanguageConfigs);

  // Fetch live translations if live editing is enabled
  const { data: liveTranslations, isLoading } = useQuery({
    queryKey: ['live-translations'],
    queryFn: async () => {
      const response = await fetch('/api/translations');
      if (!response.ok) throw new Error('Failed to fetch translations');
      return response.json();
    },
    enabled: enableLiveEditing,
    refetchInterval: enableLiveEditing ? 2000 : false, // Refetch every 2 seconds in edit mode
    staleTime: 0
  });

  // Update language configs when live translations change
  useEffect(() => {
    if (liveTranslations && enableLiveEditing) {
      setLanguageConfigs(liveTranslations);
    }
  }, [liveTranslations, enableLiveEditing]);

  // Get language from localStorage or use default
  useEffect(() => {
    if (typeof window !== 'undefined' && !enableLiveEditing) {
      const stored = localStorage.getItem('preferred-language') as Language;
      if (stored && stored in languages) {
        setCurrentLanguage(stored);
      }
    }
  }, [enableLiveEditing]);

  // Save language preference to localStorage (only when not in edit mode)
  useEffect(() => {
    if (typeof window !== 'undefined' && !enableLiveEditing) {
      localStorage.setItem('preferred-language', currentLanguage);
    }
  }, [currentLanguage, enableLiveEditing]);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
  };

  const overrideTranslations = (lang: Language, translations: any) => {
    setLanguageConfigs(prev => ({
      ...prev,
      [lang]: translations
    }));
  };

  const t = languageConfigs[currentLanguage];

  const value: DynamicLanguageContextType = {
    currentLanguage,
    setLanguage,
    t: t as LanguageConfig,
    availableLanguages: languages,
    isLoading: enableLiveEditing ? isLoading : false,
    overrideTranslations
  };

  return (
    <DynamicLanguageContext.Provider value={value}>
      {children}
    </DynamicLanguageContext.Provider>
  );
}

export function useDynamicLanguage() {
  const context = useContext(DynamicLanguageContext);
  if (context === undefined) {
    throw new Error('useDynamicLanguage must be used within a DynamicLanguageProvider');
  }
  return context;
}

// Hook for getting translations with fallback
export function useDynamicTranslation() {
  const { t, currentLanguage, isLoading } = useDynamicLanguage();
  
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
    translations: t,
    isLoading
  };
}
