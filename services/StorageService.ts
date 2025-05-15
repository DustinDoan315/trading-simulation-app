import { MMKV } from "react-native-mmkv";
import { Platform } from "react-native";

let storage: MMKV | null = null;

const getStorage = (): MMKV => {
  if (!storage) {
    storage = new MMKV();
  }
  return storage;
};

export const StorageService = {
  getItem: (key: string): string | null => {
    if (Platform.OS === "web" && typeof window === "undefined") {
      return null; // Server-side rendering
    }
    try {
      const value = getStorage().getString(key);
      return value ?? null;
    } catch (e) {
      console.warn("Storage access error:", e);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (Platform.OS === "web" && typeof window === "undefined") {
      return; // Server-side rendering
    }
    try {
      getStorage().set(key, value);
    } catch (e) {
      console.warn("Storage set error:", e);
    }
  },

  removeItem: (key: string): void => {
    if (Platform.OS === "web" && typeof window === "undefined") {
      return; // Server-side rendering
    }
    try {
      getStorage().delete(key);
    } catch (e) {
      console.warn("Storage delete error:", e);
    }
  },
};
