import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguageSwitcher } from '@/hooks/useLanguage';
import { Language } from '@/config/languages';

export default function LanguageSelector() {
  const { switchLanguage, getLanguageLabel, currentLanguage, availableLanguages } = useLanguageSwitcher();
  const [isOpen, setIsOpen] = useState(false);

  const languageFlags = {
    en: '🇺🇸',
    hy: '🇦🇲', 
    ru: '🇷🇺'
  };

  const handleLanguageChange = (language: Language) => {
    switchLanguage(language);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-lg">{languageFlags[currentLanguage]}</span>
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">
          {getLanguageLabel(currentLanguage)}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-2">
              {(Object.keys(availableLanguages) as Language[]).map((language) => (
                <button
                  key={language}
                  onClick={() => handleLanguageChange(language)}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    currentLanguage === language ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{languageFlags[language]}</span>
                  <span className="font-medium">{getLanguageLabel(language)}</span>
                  {currentLanguage === language && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}