import enTranslations from '../translations/en.json';
import React, { createContext, ReactNode, useContext } from 'react';
import viTranslations from '../translations/vi.json';
import { setLanguage } from '@/features/languageSlice';
import { useAppDispatch, useAppSelector } from '@/store';


type Translations = typeof enTranslations;
type Language = "en" | "vi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const translations: Record<Language, Translations> = {
  en: enTranslations,
  vi: viTranslations,
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector(
    (state) => state.language.currentLanguage
  );

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let value: any = translations[currentLanguage];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }

    let result = value || key;

    if (params && typeof result === "string") {
      Object.keys(params).forEach((paramKey) => {
        const regex = new RegExp(`{${paramKey}}`, "g");
        result = result.replace(regex, String(params[paramKey]));
      });
    }

    return result;
  };

  return (
    <LanguageContext.Provider
      value={{
        language: currentLanguage,
        setLanguage: (lang) => dispatch(setLanguage(lang)),
        t,
      }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
