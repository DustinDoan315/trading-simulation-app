import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

interface SecureStorage {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  deleteItem: (key: string) => Promise<void>;
}

const PREFIX = Constants.expoConfig?.extra?.SECURE_STORE_PREFIX || "";

const secureStorage: SecureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(`${PREFIX}${key}`, value);
    } catch (error) {
      console.error("SecureStorage setItem error:", error);
      throw error;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(`${PREFIX}${key}`);
    } catch (error) {
      console.error("SecureStorage getItem error:", error);
      return null;
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`${PREFIX}${key}`);
    } catch (error) {
      console.error("SecureStorage deleteItem error:", error);
      throw error;
    }
  },
};

export default secureStorage;
