// import * as FileSystem from "expo-file-system";
// import * as SQLite from "expo-sqlite";

// export const resetDatabase = async () => {
//   try {
//     console.log("🔄 Resetting local database...");

//     // Try to close existing database connection
//     try {
//       const db = SQLite.openDatabaseSync("learn_trading_app.db");
//       db.closeSync();
//       console.log("✅ Closed existing database connection");
//     } catch (closeError) {
//       console.log("ℹ️ No existing database connection to close");
//     }

//     // Delete the database file
//     const dbPath = `${FileSystem.documentDirectory}SQLite/learn_trading_app.db`;
//     const exists = await FileSystem.getInfoAsync(dbPath);

//     if (exists.exists) {
//       try {
//         await FileSystem.deleteAsync(dbPath);
//         console.log("✅ Database file deleted");
//       } catch (deleteError) {
//         console.warn(
//           "⚠️ Could not delete database file (may be readonly):",
//           deleteError
//         );
//         console.log("ℹ️ This is normal in some development environments");
//       }
//     } else {
//       console.log("ℹ️ Database file not found, will be created fresh");
//     }

//     // Wait a moment for file system to update
//     await new Promise((resolve) => setTimeout(resolve, 100));

//     // Reopen database to trigger recreation with correct schema
//     try {
//       const newDb = SQLite.openDatabaseSync("learn_trading_app.db");
//       newDb.closeSync();
//       console.log(
//         "✅ Database reset complete - new schema will be applied on next app start"
//       );
//     } catch (openError) {
//       console.log("⚠️ Could not reopen database immediately");

//       // Check if it's a readonly database error
//       if (
//         openError instanceof Error &&
//         openError.message.includes("readonly database")
//       ) {
//         console.log("ℹ️ Database is readonly (normal in Expo Go)");
//         console.log(
//           "ℹ️ Database will be created with correct schema on next app start"
//         );
//         console.log("ℹ️ For persistent local storage, use a development build");
//       } else {
//         console.log(
//           "ℹ️ Database will be created with correct schema on next app start"
//         );
//       }
//     }
//   } catch (error) {
//     console.error("❌ Error resetting database:", error);

//     // Check if it's a readonly database error
//     if (error instanceof Error && error.message.includes("readonly database")) {
//       console.log(
//         "ℹ️ Database is readonly - this is expected in some environments"
//       );
//       console.log("ℹ️ App will continue with cloud-only storage");
//     } else {
//       console.log("ℹ️ Database reset failed, but app will continue");
//     }
//   }
// };
