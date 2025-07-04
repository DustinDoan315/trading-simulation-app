// Enhanced UUIDService.ts
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./SupabaseService";
import { LocalDatabaseService } from "./LocalDatabase";
import { getDeviceUUID } from "@/utils/helper";

const USER_UUID_KEY = "user_uuid_12";
const USER_PROFILE_KEY = "user_profile";
const SYNC_STATUS_KEY = "sync_status";

class UUIDService {
  static async getOrCreateUser() {
    let uuid = await SecureStore.getItemAsync(USER_UUID_KEY);
    console.log('====================================');
    console.log('Fetching or creating user UUID...', uuid);
    console.log('====================================');
    if (!uuid) {
      uuid = await getDeviceUUID();
      await SecureStore.setItemAsync(USER_UUID_KEY, uuid);

      // Initialize user profile
      const userProfile = {
        uuid,
        balance: "100000",
        createdAt: Math.floor(new Date().getTime() / 1000),
        lastSyncAt: null,
      };

      // Save locally to SQLite (persistent)
      await LocalDatabaseService.createOrUpdateUser({
        uuid,
        balance: userProfile.balance,
        createdAt: new Date(userProfile.createdAt),
      });

      // Save to AsyncStorage (cache)
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));

      console.log('====================================');
      console.log('Created new user UUID:', uuid);
      // Save to cloud with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          console.log('====================================');
          console.log('Syncing user to cloud:', userProfile);
          console.log('====================================');
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

  static async syncUserToCloud(userProfile: any): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      // Ensure consistent timestamp format
      const timestamp = Math.floor(new Date(userProfile.createdAt).getTime() / 1000);
      
      const { data, error } = await supabase
        .from("users")
        .upsert({
          uuid: userProfile.uuid,
          balance: userProfile.balance,
          created_at: userProfile.createdAt,
        })
        .select() 
        .single();

      console.log('Sync operation result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        await this.updateSyncStatus('failed', error.message);
        return { success: false, error: error.message };
      }

      if (!data) {
        console.warn('No data returned from upsert');
        await this.updateSyncStatus('failed', 'No data returned');
        return { success: false, error: 'No data returned from upsert' };
      }

      await this.updateSyncStatus('synced');
      console.log("User synced successfully:", data);
      return { success: true, data };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Sync failed:", errorMessage);
      await this.updateSyncStatus('failed', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
  // Helper method for cleaner sync status management
  private static async updateSyncStatus(status: 'synced' | 'failed', error?: string) {
    const syncStatus = {
      lastSyncAt: Math.floor(new Date().getTime() / 1000),
      status,
      ...(error && { lastError: error })
    };
    
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
  }
}

export default UUIDService;
