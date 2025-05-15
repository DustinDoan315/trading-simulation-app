import { create } from "zustand";
import { StorageService } from "../services/StorageService";

interface FavoritesState {
  favorites: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (id: string) => void;
  _saveToStorage: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: JSON.parse(StorageService.getItem("favorites") || "[]"),
  addFavorite: (id: string) =>
    set((state) => {
      const newFavorites = [...state.favorites, id];
      StorageService.setItem("favorites", JSON.stringify(newFavorites));
      return { favorites: newFavorites };
    }),
  removeFavorite: (id: string) =>
    set((state) => {
      const newFavorites = state.favorites.filter((favId) => favId !== id);
      StorageService.setItem("favorites", JSON.stringify(newFavorites));
      return { favorites: newFavorites };
    }),
  toggleFavorite: (id: string) =>
    set((state) => {
      const newFavorites = state.favorites.includes(id)
        ? state.favorites.filter((favId) => favId !== id)
        : [...state.favorites, id];
      StorageService.setItem("favorites", JSON.stringify(newFavorites));
      return { favorites: newFavorites };
    }),
  _saveToStorage: () => {
    StorageService.setItem("favorites", JSON.stringify(get().favorites));
  },
}));
