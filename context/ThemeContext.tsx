import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

export type ThemeMode = "light" | "dark" | "system";
export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@theme_mode";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isInitialized, setIsInitialized] = useState(false);

  const theme: Theme =
    themeMode === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;

  const isDark = theme === "dark";

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (
          savedTheme &&
          (savedTheme === "light" ||
            savedTheme === "dark" ||
            savedTheme === "system")
        ) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error("Error loading theme preference:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    if (themeMode === "system" && isInitialized) {
    }
  }, [systemColorScheme, themeMode, isInitialized]);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
