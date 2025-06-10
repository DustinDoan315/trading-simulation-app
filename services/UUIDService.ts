import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_UUID_KEY = "user_uuid";
const USER_BALANCE_KEY = "user_balance";
const INITIAL_BALANCE = "100000"; // $100k in cents to avoid floating point issues

class UUIDService {
  static async getOrCreateUser() {
    // Retrieve or create UUID
    let uuid = await SecureStore.getItemAsync(USER_UUID_KEY);
    if (!uuid) {
      uuid = Crypto.randomUUID();
      await SecureStore.setItemAsync(USER_UUID_KEY, uuid);

      // Initialize balance
      await AsyncStorage.setItem(USER_BALANCE_KEY, INITIAL_BALANCE);
    }
    return uuid;
  }

  static async getUserBalance() {
    const balance = await AsyncStorage.getItem(USER_BALANCE_KEY);
    return balance ? parseFloat(balance) : parseFloat(INITIAL_BALANCE);
  }

  static async updateUserBalance(newBalance: number) {
    await AsyncStorage.setItem(USER_BALANCE_KEY, newBalance.toString());
  }

  static async getUserPreferences() {
    return AsyncStorage.getItem("user_preferences");
  }

  static async updateUserPreferences(preferences: string) {
    await AsyncStorage.setItem("user_preferences", preferences);
  }
}

export default UUIDService;
