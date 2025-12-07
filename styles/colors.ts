import { Theme } from '@/context/ThemeContext';

const darkColors = {
  background: {
    primary: "#131523",
    secondary: "#111",
    tertiary: "#1a1a1a",
    card: "#1A1D2F",
    cardSecondary: "#2A2E42",
  },

  text: {
    primary: "#fff",
    secondary: "#aaa",
    tertiary: "#777",
    inactive: "#555",
    muted: "#9DA3B4",
    light: "#8F95B2",
  },

  border: {
    light: "#333",
    medium: "#222",
    dark: "#1a1a1a",
    card: "#2A2E42",
  },

  action: {
    buy: "#10BA68",
    buyLight: "rgba(16, 186, 104, 0.15)",
    buyBorder: "rgba(16, 186, 104, 0.3)",
    sell: "#F9335D",
    sellLight: "rgba(249, 51, 93, 0.15)",
    sellBorder: "rgba(249, 51, 93, 0.3)",
    primary: "#0078FF",
    accent: "#6674CC",
  },

  ui: {
    highlight: "#0078FF",
    toggle: "#666",
    toggleBackground: "#333",
    chartLoader: "rgba(0, 0, 0, 0.7)",
    priceBoxBg: "rgba(0, 0, 0, 0.7)",
    buttonBg: "rgba(0, 0, 0, 0.5)",
    iconContainer: "#131523",
  },
};

const lightColors = {
  background: {
    primary: "#FFFFFF",
    secondary: "#F5F5F7",
    tertiary: "#E8E8ED",
    card: "#FFFFFF",
    cardSecondary: "#F5F5F7",
  },

  text: {
    primary: "#1D1D1F",
    secondary: "#6E6E73",
    tertiary: "#86868B",
    inactive: "#AEAEB2",
    muted: "#6E6E73",
    light: "#86868B",
  },

  border: {
    light: "#E5E5E7",
    medium: "#D2D2D7",
    dark: "#C7C7CC",
    card: "#E5E5E7",
  },

  action: {
    buy: "#10BA68",
    buyLight: "rgba(16, 186, 104, 0.15)",
    buyBorder: "rgba(16, 186, 104, 0.3)",
    sell: "#F9335D",
    sellLight: "rgba(249, 51, 93, 0.15)",
    sellBorder: "rgba(249, 51, 93, 0.3)",
    primary: "#0078FF",
    accent: "#6674CC",
  },

  ui: {
    highlight: "#0078FF",
    toggle: "#C7C7CC",
    toggleBackground: "#E5E5E7",
    chartLoader: "rgba(255, 255, 255, 0.9)",
    priceBoxBg: "rgba(255, 255, 255, 0.9)",
    buttonBg: "rgba(0, 0, 0, 0.05)",
    iconContainer: "#F5F5F7",
  },
};

export function getColors(theme: Theme = 'dark') {
  return theme === 'dark' ? darkColors : lightColors;
}

const colors = getColors('dark');
export default colors;

