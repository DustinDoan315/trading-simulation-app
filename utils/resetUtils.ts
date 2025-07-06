import { Alert } from "react-native";
import { ResetService } from "@/services/ResetService";

/**
 * Utility functions for resetting the app cache and creating new users
 */

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
 * Reset only portfolio data (keeps user but clears portfolio)
 */
export const resetPortfolioData = async (): Promise<boolean> => {
  try {
    console.log("🔄 Starting portfolio reset...");

    const result = await ResetService.resetPortfolioData();

    if (result.success) {
      console.log("✅ Portfolio reset completed successfully");
      return true;
    } else {
      console.error("❌ Portfolio reset failed:", result.error);
      return false;
    }
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
    const UUIDService = await import("@/services/UUIDService");
    return await UUIDService.default.getOrCreateUser();
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
    const AsyncStorage = await import(
      "@react-native-async-storage/async-storage"
    );
    const lastReset = await AsyncStorage.default.getItem("last_app_reset");

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
