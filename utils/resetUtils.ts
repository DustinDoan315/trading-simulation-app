import AsyncStorage from '@react-native-async-storage/async-storage';
import UUIDService from '@/services/UUIDService';
import { Alert } from 'react-native';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import { logger } from '@/utils/logger';
import { ResetService } from '@/services/ResetService';
import { supabase } from '@/services/SupabaseService';
import { UserService } from '@/services/UserService';

/**
 * Utility functions for resetting the app cache and creating new users
 */

/**
 * Comprehensive cache clearing function
 * This ensures all cached data is properly cleared
 */
export const clearAllCachedData = async (): Promise<void> => {
  try {
    logger.info("Starting comprehensive cache clearing", "resetUtils");
    
    // Get all AsyncStorage keys
    const allKeys = await AsyncStorage.getAllKeys();
    logger.info(`Found ${allKeys.length} AsyncStorage keys to clear`, "resetUtils");
    
    // Clear all keys
    await AsyncStorage.multiRemove(allKeys);
    logger.info("All AsyncStorage keys cleared successfully", "resetUtils");
    
  } catch (error) {
    logger.error("Error during comprehensive cache clearing", "resetUtils", error);
    throw error;
  }
};

/**
 * Force refresh all local data after reset
 * This ensures the UI shows the updated data from the database
 */
export const forceRefreshAllData = async (
  userId: string,
  dispatch: any,
  refreshUserData?: (userId: string) => Promise<void>
): Promise<void> => {
  try {
    logger.info("Force refreshing all local data after reset", "resetUtils");

    // Wait a moment for database operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Clear Redux state first
    if (dispatch) {
      dispatch({ type: 'user/clearUser' });
      dispatch({ type: 'balance/resetBalance' });
      dispatch({ type: 'favorites/resetFavorites' });
      dispatch({ type: 'searchHistory/clearSearchHistory' });
      dispatch({ type: 'dualBalance/resetAllBalances' });
    }

    // Wait a moment for Redux state to clear
    await new Promise(resolve => setTimeout(resolve, 500));

    // Clear all cached data in AsyncStorage comprehensively
    try {
      await clearAllCachedData();
      logger.info("Comprehensively cleared all cached data from AsyncStorage", "resetUtils");
    } catch (storageError) {
      logger.warn("Error clearing AsyncStorage cache", "resetUtils", storageError);
    }

    // Also clear user-specific data using AsyncStorageService
    try {
      await AsyncStorageService.clearUserData(userId);
      logger.info("Cleared user-specific data from AsyncStorageService", "resetUtils");
    } catch (serviceError) {
      logger.warn("Error clearing AsyncStorageService data", "resetUtils", serviceError);
    }

    // Wait a moment for cache clearing to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Force reload user data from database to AsyncStorage
    try {
      // Get the updated user data from database
      const userData = await UserService.getUserById(userId);
      if (userData) {
        // Save the updated user data to AsyncStorage
        await AsyncStorageService.createOrUpdateUser(userData);
        logger.info("Updated user data loaded from database and saved to AsyncStorage", "resetUtils");
      } else {
        logger.warn("No user data found in database after reset", "resetUtils");
      }
    } catch (error) {
      logger.error("Error loading user data from database after reset", "resetUtils", error);
    }

    // Force reload balance from database
    if (dispatch) {
      dispatch({ type: 'balance/loadBalance' });
    }

    // Refresh user context data to ensure all data is loaded from database
    if (refreshUserData) {
      await refreshUserData(userId);
    }

    // Also force refresh portfolio data from database
    if (dispatch) {
      dispatch({ type: 'user/fetchPortfolio', payload: userId });
    }

    logger.info("All local data refreshed successfully", "resetUtils");
  } catch (error) {
    logger.error("Error force refreshing data", "resetUtils", error);
    throw error;
  }
};

/**
 * Reset the app completely and create a new user
 * This is the main function to call when you want to reset everything
 */
export const resetAppAndCreateNewUser = async (): Promise<boolean> => {
  try {
    console.log("🔄 Starting complete app reset...");

    const result = await ResetService.resetAppAndCreateNewUser();

    if (result.success) {
      console.log("✅ App reset completed successfully");
      console.log("📊 Reset details:", result.details);
      return true;
    } else {
      console.error("❌ App reset failed:", result.error);
      return false;
    }
  } catch (error) {
    console.error("❌ Error during app reset:", error);
    return false;
  }
};

/**
 * Reset user data to default values while keeping the same user ID
 */
export const resetUserDataToDefault = async (userId: string): Promise<{
  success: boolean;
  error?: string;
  details: {
    portfolio: boolean;
    transactions: boolean;
    favorites: boolean;
    leaderboard: boolean;
    userProfile: boolean;
  };
}> => {
  try {
    console.log("🔄 Starting user data reset...");
    
    const result = await UserService.resetUserDataToDefault(userId);
    
    if (result.success) {
      console.log("✅ User data reset completed successfully");
      console.log("📊 Reset details:", result.details);
    } else {
      console.error("❌ User data reset failed:", result.error);
    }
    
    return result;
  } catch (error) {
    console.error("❌ Error during user data reset:", error);
    return {
      success: false,
      error: `Reset failed: ${error}`,
      details: {
        portfolio: false,
        transactions: false,
        favorites: false,
        leaderboard: false,
        userProfile: false,
      },
    };
  }
};

/**
 * Reset portfolio data only
 */
export const resetPortfolioData = async (): Promise<boolean> => {
  try {
    console.log("🔄 Starting portfolio reset...");

    // Get current user UUID
    const uuid = await UUIDService.getOrCreateUser();

    // Clear portfolio data from Supabase
    const { error } = await supabase
      .from("portfolio")
      .delete()
      .eq("user_id", uuid);

    if (error) {
      console.error("❌ Failed to clear portfolio:", error);
      return false;
    }

    // Reset user balance to default
    const { error: userError } = await supabase

    .from("users")
      .update({ 
        usdt_balance: "100000.00",
        total_portfolio_value: "100000.00",
        total_pnl: "0.00",
        total_trades: 0,
        updated_at: new Date().toISOString()
      })
      .eq("id", uuid);

    if (userError) {
      console.error("❌ Failed to reset user balance:", userError);
      return false;
    }

    console.log("✅ Portfolio reset completed successfully");
    return true;
  } catch (error) {
    console.error("❌ Error during portfolio reset:", error);
    return false;
  }
};

/**
 * Reset only transaction history (keeps user and portfolio but clears transactions)
 */
export const resetTransactionHistory = async (): Promise<boolean> => {
  try {
    console.log("🔄 Starting transaction history reset...");

    const result = await ResetService.resetTransactionHistory();

    if (result.success) {
      console.log("✅ Transaction history reset completed successfully");
      return true;
    } else {
      console.error("❌ Transaction history reset failed:", result.error);
      return false;
    }
  } catch (error) {
    console.error("❌ Error during transaction history reset:", error);
    return false;
  }
};

/**
 * Show a confirmation dialog and then reset the app
 */
export const showResetConfirmation = (
  onSuccess?: () => void,
  onError?: (error: string) => void
) => {
  Alert.alert(
    "Reset App & Create New User",
    "This will completely reset the app and create a new user with fresh data. All current data will be lost. Are you sure?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset App",
        style: "destructive",
        onPress: async () => {
          try {
            const success = await resetAppAndCreateNewUser();

            if (success) {
              Alert.alert(
                "Reset Complete",
                "App has been reset successfully! A new user has been created. Please restart the app to see the changes.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      onSuccess?.();
                    },
                  },
                ]
              );
            } else {
              const errorMessage = "Failed to reset app. Please try again.";
              Alert.alert("Reset Failed", errorMessage, [{ text: "OK" }]);
              onError?.(errorMessage);
            }
          } catch (error) {
            const errorMessage = `An error occurred during reset: ${error}`;
            Alert.alert("Reset Error", errorMessage, [{ text: "OK" }]);
            onError?.(errorMessage);
          }
        },
      },
    ]
  );
};

/**
 * Show a confirmation dialog for portfolio reset
 */
export const showPortfolioResetConfirmation = (
  onSuccess?: () => void,
  onError?: (error: string) => void
) => {
  Alert.alert(
    "Reset Portfolio",
    "This will clear all your portfolio data but keep your user account. Are you sure?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset Portfolio",
        style: "destructive",
        onPress: async () => {
          try {
            const success = await resetPortfolioData();

            if (success) {
              Alert.alert(
                "Portfolio Reset Complete",
                "Your portfolio has been reset successfully!",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      onSuccess?.();
                    },
                  },
                ]
              );
            } else {
              const errorMessage =
                "Failed to reset portfolio. Please try again.";
              Alert.alert("Reset Failed", errorMessage, [{ text: "OK" }]);
              onError?.(errorMessage);
            }
          } catch (error) {
            const errorMessage = `An error occurred during portfolio reset: ${error}`;
            Alert.alert("Reset Error", errorMessage, [{ text: "OK" }]);
            onError?.(errorMessage);
          }
        },
      },
    ]
  );
};

/**
 * Get current user UUID (useful for debugging)
 */
export const getCurrentUserUUID = async (): Promise<string | null> => {
  try {
    return await UUIDService.getOrCreateUser();
  } catch (error) {
    console.error("Error getting current user UUID:", error);
    return null;
  }
};

/**
 * Check if app has been reset recently (useful for showing onboarding)
 */
export const checkIfNewUser = async (): Promise<boolean> => {
  try {
    const lastReset = await AsyncStorage.getItem("last_app_reset");

    if (!lastReset) {
      return true; // No reset timestamp found, likely a new user
    }

    const resetTime = new Date(lastReset).getTime();
    const now = new Date().getTime();
    const hoursSinceReset = (now - resetTime) / (1000 * 60 * 60);

    // Consider user "new" if reset was within last 24 hours
    return hoursSinceReset < 24;
  } catch (error) {
    console.error("Error checking if new user:", error);
    return false;
  }
};
