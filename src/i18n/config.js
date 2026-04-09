import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import latinTranslations from './locales/latin.json';
import russianTranslations from './locales/russian.json';
import cyrillicTranslations from './locales/cyrillic.json';

const resources = {
  latin: {
    translation: latinTranslations
  },
  russian: {
    translation: russianTranslations
  },
  cyrillic: {
    translation: cyrillicTranslations
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'latin',
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
      lookupLocalStorage: 'i18nextLng',
      lookupCookie: 'i18next'
    }
  });

export default i18n;
