// Enhanced UUIDService.ts
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./SupabaseService";
import { DatabaseService } from "./DatabaseService";

const USER_UUID_KEY = "user_uuid";
const USER_PROFILE_KEY = "user_profile";
const SYNC_STATUS_KEY = "sync_status";

class UUIDService {
  static async getOrCreateUser() {
    let uuid = await SecureStore.getItemAsync(USER_UUID_KEY);

    if (!uuid) {
      uuid = Crypto.randomUUID();
      await SecureStore.setItemAsync(USER_UUID_KEY, uuid);

      // Initialize user profile
      const userProfile = {
        uuid,
        balance: "100000",
        createdAt: new Date().toISOString(),
        lastSyncAt: null,
      };

      // Save locally to SQLite (persistent)
      await DatabaseService.createOrUpdateUser({
        uuid,
        balance: userProfile.balance,
        createdAt: new Date(userProfile.createdAt),
      });

      // Save to AsyncStorage (cache)
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));

      // Save to cloud with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          await this.syncUserToCloud(userProfile);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            console.error(
              "Failed to sync user to cloud after 3 attempts:",
              error
            );
          } else {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (4 - retries))
            );
          }
        }
      }
    }

    return uuid;
  }

  static async syncUserToCloud(userProfile: any) {
    try {
      // Create user in Supabase using the device UUID
      const { data, error } = await supabase.from("users").upsert({
        uuid: userProfile.uuid,
        balance: userProfile.balance,
        created_at: userProfile.createdAt,
      });

      if (!error) {
        // Update sync status
        await AsyncStorage.setItem(
          SYNC_STATUS_KEY,
          JSON.stringify({
            lastSyncAt: new Date().toISOString(),
            status: "synced",
          })
        );
      }
    } catch (error) {
      console.error("Failed to sync user to cloud:", error);
      // Store sync status as failed
      await AsyncStorage.setItem(
        SYNC_STATUS_KEY,
        JSON.stringify({
          lastSyncAt: new Date().toISOString(),
          status: "failed",
        })
      );
    }
  }
}

export default UUIDService;
