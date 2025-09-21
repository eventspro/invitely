import { useLanguage as useLanguageContext, useTranslation } from '@/contexts/LanguageContext';

// Re-export for easier importing
export { useLanguageContext as useLanguage, useTranslation };

// Additional utility hooks
export function useCurrentLanguage() {
  const { currentLanguage } = useLanguageContext();
  return currentLanguage;
}

export function useLanguageSwitcher() {
  const { setLanguage, availableLanguages, currentLanguage } = useLanguageContext();
  
  const switchLanguage = (language: keyof typeof availableLanguages) => {
    setLanguage(language);
  };
  
  const getLanguageLabel = (language: keyof typeof availableLanguages) => {
    return availableLanguages[language];
  };
  
  return {
    switchLanguage,
    getLanguageLabel,
    currentLanguage,
    availableLanguages
  };
}

// Helper to get localized format for numbers, dates, etc.
export function useLocaleFormat() {
  const { currentLanguage } = useLanguageContext();
  
  const formatPrice = (amount: number, currency = 'AMD') => {
    // Format based on language
    switch (currentLanguage) {
      case 'hy':
        return `${amount.toLocaleString('hy-AM')} ${currency === 'AMD' ? 'դրամ' : currency}`;
      case 'ru':
        return `${amount.toLocaleString('ru-RU')} ${currency === 'AMD' ? 'драм' : currency}`;
      default:
        return `${amount.toLocaleString('en-US')} ${currency}`;
    }
  };
  
  const formatDate = (date: Date) => {
    switch (currentLanguage) {
      case 'hy':
        return date.toLocaleDateString('hy-AM');
      case 'ru':
        return date.toLocaleDateString('ru-RU');
      default:
        return date.toLocaleDateString('en-US');
    }
  };
  
  return {
    formatPrice,
    formatDate,
    currentLanguage
  };
}
