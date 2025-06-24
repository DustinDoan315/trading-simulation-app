import React, { createContext, useContext, ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setLanguage } from "@/features/languageSlice";
import enTranslations from "../translations/en.json";
import viTranslations from "../translations/vi.json";

type Translations = typeof enTranslations;
type Language = "en" | "vi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
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

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[currentLanguage];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key; // Return key if translation not found
    }

    return value || key;
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
