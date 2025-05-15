import { create } from "zustand";
import { StorageService } from "../services/StorageService";

interface SearchHistoryState {
  history: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  removeFromHistory: (index: number) => void;
  _saveToStorage: () => void;
}

export const useSearchHistoryStore = create<SearchHistoryState>((set, get) => ({
  history: JSON.parse(StorageService.getItem("searchHistory") || "[]"),
  addToHistory: (query: string) =>
    set((state) => {
      const newHistory = [
        query,
        ...state.history.filter((q) => q !== query),
      ].slice(0, 10);
      StorageService.setItem("searchHistory", JSON.stringify(newHistory));
      return { history: newHistory };
    }),
  clearHistory: () => {
    StorageService.setItem("searchHistory", JSON.stringify([]));
    set({ history: [] });
  },
  removeFromHistory: (index: number) =>
    set((state) => {
      const newHistory = state.history.filter((_, i) => i !== index);
      StorageService.setItem("searchHistory", JSON.stringify(newHistory));
      return { history: newHistory };
    }),
  _saveToStorage: () => {
    StorageService.setItem("searchHistory", JSON.stringify(get().history));
  },
}));
