import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, defaultLanguage, languages, LanguageConfig } from '@/config/languages';
import { en as staticEn } from '@/config/languages/en';
import { hy as staticHy } from '@/config/languages/hy';
import { ru as staticRu } from '@/config/languages/ru';

// ─── Static fallback (used ONLY when bootstrap explicitly failed) ─────────────
const staticTranslations = {
  en: staticEn as unknown as LanguageConfig,
  hy: staticHy as unknown as LanguageConfig,
  ru: staticRu as unknown as LanguageConfig,
};

// ─── Module-level merge helper ────────────────────────────────────────────────
// Called synchronously inside useState() initializer — must be module-level.
// Strategy: static keys are the base; DB values overwrite if non-empty.
function deepMerge(base: any, override: any): any {
  if (!override || typeof override !== 'object') return base;
  if (!base || typeof base !== 'object') return override;
  const result: any = { ...base };
  for (const key in override) {
    const v = override[key];
    if (v === null || v === undefined) continue; // keep static default for absent values only
    if (Array.isArray(v)) {
      result[key] = v.length > 0 ? v : base[key]; // only overwrite non-empty arrays
    } else if (typeof v === 'object') {
      result[key] = deepMerge(base[key] ?? {}, v);
    } else {
      result[key] = v;
    }
  }
  return result;
}

// ─── Build initial translations cache from bootstrap data ─────────────────────
// This runs ONCE synchronously inside the useState lazy initializer.
// By the time LanguageProvider mounts, App has already awaited /api/translations
// so prefetchedData is always the full DB payload — no flash possible.
function buildCacheFromPrefetch(prefetchedData: any): Record<Language, LanguageConfig> {
  if (prefetchedData && typeof prefetchedData === 'object') {
    if (import.meta.env.DEV) {
      console.log('[BOOT] LanguageContext: building initial cache from prefetched data');
    }
    return {
      en: deepMerge(staticEn, prefetchedData.en ?? {}),
      hy: deepMerge(staticHy, prefetchedData.hy ?? {}),
      ru: deepMerge(staticRu, prefetchedData.ru ?? {}),
    } as Record<Language, LanguageConfig>;
  }
  // Should never reach here in normal operation — bootstrap validates this.
  // BootstrapError screen would have shown instead.
  if (import.meta.env.DEV) {
    console.warn('[BOOT] LanguageContext: no prefetchedData — falling back to static (bootstrap should have blocked this)');
  }
  return staticTranslations;
}

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
  prefetchedData: any;      // Required — always provided by App after successful bootstrap
  initialLanguage: string;  // Resolved by bootstrap() before React mounts — no useState race
}

export function LanguageProvider({ children, prefetchedData, initialLanguage }: LanguageProviderProps) {
  // Language is resolved in bootstrap() (outside React) from localStorage.
  // Using it directly here means the very first render uses the correct language.
  const validatedLang: Language =
    initialLanguage in languages ? (initialLanguage as Language) : defaultLanguage;

  const [currentLanguage, setCurrentLanguage] = useState<Language>(validatedLang);

  // ─── Translations cache built synchronously — no async gap, no flash ──────
  // buildCacheFromPrefetch runs inside the lazy useState initializer, once.
  // All three languages are pre-merged with static fallbacks before first render.
  const [translationsCache, setTranslationsCache] = useState<Record<Language, LanguageConfig>>(
    () => buildCacheFromPrefetch(prefetchedData)
  );
  const [isLoading, setIsLoading] = useState(false);

  // ─── IMPORTANT: No useEffect that auto-fetches translations. ─────────────
  // All three languages (en, hy, ru) are pre-loaded in translationsCache from
  // bootstrap. Switching language is a pure synchronous operation — just changing
  // currentLanguage, which selects a different key from translationsCache.
  // fetchTranslations is ONLY called explicitly via refreshTranslations() (admin use).

  // Persist language preference whenever the user switches language.
  // (Read side is handled by bootstrap() before React mounts — no read here.)
  useEffect(() => {
    localStorage.setItem('preferred-language', currentLanguage);
  }, [currentLanguage]);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    // No fetch — all languages already loaded. t = translationsCache[language] instantly.
  };

  // ─── Deep-merge helper for fetchTranslations (admin refresh only) ─────────
  const deepMergeForRefresh = (base: any, override: any): any => deepMerge(base, override);

  // ─── Manual refresh — called only from admin panel or refreshTranslations() ─
  const fetchTranslations = async () => {
    if (import.meta.env.DEV) {
      console.log('[i18n] fetchTranslations called (explicit refresh)');
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/translations?_t=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data && typeof data === 'object' && ('en' in data || 'hy' in data || 'ru' in data)) {
        setTranslationsCache({
          en: deepMergeForRefresh(staticEn, data.en ?? {}) as LanguageConfig,
          hy: deepMergeForRefresh(staticHy, data.hy ?? {}) as LanguageConfig,
          ru: deepMergeForRefresh(staticRu, data.ru ?? {}) as LanguageConfig,
        });
        if (import.meta.env.DEV) {
          console.log('[i18n] translations refreshed from API');
        }
      }
    } catch (error) {
      console.error('[i18n] fetchTranslations failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTranslations = async () => { await fetchTranslations(); };

  // Optimistic update for admin panel inline edits
  const updateTranslationInCache = (key: string, value: string) => {
    setTranslationsCache(prev => {
      const updated = { ...prev };
      const keys = key.split('.');
      const langCopy = JSON.parse(JSON.stringify(updated[currentLanguage]));
      let current: any = langCopy;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      updated[currentLanguage] = langCopy;
      return updated;
    });
  };

  const t = translationsCache[currentLanguage] ?? ({} as LanguageConfig);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t: t as LanguageConfig,
    availableLanguages: languages,
    isLoading,
    refreshTranslations,
    updateTranslationInCache,
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

export function useTranslation() {
  const { t, currentLanguage } = useLanguage();
  const getTranslation = (key: string, fallback?: string): string => {
    const keys = key.split('.');
    let value: any = t;
    for (const k of keys) { value = value?.[k]; }
    return typeof value === 'string' ? value : (fallback ?? key);
  };
  return { t: getTranslation, currentLanguage, translations: t };
}
