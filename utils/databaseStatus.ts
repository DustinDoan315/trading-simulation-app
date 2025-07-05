import Constants from "expo-constants";
import { getDatabaseInfo, testDatabaseConnection } from "./databaseTest";
import { SyncService } from "../services/SupabaseService";

export const getDatabaseStatus = async () => {
  console.log("🔍 Getting comprehensive database status...");

  const status = {
    environment: {
      isDevelopment: __DEV__,
      isExpoGo: Constants.appOwnership === "expo",
      appOwnership: Constants.appOwnership,
      timestamp: new Date().toISOString(),
    },
    database: {
      testResult: null as any,
      info: null as any,
    },
    sync: {
      status: null as any,
      connection: null as any,
    },
  };

  try {
    // Test database connection
    console.log("🧪 Testing database functionality...");
    status.database.testResult = await testDatabaseConnection();

    // Get database info
    console.log("📊 Getting database info...");
    status.database.info = await getDatabaseInfo();

    // Test Supabase connection
    console.log("🌐 Testing Supabase connection...");
    status.sync.connection = await SyncService.testConnection();

    // Get sync status
    console.log("📡 Getting sync status...");
    status.sync.status = await SyncService.getDetailedSyncStatus();
  } catch (error) {
    console.error("❌ Error getting database status:", error);
    status.database.testResult = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  console.log("📋 Database Status Summary:");
  console.log("Environment:", status.environment);
  console.log("Database Test:", status.database.testResult);
  console.log("Supabase Connection:", status.sync.connection);
  console.log("Sync Status:", status.sync.status);

  return status;
};

export const printDatabaseRecommendations = (status: any) => {
  console.log("\n💡 Recommendations:");

  if (status.environment.isExpoGo) {
    console.log("⚠️  You are using Expo Go - local database will be readonly");
    console.log("💡  For full functionality, create a development build:");
    console.log("    eas build --profile development --platform ios");
    console.log("    eas build --profile development --platform android");
  }

  if (status.database.testResult?.success === false) {
    if (status.database.testResult.error?.includes("readonly")) {
      console.log(
        "✅  This is expected in Expo Go - app will use cloud storage"
      );
    } else {
      console.log("❌  Database has issues - check configuration");
    }
  }

  if (status.sync.connection?.success === false) {
    console.log(
      "❌  Supabase connection failed - check network and credentials"
    );
  }

  if (status.sync.status?.hasPendingOperations) {
    console.log(
      "⏳  There are pending sync operations - app will retry automatically"
    );
  }

  console.log("\n📱  App will continue working with available storage options");
};
