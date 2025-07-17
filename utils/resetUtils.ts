import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UUIDService from '@/services/UUIDService';
import { Alert } from 'react-native';
import { ASYNC_STORAGE_KEYS } from '@/utils/constant';
import { AsyncStorageService } from '@/services/AsyncStorageService';
import { logger } from '@/utils/logger';
import { ResetService } from '@/services/ResetService';
import { supabase } from '@/services/SupabaseService';
import { UserService } from '@/services/UserService';


export const clearAllCachedData = async (): Promise<void> => {
  try {
    logger.info("Starting comprehensive cache clearing", "resetUtils");
    
    const allKeys = await AsyncStorage.getAllKeys();
    logger.info(`Found ${allKeys.length} AsyncStorage keys to clear`, "resetUtils");
    
    await AsyncStorage.multiRemove(allKeys);
    logger.info("All AsyncStorage keys cleared successfully", "resetUtils");
    
  } catch (error) {
    logger.error("Error during comprehensive cache clearing", "resetUtils", error);
    throw error;
  }
};

export const forceRefreshAllData = async (
  userId: string,
  dispatch: any,
  refreshUserData?: (userId: string) => Promise<void>
): Promise<void> => {
  try {
    logger.info("Force refreshing all local data after reset", "resetUtils");

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (dispatch) {
      dispatch({ type: 'user/clearUser' });
      dispatch({ type: 'balance/resetBalance' });
      dispatch({ type: 'favorites/resetFavorites' });
      dispatch({ type: 'searchHistory/clearSearchHistory' });
      dispatch({ type: 'dualBalance/resetAllBalances' });
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Clear AsyncStorage but PRESERVE the user ID in SecureStore
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      // Filter out user ID related keys to preserve user identity
      const keysToRemove = allKeys.filter(key => 
        !key.includes('user_uuid') && 
        !key.includes('@user_id') && 
        !key.includes('user_uuid_13') &&
        !key.includes('user_uuid_12')
      );
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        logger.info(`Cleared ${keysToRemove.length} AsyncStorage keys (preserved user ID)`, "resetUtils");
      }
    } catch (storageError) {
      logger.warn("Error clearing AsyncStorage cache", "resetUtils", storageError);
    }

    try {
      await AsyncStorageService.clearUserData(userId);
      logger.info("Cleared user-specific data from AsyncStorageService", "resetUtils");
    } catch (serviceError) {
      logger.warn("Error clearing AsyncStorageService data", "resetUtils", serviceError);
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Ensure user exists in database before trying to load data
    try {
      const userData = await UserService.getUserById(userId);
      if (userData) {
        await AsyncStorageService.createOrUpdateUser(userData);
        logger.info("Updated user data loaded from database and saved to AsyncStorage", "resetUtils");
      } else {
        logger.warn("No user data found in database after reset", "resetUtils");
        // Don't create a new user here - let the app initialization handle it
      }
    } catch (error) {
      logger.error("Error loading user data from database after reset", "resetUtils", error);
    }

    if (dispatch) {
      dispatch({ type: 'balance/loadBalance' });
    }

    if (refreshUserData) {
      await refreshUserData(userId);
    }

    if (dispatch) {
      dispatch({ type: 'user/fetchPortfolio', payload: userId });
    }

    logger.info("All local data refreshed successfully", "resetUtils");
  } catch (error) {
    logger.error("Error force refreshing data", "resetUtils", error);
    throw error;
  }
};

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

export const resetPortfolioData = async (): Promise<boolean> => {
  try {
    console.log("🔄 Starting portfolio reset...");

    const uuid = await UUIDService.getOrCreateUser();

    const { error } = await supabase
      .from("portfolio")
      .delete()
      .eq("user_id", uuid);

    if (error) {
      console.error("❌ Failed to clear portfolio:", error);
      return false;
    }

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

export const clearUserUUID = async (): Promise<void> => {
  try {
    console.log("🔄 Clearing user UUID to force regeneration...");
    
    await SecureStore.deleteItemAsync("user_uuid_13");
    await SecureStore.deleteItemAsync("user_uuid_12");
    
    await AsyncStorage.removeItem("user_profile");
    await AsyncStorage.removeItem("user_uuid");
    
    console.log("✅ User UUID cleared successfully");
  } catch (error) {
    console.error("❌ Error clearing user UUID:", error);
    throw error;
  }
};

export const getCurrentUserUUID = async (): Promise<string | null> => {
  try {
    return await UUIDService.getOrCreateUser();
  } catch (error) {
    console.error("Error getting current user UUID:", error);
    return null;
  }
};

export const resetOnboardingStatus = async (userId?: string): Promise<void> => {
  try {
    if (userId) {

              await AsyncStorage.removeItem(ASYNC_STORAGE_KEYS.ONBOARDING_COMPLETED);
      } else {
        const currentUserId = await AsyncStorage.getItem(ASYNC_STORAGE_KEYS.USER_ID);
        if (currentUserId) {
          await AsyncStorage.removeItem(ASYNC_STORAGE_KEYS.ONBOARDING_COMPLETED);
      }
    }
  } catch (error) {
    console.error("Error resetting onboarding status:", error);
  }
};

export const checkIfNewUser = async (): Promise<boolean> => {
  try {
    const lastReset = await AsyncStorage.getItem(ASYNC_STORAGE_KEYS.LAST_APP_RESET);

    if (!lastReset) {
      return true;
    }

    const resetTime = new Date(lastReset).getTime();
    const now = new Date().getTime();
    const hoursSinceReset = (now - resetTime) / (1000 * 60 * 60);

    return hoursSinceReset < 24;
  } catch (error) {
    console.error("Error checking if new user:", error);
    return false;
  }
};
