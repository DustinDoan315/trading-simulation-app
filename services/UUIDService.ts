import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageService } from './AsyncStorageService';
import { getDeviceUUID } from '@/utils/deviceUtils';
import { supabase } from './SupabaseService';
import { TimestampUtils } from '@/utils/helper';


// Enhanced UUIDService.ts

const USER_UUID_KEY = "user_uuid_12";
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
          const syncResult = await this.syncUserToCloud(userProfile);
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
          const { data: existingUser, error } = await supabase
            .from("users")
            .select("id")
            .eq("id", uuid)
            .single();

          if (error) {
            // Handle the case where no user exists (PGRST116 error)
            if (error.code === "PGRST116") {
              console.log("User not found in Supabase, syncing...");
              await this.syncUserToCloud(userProfile);
            } else {
              console.warn("Error checking user existence:", error);
            }
          } else if (!existingUser) {
            console.log("User not found in Supabase, syncing...");
            await this.syncUserToCloud(userProfile);
          }
        }
      } catch (error) {
        console.warn("Failed to verify user sync status:", error);
      }
    }

    return uuid;
  }

  static async syncUserToCloud(
    userProfile: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Use TimestampUtils to ensure proper timestamp format for Supabase
      let createdAt: string;
      try {
        createdAt = TimestampUtils.toISOTimestamp(userProfile.created_at || userProfile.createdAt);
      } catch (error) {
        console.warn("Invalid timestamp format, using current time:", error);
        createdAt = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("users")
        .upsert({
          id: userProfile.id || userProfile.uuid, // Use 'id' instead of 'uuid' to match schema
          username: userProfile.username || `user_${(userProfile.id || userProfile.uuid).slice(0, 8)}`,
          usdt_balance: userProfile.usdt_balance || userProfile.balance || "100000",
          total_portfolio_value: userProfile.total_portfolio_value || "100000",
          initial_balance: userProfile.initial_balance || "100000",
          total_pnl: userProfile.total_pnl || "0.00",
          total_trades: userProfile.total_trades || 0,
          win_rate: userProfile.win_rate || "0.00",
          join_date: userProfile.join_date || createdAt,
          last_active: userProfile.last_active || createdAt,
          created_at: createdAt,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      console.log("Sync operation result:", { data, error });

      if (error) {
        console.error("Supabase error:", error);
        await this.updateSyncStatus("failed", error.message);
        return { success: false, error: error.message };
      }

      if (!data) {
        console.warn("No data returned from upsert");
        await this.updateSyncStatus("failed", "No data returned");
        return { success: false, error: "No data returned from upsert" };
      }

      await this.updateSyncStatus("synced");
      console.log("User synced successfully:", data);
      return { success: true, data };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Sync failed:", errorMessage);
      await this.updateSyncStatus("failed", errorMessage);
      return { success: false, error: errorMessage };
    }
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
      // Check if user exists in Supabase
      const { data: existingUser, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", uuid)
        .single();

      if (error) {
        // Handle the case where no user exists (PGRST116 error)
        if (error.code === "PGRST116") {
          console.log("User not found in Supabase, creating...");
        } else {
          console.error("Error checking user existence:", error);
          return false;
        }
      }

      if (!existingUser) {
        console.log("User not found in Supabase, creating...");

        // Get user profile from local storage
        const userProfileStr = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (userProfileStr) {
          const userProfile = JSON.parse(userProfileStr);
          const syncResult = await this.syncUserToCloud(userProfile);
          return syncResult.success;
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
          const syncResult = await this.syncUserToCloud(userProfile);
          return syncResult.success;
        }
      }

      return true; // User exists
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
    const result = await UUIDService.syncUserToCloud(userProfile);
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
