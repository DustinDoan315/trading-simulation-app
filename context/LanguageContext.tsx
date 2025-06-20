import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("@language");
        if (
          savedLanguage &&
          (savedLanguage === "en" || savedLanguage === "vi")
        ) {
          setLanguage(savedLanguage as Language);
        }
      } catch (e) {
        console.error("Failed to load language", e);
      }
    };
    loadLanguage();
  }, []);

  const updateLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem("@language", lang);
      setLanguage(lang);
    } catch (e) {
      console.error("Failed to save language", e);
    }
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key; // Return key if translation not found
    }

    return value || key;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: updateLanguage, t }}>
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
