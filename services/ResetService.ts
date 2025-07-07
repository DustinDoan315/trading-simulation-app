import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UUIDService from './UUIDService';
import { AsyncStorageService } from './AsyncStorageService';
import { clearUser } from '@/features/userSlice';
import { getDeviceUUID } from '@/utils/deviceUtils';
import { store } from '@/store';
import { supabase } from './SupabaseService';


export interface ResetResult {
  success: boolean;
  error?: string;
  details: {
    localStorage: boolean;
    cloudData: boolean;
    database: boolean;
    userProfile: boolean;
    newUserCreated: boolean;
  };
}

export class ResetService {
  /**
   * Complete app reset - clears all data and creates a new user with fresh UUID
   * This is the most comprehensive reset that creates a completely new user
   */
  static async resetAppAndCreateNewUser(): Promise<ResetResult> {
    const result: ResetResult = {
      success: true,
      details: {
        localStorage: false,
        cloudData: false,
        database: false,
        userProfile: false,
        newUserCreated: false,
      },
    };

    try {
      console.log("🔄 Starting complete app reset and new user creation...");

      // Step 1: Get current UUID before clearing everything
      const currentUuid = await SecureStore.getItemAsync("user_uuid_12");

      // Step 2: Clear all local storage and cache
      try {
        await this.clearAllStorageAndCache();
        result.details.localStorage = true;
        console.log("✅ All local storage and cache cleared");
      } catch (error) {
        console.error("❌ Failed to clear local storage:", error);
        result.success = false;
        result.error = `Local storage reset failed: ${error}`;
      }

      // Step 2.5: Clear Redux state
      try {
        store.dispatch(clearUser());
        console.log("✅ Redux state cleared");
      } catch (error) {
        console.error("❌ Failed to clear Redux state:", error);
        // Don't fail the entire reset if Redux fails
      }

      // Step 3: Clear cloud data for the old user (if exists)
      if (currentUuid) {
        try {
          await this.clearCloudData(currentUuid);
          result.details.cloudData = true;
          console.log("✅ Cloud data cleared for old user");
        } catch (error) {
          console.error("❌ Failed to clear cloud data:", error);
          // Don't fail the entire reset if cloud fails
          console.warn(
            "⚠️ Cloud reset failed, but continuing with new user creation"
          );
        }
      }

      // Step 4: Generate new UUID and create fresh user
      try {
        const newUuid = await this.createNewUser();
        result.details.newUserCreated = true;
        result.details.userProfile = true;
        console.log("✅ New user created with UUID:", newUuid);

        // Track the reset timestamp
        await AsyncStorage.setItem("last_app_reset", new Date().toISOString());
      } catch (error) {
        console.error("❌ Failed to create new user:", error);
        result.success = false;
        result.error = `New user creation failed: ${error}`;
      }

      console.log("✅ Complete app reset and new user creation completed");
      return result;
    } catch (error) {
      console.error("❌ Complete app reset failed:", error);
      return {
        success: false,
        error: `Complete reset failed: ${error}`,
        details: result.details,
      };
    }
  }

  /**
   * Clear all storage including SecureStore and AsyncStorage
   */
  private static async clearAllStorageAndCache(): Promise<void> {
    try {
      // Clear SecureStore (UUID storage)
      await SecureStore.deleteItemAsync("user_uuid_12");

      // Clear all AsyncStorage data
      await AsyncStorageService.clearAllData();

      // Clear additional AsyncStorage keys that might exist
      const additionalKeys = [
        "@user_id", // Clear the user ID that app initialization looks for
        "user_balance",
        "last_sync",
        "sync_status",
        "offline_queue",
        "crypto_cache",
        "market_data_cache",
        "user_profile",
        "portfolio_cache",
        "transaction_cache",
        "favorites_cache",
        "search_history_cache",
        "language_preference",
        "theme_preference",
        "notification_settings",
        "app_settings",
        "@sync_queue",
        "@sync_status",
      ];

      await AsyncStorage.multiRemove(additionalKeys);
      console.log("✅ All storage (SecureStore + AsyncStorage) cleared");
    } catch (error) {
      console.error("❌ Error clearing all storage:", error);
      throw error;
    }
  }

  /**
   * Create a completely new user with fresh UUID
   */
  private static async createNewUser(): Promise<string> {
    try {
      // Generate new UUID
      const newUuid = await getDeviceUUID();

      // Store new UUID in SecureStore
      await SecureStore.setItemAsync("user_uuid_12", newUuid);

      // Create new user profile with correct structure
      const now = new Date().toISOString();
      const userProfile = {
        id: newUuid,
        username: `user_${newUuid.slice(0, 8)}`,
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

      // Save to AsyncStorage using the correct service
      await AsyncStorageService.createOrUpdateUser(userProfile);

      // Sync to cloud with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          console.log("Syncing new user to cloud:", userProfile);
          const syncResult = await UUIDService.syncUserToCloud(userProfile);
          if (syncResult.success) {
            console.log("✅ New user successfully synced to cloud");
            break;
          } else {
            throw new Error(syncResult.error);
          }
        } catch (error) {
          retries--;
          console.error(`New user sync attempt ${4 - retries} failed:`, error);
          if (retries === 0) {
            console.error(
              "Failed to sync new user to cloud after 3 attempts:",
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

      console.log("✅ New user created successfully:", newUuid);
      return newUuid;
    } catch (error) {
      console.error("❌ Failed to create new user:", error);
      throw error;
    }
  }

  /**
   * Comprehensive reset that clears all user data from local storage, cloud, and database
   */
  static async resetAllData(): Promise<ResetResult> {
    const result: ResetResult = {
      success: true,
      details: {
        localStorage: false,
        cloudData: false,
        database: false,
        userProfile: false,
        newUserCreated: false,
      },
    };

    try {
      console.log("🔄 Starting comprehensive data reset...");

      // Get user UUID before clearing data
      const uuid = await UUIDService.getOrCreateUser();

      // Step 1: Clear local storage
      try {
        await this.clearLocalStorage();
        result.details.localStorage = true;
        console.log("✅ Local storage cleared");
      } catch (error) {
        console.error("❌ Failed to clear local storage:", error);
        result.success = false;
        result.error = `Local storage reset failed: ${error}`;
      }

      // Step 2: Clear cloud data
      try {
        await this.clearCloudData(uuid);
        result.details.cloudData = true;
        console.log("✅ Cloud data cleared");
      } catch (error) {
        console.error("❌ Failed to clear cloud data:", error);
        // Don't fail the entire reset if cloud fails
        console.warn("⚠️ Cloud reset failed, but continuing with local reset");
      }

      // Step 4: Reset user profile to default
      try {
        await this.resetUserProfile(uuid);
        result.details.userProfile = true;
        console.log("✅ User profile reset to default");
      } catch (error) {
        console.error("❌ Failed to reset user profile:", error);
        result.success = false;
        result.error = `User profile reset failed: ${error}`;
      }

      console.log("✅ Comprehensive data reset completed");
      return result;
    } catch (error) {
      console.error("❌ Comprehensive reset failed:", error);
      return {
        success: false,
        error: `Reset failed: ${error}`,
        details: result.details,
      };
    }
  }

  /**
   * Clear all AsyncStorage data
   */
  private static async clearLocalStorage(): Promise<void> {
    try {
      // Clear all AsyncStorage data
      await AsyncStorageService.clearAllData();

      // Clear additional AsyncStorage keys that might exist
      const additionalKeys = [
        "user_balance",
        "last_sync",
        "sync_status",
        "offline_queue",
        "crypto_cache",
        "market_data_cache",
        "user_profile",
        "portfolio_cache",
        "transaction_cache",
        "favorites_cache",
        "search_history_cache",
        "language_preference",
        "theme_preference",
        "notification_settings",
        "app_settings",
      ];

      await AsyncStorage.multiRemove(additionalKeys);
      console.log("✅ All AsyncStorage data cleared");
    } catch (error) {
      console.error("❌ Error clearing AsyncStorage:", error);
      throw error;
    }
  }

  /**
   * Clear all cloud data for the user
   */
  private static async clearCloudData(uuid: string): Promise<void> {
    try {
      console.log("🗑️ Clearing cloud data for user:", uuid);

      // Try to clear portfolio data (table might not exist)
      try {
        const { error: portfolioError } = await supabase
          .from("portfolio")
          .delete()
          .eq("user_id", uuid);

        if (portfolioError) {
          console.error("❌ Failed to clear portfolio:", portfolioError);
          console.warn("⚠️ Portfolio clear failed, but continuing");
        } else {
          console.log("✅ Portfolio data cleared");
        }
      } catch (portfolioError) {
        console.warn("⚠️ Portfolio table might not exist, skipping...");
      }

      // Try to clear transaction history (table might not exist)
      try {
        const { error: transactionError } = await supabase
          .from("transactions")
          .delete()
          .eq("user_id", uuid);

        if (transactionError) {
          console.error("❌ Failed to clear transactions:", transactionError);
          console.warn("⚠️ Transaction clear failed, but continuing");
        } else {
          console.log("✅ Transaction data cleared");
        }
      } catch (transactionError) {
        console.warn("⚠️ Transactions table might not exist, skipping...");
      }

      // Try to reset user balance to default
      try {
        const { error: userError } = await supabase
          .from("users")
          .update({ usdt_balance: "100000" })
          .eq("id", uuid);

        if (userError) {
          console.error("❌ Failed to reset user balance:", userError);
          console.warn("⚠️ User balance reset failed, but continuing");
        } else {
          console.log("✅ User USDT balance reset to default");
        }
      } catch (userError) {
        console.warn("⚠️ Users table might not exist, skipping...");
      }

      console.log("✅ Cloud data cleared successfully");
    } catch (error) {
      console.error("❌ Error clearing cloud data:", error);
      // Don't throw here - let the reset continue even if cloud operations fail
      console.warn(
        "⚠️ Cloud operations failed, but continuing with local reset"
      );
    }
  }

  /**
   * Reset user profile to default values
   */
  private static async resetUserProfile(uuid: string): Promise<void> {
    try {
      // Create default user profile
      const defaultProfile = {
        id: uuid,
        username: `user_${uuid.slice(0, 8)}`,
        usdt_balance: "100000",
        total_portfolio_value: "100000",
        initial_balance: "100000",
        total_pnl: "0.00",
        total_trades: 0,
        win_rate: "0.00",
        join_date: new Date().toISOString(),
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        "user_profile",
        JSON.stringify(defaultProfile)
      );

      // Save to local database
      try {
        // await LocalDatabaseService.createOrUpdateUser({
        //   uuid,
        //   balance: "100000",
        //   createdAt: new Date(),
        // });
      } catch (dbError) {
        console.warn("⚠️ Local database update failed:", dbError);
        // Don't throw as this might be readonly in some environments
      }

      // Sync to cloud
      try {
        const { error } = await supabase.from("users").upsert({
          id: uuid,
          username: `user_${uuid.slice(0, 8)}`,
          usdt_balance: "100000",
          total_portfolio_value: "100000",
          initial_balance: "100000",
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.error("❌ Failed to sync user profile to cloud:", error);
          throw new Error(`Cloud sync failed: ${error.message}`);
        }
      } catch (cloudError) {
        console.warn("⚠️ Cloud sync failed:", cloudError);
        // Don't throw as this might be a network issue
      }

      console.log("✅ User profile reset to default");
    } catch (error) {
      console.error("❌ Error resetting user profile:", error);
      throw error;
    }
  }

  /**
   * Reset only specific data types
   */
  static async resetPortfolioData(): Promise<ResetResult> {
    const result: ResetResult = {
      success: true,
      details: {
        localStorage: false,
        cloudData: false,
        database: false,
        userProfile: false,
        newUserCreated: false,
      },
    };

    try {
      const uuid = await UUIDService.getOrCreateUser();

      // Clear portfolio from local storage
      await AsyncStorage.removeItem("portfolio_data");
      result.details.localStorage = true;

      // Clear portfolio from cloud
      try {
        const { error } = await supabase
          .from("portfolio")
          .delete()
          .eq("user_id", uuid);

        if (error) {
          console.error("❌ Failed to clear cloud portfolio:", error);
        } else {
          result.details.cloudData = true;
          console.log("✅ Cloud portfolio cleared");
        }
      } catch (error) {
        console.warn(
          "⚠️ Portfolio table might not exist, skipping cloud clear"
        );
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Portfolio reset failed: ${error}`,
        details: result.details,
      };
    }
  }

  /**
   * Reset only transaction history
   */
  static async resetTransactionHistory(): Promise<ResetResult> {
    const result: ResetResult = {
      success: true,
      details: {
        localStorage: false,
        cloudData: false,
        database: false,
        userProfile: false,
        newUserCreated: false,
      },
    };

    try {
      const uuid = await UUIDService.getOrCreateUser();

      // Clear transactions from local storage
      await AsyncStorage.removeItem("transactions_data");
      result.details.localStorage = true;

      // Clear transactions from cloud
      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("user_id", uuid);

        if (error) {
          console.error("❌ Failed to clear cloud transactions:", error);
        } else {
          result.details.cloudData = true;
          console.log("✅ Cloud transactions cleared");
        }
      } catch (error) {
        console.warn(
          "⚠️ Transactions table might not exist, skipping cloud clear"
        );
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Transaction reset failed: ${error}`,
        details: result.details,
      };
    }
  }
}
