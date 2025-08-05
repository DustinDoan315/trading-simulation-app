const AsyncStorage = require("@react-native-async-storage/async-storage");
const SecureStore = require("expo-secure-store");

/**
 * Comprehensive App Reset Script
 * This script resets the entire trading simulation app to a clean state
 */

async function resetApp() {
  console.log("🔄 Starting comprehensive app reset...");

  try {
    // Step 1: Clear all AsyncStorage data
    console.log("📱 Clearing AsyncStorage data...");
    await AsyncStorage.clear();
    console.log("✅ AsyncStorage cleared");

    // Step 2: Clear all SecureStore data
    console.log("🔐 Clearing SecureStore data...");
    const keys = [
      "user_uuid_13",
      "user_profile",
      "sync_status",
      "@sync_queue",
      "last_sync",
      "user_balance",
      "portfolio_data",
      "favorites_data",
      "transactions_data",
      "collections_data",
      "leaderboard_data",
      "daily_limits_data",
      "friends_data",
      "settings_data",
      "theme_preference",
      "language_preference",
      "onboarding_completed",
      "wallet_setup_completed",
      "security_options_completed",
    ];

    for (const key of keys) {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        // Ignore errors for keys that don't exist
      }
    }
    console.log("✅ SecureStore cleared");

    // Step 3: Clear Redux store (if running in app context)
    console.log("🔄 Redux store will be cleared on next app restart");

    // Step 4: Reset user UUID
    console.log("🆔 User UUID will be regenerated on next app launch");

    console.log("🎉 App reset completed successfully!");
    console.log("");
    console.log("📋 Next steps:");
    console.log("1. Restart the app");
    console.log("2. A new user will be created automatically");
    console.log("3. All data will start fresh");
    console.log("");
    console.log("🗄️  Database reset (if needed):");
    console.log("   - Run the RLS fix migration in Supabase SQL Editor");
    console.log("   - Or manually delete user data from Supabase tables");
  } catch (error) {
    console.error("❌ Error during app reset:", error);
    throw error;
  }
}

// Export for use in other scripts
module.exports = { resetApp };

// Run if called directly
if (require.main === module) {
  resetApp()
    .then(() => {
      console.log("✅ Reset script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Reset script failed:", error);
      process.exit(1);
    });
}
