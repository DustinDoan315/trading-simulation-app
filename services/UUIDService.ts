import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceUUID } from '@/utils/deviceUtils';
import { LocalDatabaseService } from './LocalDatabase';
import { supabase } from './SupabaseService';
// Enhanced UUIDService.ts

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
      const localUser = await LocalDatabaseService.getUserPortfolio(uuid);
      userProfile = localUser && localUser[0]
        ? {
            uuid: localUser[0].uuid,
            balance: localUser[0].balance,
            createdAt: localUser[0].createdAt,
            lastSyncAt: null,
          }
        : null;
    }

    // Fallback: If still not found, create a default profile
    if (!userProfile) {
      userProfile = {
        uuid,
        balance: "100000",
        createdAt: Math.floor(new Date().getTime() / 1000),
        lastSyncAt: null,
      };
    }

    // Step 3: Ensure user exists in Supabase
    const result = await UUIDService.syncUserToCloud(userProfile);
    if (result.success) {
      console.log("User profile initialized in Supabase.");
    } else {
      console.warn("User profile could not be synced to Supabase:", result.error);
    }
  } catch (err) {
    console.error("Failed to initialize user profile:", err);
  }
}

export default UUIDService;
