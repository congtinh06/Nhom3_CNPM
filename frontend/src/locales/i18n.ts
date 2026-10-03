import { usePreferences, AppLanguage } from '../context/PreferencesContext';
import vi from './vi.json';
import en from './en.json';
import ja from './ja.json';
import ko from './ko.json';
import zh from './zh.json';

export type TranslationSchema = typeof vi;

export const translations: Record<AppLanguage, TranslationSchema> = {
  vi,
  en: en as unknown as TranslationSchema,
  ja: ja as unknown as TranslationSchema,
  ko: ko as unknown as TranslationSchema,
  zh: zh as unknown as TranslationSchema,
};

export const getTranslation = (lang: AppLanguage): TranslationSchema => {
  return translations[lang] || translations.vi;
};

export const useTranslation = () => {
  const { language, setLanguage } = usePreferences();
  const t = getTranslation(language);

  return {
    t,
    language,
    setLanguage,
  };
};
