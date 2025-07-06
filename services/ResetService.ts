import AsyncStorage from '@react-native-async-storage/async-storage';
import UUIDService from './UUIDService';
import { AsyncStorageService } from './AsyncStorageService';
import { supabase } from './SupabaseService';
;

export interface ResetResult {
  success: boolean;
  error?: string;
  details: {
    localStorage: boolean;
    cloudData: boolean;
    database: boolean;
    userProfile: boolean;
  };
}

export class ResetService {
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

      // Clear portfolio data
      const { error: portfolioError } = await supabase
        .from("portfolios")
        .delete()
        .eq("user_id", uuid);

      if (portfolioError) {
        console.error("❌ Failed to clear portfolio:", portfolioError);
        throw new Error(`Portfolio clear failed: ${portfolioError.message}`);
      }

      // Clear transaction history
      const { error: transactionError } = await supabase
        .from("transactions")
        .delete()
        .eq("user_id", uuid);

      if (transactionError) {
        console.error("❌ Failed to clear transactions:", transactionError);
        // Don't throw here as this table might not exist
        console.warn("⚠️ Transaction clear failed, but continuing");
      }

      // Clear portfolio list data
      const { error: portfolioListError } = await supabase
        .from("portfolios")
        .delete()
        .eq("user_id", uuid);

      if (portfolioListError) {
        console.error("❌ Failed to clear portfolio list:", portfolioListError);
        // Don't throw here as this table might not exist
        console.warn("⚠️ Portfolio list clear failed, but continuing");
      }

      // Reset user balance to default
      const { error: userError } = await supabase
        .from("users")
        .update({ balance: "100000" })
        .eq("uuid", uuid);

      if (userError) {
        console.error("❌ Failed to reset user balance:", userError);
        throw new Error(`User balance reset failed: ${userError.message}`);
      }

      console.log("✅ Cloud data cleared successfully");
    } catch (error) {
      console.error("❌ Error clearing cloud data:", error);
      throw error;
    }
  }



  /**
   * Reset user profile to default values
   */
  private static async resetUserProfile(uuid: string): Promise<void> {
    try {
      // Create default user profile
      const defaultProfile = {
        uuid,
        balance: "100000",
        createdAt: new Date().toISOString(),
        lastSyncAt: null,
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem("user_profile", JSON.stringify(defaultProfile));

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
        const { error } = await supabase
          .from("users")
          .upsert({
            uuid,
            balance: "100000",
            created_at: new Date().toISOString(),
          })
          .single();

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
      },
    };

    try {
      const uuid = await UUIDService.getOrCreateUser();

      // Clear portfolio from local storage
      await AsyncStorage.removeItem("portfolio_data");
      result.details.localStorage = true;

      // Clear portfolio from cloud
      const { error } = await supabase
        .from("portfolios")
        .delete()
        .eq("user_id", uuid);

      if (error) {
        console.error("❌ Failed to clear cloud portfolio:", error);
      } else {
        result.details.cloudData = true;
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
      },
    };

    try {
      const uuid = await UUIDService.getOrCreateUser();

      // Clear transactions from local storage
      await AsyncStorage.removeItem("transactions_data");
      result.details.localStorage = true;

      // Clear transactions from cloud
      const { error } = await supabase
        .from("trade_history")
        .delete()
        .eq("user_id", uuid);

      if (error) {
        console.error("❌ Failed to clear cloud transactions:", error);
      } else {
        result.details.cloudData = true;
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