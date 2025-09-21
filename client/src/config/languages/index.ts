export { en } from './en';
export { hy } from './hy';
export { ru } from './ru';
export type { LanguageConfig } from './en';

export const languages = {
  en: 'English',
  hy: 'Հայերեն',
  ru: 'Русский'
};

export const defaultLanguage = 'en';
export type Language = keyof typeof languages;