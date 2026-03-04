import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, defaultLanguage, languages, LanguageConfig } from '@/config/languages';
import { en as staticEn } from '@/config/languages/en';
import { hy as staticHy } from '@/config/languages/hy';
import { ru as staticRu } from '@/config/languages/ru';

// Pre-loaded static translations — available instantly on first render.
// API translations merge in later, upgrading DB-managed strings transparently.
const staticTranslations = {
  en: staticEn as unknown as LanguageConfig,
  hy: staticHy as unknown as LanguageConfig,
  ru: staticRu as unknown as LanguageConfig,
};

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
  // Initialize with static translations so the page renders correctly from
  // the very first frame — no empty-object crash, no blocking spinner.
  const [translationsCache, setTranslationsCache] = useState<Record<Language, LanguageConfig>>(staticTranslations);
  // isLoading starts false because content is immediately available.
  // It briefly flips true while API translations are fetching, but nothing
  // in the UI blocks on it anymore.
  const [isLoading, setIsLoading] = useState(false);

  // Deep-merge static config into DB data: DB values win, but missing keys fall back to static
  const deepMergeStatic = (staticObj: any, dbObj: any): any => {
    if (!dbObj || typeof dbObj !== 'object') return staticObj;
    if (!staticObj || typeof staticObj !== 'object') return dbObj;
    const result = { ...staticObj };
    for (const key in dbObj) {
      if (dbObj[key] !== null && typeof dbObj[key] === 'object' && !Array.isArray(dbObj[key])) {
        result[key] = deepMergeStatic(staticObj[key] || {}, dbObj[key]);
      } else if (Array.isArray(dbObj[key]) && dbObj[key].length > 0) {
        result[key] = dbObj[key];
      } else if (dbObj[key] !== undefined && dbObj[key] !== '') {
        result[key] = dbObj[key];
      }
      // if dbObj[key] is '' or undefined, keep staticObj[key] as default
    }
    return result;
  };

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
        // Always deep-merge static files so new keys are available even before DB is updated
        const { en: staticEn } = await import('@/config/languages/en');
        const { hy: staticHy } = await import('@/config/languages/hy');
        const { ru: staticRu } = await import('@/config/languages/ru');
        const merged = {
          en: deepMergeStatic(staticEn, data.en || {}),
          hy: deepMergeStatic(staticHy as any, data.hy || {}),
          ru: deepMergeStatic(staticRu as any, data.ru || {}),
        };
        setTranslationsCache(merged as any);
        console.log('✅ Translations loaded from API and merged with static defaults');
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
  }, [currentLanguage]);

  // Save language preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', currentLanguage);
    }
  }, [currentLanguage]);

  const setLanguage = (language: Language) => {
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

  // Do NOT render a blocking spinner here — the TypingLoader in App.tsx already
  // covers the initial load window. Translations hydrate silently into the UI
  // once the API responds; children render immediately with fallback strings.
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
