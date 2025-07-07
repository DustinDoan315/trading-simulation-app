// import Constants from 'expo-constants';
// import { SyncService } from '../services/SupabaseService';

// export const getDatabaseStatus = async () => {
//   console.log("🔍 Getting comprehensive database status...");

//   const status = {
//     environment: {
//       isDevelopment: __DEV__,
//       isExpoGo: Constants.appOwnership === "expo",
//       appOwnership: Constants.appOwnership,
//       timestamp: new Date().toISOString(),
//     },
//     sync: {
//       status: null as any,
//       connection: null as any,
//     },
//   };

//   try {
//     // Test Supabase connection
//     console.log("🌐 Testing Supabase connection...");
//     status.sync.connection = await SyncService.testConnection();

//     // Get sync status
//     console.log("📡 Getting sync status...");
//     status.sync.status = await SyncService.getDetailedSyncStatus();
//   } catch (error) {
//     console.error("❌ Error getting database status:", error);
//   }

//   console.log("📋 Database Status Summary:");
//   console.log("Environment:", status.environment);
//   console.log("Supabase Connection:", status.sync.connection);
//   console.log("Sync Status:", status.sync.status);

//   return status;
// };

// export const printDatabaseRecommendations = (status: any) => {
//   console.log("\n💡 Recommendations:");

//   if (status.environment.isExpoGo) {
//     console.log("⚠️  You are using Expo Go - local database will be readonly");
//     console.log("💡  For full functionality, create a development build:");
//     console.log("    eas build --profile development --platform ios");
//     console.log("    eas build --profile development --platform android");
//   }

//   if (status.sync.connection?.success === false) {
//     console.log(
//       "❌  Supabase connection failed - check network and credentials"
//     );
//   }

//   if (status.sync.status?.hasPendingOperations) {
//     console.log(
//       "⏳  There are pending sync operations - app will retry automatically"
//     );
//   }

//   console.log("\n📱  App will continue working with available storage options");
// };
