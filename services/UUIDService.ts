import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AsyncStorageService } from "./AsyncStorageService";
import { getDeviceUUID } from "@/utils/deviceUtils";
import { UserSyncService } from "./UserSyncService";

// Enhanced UUIDService.ts

const USER_UUID_KEY = "user_uuid_13";
const USER_PROFILE_KEY = "user_profile";
const SYNC_STATUS_KEY = "sync_status";

class UUIDService {
  static async getOrCreateUser() {
    let uuid = await SecureStore.getItemAsync(USER_UUID_KEY);
    console.log("====================================");
    console.log("Fetching or creating user UUID...", uuid);
    console.log("====================================");
    if (!uuid) {
      uuid = await getDeviceUUID();
      await SecureStore.setItemAsync(USER_UUID_KEY, uuid);

      // Initialize user profile with proper timestamp format
      const now = new Date().toISOString();
      const userProfile = {
        id: uuid,
        username: `user_${uuid.slice(0, 8)}`,
        usdt_balance: "100000",
        total_portfolio_value: "100000",
        initial_balance: "100000",
        total_pnl: "0.00",
        total_trades: 0,
        win_rate: "0.00",
        join_date: now,
        last_active: now,
        created_at: now,
        updated_at: now,
      };

      // Save locally to AsyncStorage (persistent)
      await AsyncStorageService.createOrUpdateUser(userProfile);

      // Save to AsyncStorage (cache)
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));

      console.log("====================================");
      console.log("Created new user UUID:", uuid);
      // Save to cloud with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          console.log("====================================");
          console.log("Syncing user to cloud:", userProfile);
          console.log("====================================");
          const syncResult = await UserSyncService.syncUserToCloud(userProfile);
          if (syncResult.success) {
            console.log("✅ User successfully synced to cloud");
            break;
          } else {
            throw new Error(syncResult.error);
          }
        } catch (error) {
          retries--;
          console.error(`User sync attempt ${4 - retries} failed:`, error);
          if (retries === 0) {
            console.error(
              "Failed to sync user to cloud after 3 attempts:",
              error
            );
            // Don't throw here - user can still use the app locally
          } else {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (4 - retries))
            );
          }
        }
      }
    } else {
      // User exists, ensure they're synced to Supabase
      try {
        const userProfileStr = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (userProfileStr) {
          const userProfile = JSON.parse(userProfileStr);
          // Check if user exists in Supabase
          const { exists, error } = await UserSyncService.checkUserExists(uuid);

          if (error) {
            console.warn("Error checking user existence:", error);
          } else if (!exists) {
            console.log("User not found in Supabase, syncing...");
            await UserSyncService.syncUserToCloud(userProfile);
          }
        }
      } catch (error) {
        console.warn("Failed to verify user sync status:", error);
      }
    }

    return uuid;
  }

  // Helper method for cleaner sync status management
  private static async updateSyncStatus(
    status: "synced" | "failed",
    error?: string
  ) {
    const syncStatus = {
      lastSyncAt: Math.floor(new Date().getTime() / 1000),
      status,
      ...(error && { lastError: error }),
    };

    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
  }

  // New method to ensure user exists in Supabase before portfolio sync
  static async ensureUserInSupabase(uuid: string): Promise<boolean> {
    try {
      // Get user profile from local storage
      const userProfileStr = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (userProfileStr) {
        const userProfile = JSON.parse(userProfileStr);
        return await UserSyncService.ensureUserInSupabase(uuid, userProfile);
      } else {
        // Create default user profile
        const now = new Date().toISOString();
        const userProfile = {
          id: uuid,
          username: `user_${uuid.slice(0, 8)}`,
          usdt_balance: "100000",
          total_portfolio_value: "100000",
          initial_balance: "100000",
          total_pnl: "0.00",
          total_trades: 0,
          win_rate: "0.00",
          join_date: now,
          last_active: now,
          created_at: now,
          updated_at: now,
        };
        const syncResult = await UserSyncService.syncUserToCloud(userProfile);
        return syncResult.success;
      }
    } catch (error) {
      console.error("Failed to ensure user in Supabase:", error);
      return false;
    }
  }
}

/**
 * Ensures user exists in both local DB and Supabase. Call this on app start.
 */
export async function initializeUserProfile() {
  try {
    // Step 1: Ensure local user exists and get uuid
    const uuid = await UUIDService.getOrCreateUser();

    // Step 2: Try to get user profile from AsyncStorage (cache)
    let userProfileStr = await AsyncStorage.getItem(USER_PROFILE_KEY);
    let userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;

    // If not in cache, try to get from local DB
    if (!userProfile) {
      const localUser = await AsyncStorageService.getUser(uuid);
      userProfile = localUser || null;
    }

    // Fallback: If still not found, create a default profile
    if (!userProfile) {
      userProfile = {
        uuid,
        balance: "100000",
        createdAt: new Date().toISOString(),
        lastSyncAt: null,
      };
    }

    // Step 3: Ensure user exists in Supabase
    const result = await UserSyncService.syncUserToCloud(userProfile);
    if (result.success) {
      console.log("User profile initialized in Supabase.");
    } else {
      console.warn(
        "User profile could not be synced to Supabase:",
        result.error
      );
    }
  } catch (err) {
    console.error("Failed to initialize user profile:", err);
  }
}

export default UUIDService;
