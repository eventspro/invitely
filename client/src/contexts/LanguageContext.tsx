import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, defaultLanguage, languages, LanguageConfig } from '@/config/languages';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: LanguageConfig;
  availableLanguages: typeof languages;
  isLoading: boolean;
  refreshTranslations: () => Promise<void>;
  updateTranslationInCache: (key: string, value: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

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
  const [translationsCache, setTranslationsCache] = useState<Record<Language, LanguageConfig>>({
    en: {} as LanguageConfig,
    hy: {} as LanguageConfig,
    ru: {} as LanguageConfig
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch translations from backend API
  const fetchTranslations = async () => {
    console.log('🔄 fetchTranslations started - setting isLoading to true');
    setIsLoading(true);
    try {
      // Add cache-busting timestamp to force fresh data
      const timestamp = new Date().getTime();
      console.log('📡 Fetching from /api/translations...');
      const response = await fetch(`/api/translations?_t=${timestamp}`);
      console.log('📡 Response received:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch translations: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Data parsed. Type:', typeof data, 'Has en:', 'en' in (data || {}), 'Has hy:', 'hy' in (data || {}), 'Has ru:', 'ru' in (data || {}));
      
      // Validate that data has the expected structure
      if (data && typeof data === 'object' && ('en' in data || 'hy' in data || 'ru' in data)) {
        setTranslationsCache(data);
        console.log('✅ Translations loaded from API and cached');
      } else {
        console.warn('⚠️ Invalid translation data structure, using fallback');
        throw new Error('Invalid data structure');
      }
    } catch (error) {
      console.error('❌ Failed to load translations from API:', error);
      // Fallback to static imports only if API fails
      try {
        const { en } = await import('@/config/languages/en');
        const { hy } = await import('@/config/languages/hy');
        const { ru } = await import('@/config/languages/ru');
        setTranslationsCache({ en: en as any, hy: hy as any, ru: ru as any });
        console.log('✅ Translations loaded from fallback files');
      } catch (fallbackError) {
        console.error('❌ Failed to load fallback translations:', fallbackError);
      }
    } finally {
      console.log('✅ fetchTranslations complete - setting isLoading to false');
      setIsLoading(false);
    }
  };

  // Load translations on mount
  useEffect(() => {
    fetchTranslations();
  }, []);

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

  // Optimistic update for immediate UI feedback
  const updateTranslationInCache = (key: string, value: string) => {
    setTranslationsCache(prev => {
      const updated = { ...prev };
      const keys = key.split('.');
      
      // Deep clone the current language translations
      const langCopy = JSON.parse(JSON.stringify(updated[currentLanguage]));
      let current: any = langCopy;
      
      // Navigate to the nested property
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      // Update the final value
      current[keys[keys.length - 1]] = value;
      
      // Update the cache with the modified copy
      updated[currentLanguage] = langCopy;
      
      return updated;
    });
  };

  const refreshTranslations = async () => {
    await fetchTranslations();
  };

  const t = translationsCache[currentLanguage] || ({} as LanguageConfig);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t: t as LanguageConfig,
    availableLanguages: languages,
    isLoading,
    refreshTranslations,
    updateTranslationInCache
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
