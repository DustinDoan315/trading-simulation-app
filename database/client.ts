import * as FileSystem from "expo-file-system";
import * as schema from "./schema";
import * as SQLite from "expo-sqlite";
import Constants from "expo-constants";
import { drizzle } from "drizzle-orm/expo-sqlite";

// db/client.ts

// Create database instance with synchronous API
// Use a more specific database name to avoid conflicts
const DATABASE_NAME = "learn_trading_app.db";

// Check if we're in development mode
const isDevelopment = __DEV__;
const isExpoGo = Constants.appOwnership === "expo";

console.log("🔍 Database Environment:", {
  isDevelopment,
  isExpoGo,
  appOwnership: Constants.appOwnership,
  timestamp: new Date().toISOString(),
});

// Ensure the database directory exists
const ensureDatabaseDirectory = async () => {
  try {
    const dbDir = `${FileSystem.documentDirectory}SQLite/`;
    const dirInfo = await FileSystem.getInfoAsync(dbDir);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      console.log("✅ Created SQLite directory");
    }
  } catch (error) {
    console.warn("⚠️ Could not ensure database directory exists:", error);
  }
};

// Initialize database with proper error handling
let expoDb: SQLite.SQLiteDatabase;

try {
  // Ensure directory exists first
  ensureDatabaseDirectory();

  // Create database instance
  expoDb = SQLite.openDatabaseSync(DATABASE_NAME);

  console.log("✅ Database connection established");
} catch (error) {
  console.error("❌ Failed to open database:", error);

  if (isExpoGo) {
    console.warn("⚠️ This is expected in Expo Go - database will be readonly");
    console.warn("⚠️ For persistent local storage, use a development build");
  }

  throw error;
}

// Initialize database tables with column names EXACTLY matching your schema
try {
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      uuid TEXT PRIMARY KEY,
      balance TEXT NOT NULL DEFAULT '100000',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS portfolios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      quantity TEXT NOT NULL,
      avg_cost TEXT NOT NULL,
      image TEXT,
      UNIQUE(user_id, symbol)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      symbol TEXT NOT NULL,
      quantity TEXT NOT NULL,
      price TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      invite_code TEXT NOT NULL,
      rules TEXT NOT NULL
    );
  `);

  console.log("✅ Database tables created successfully");
} catch (error) {
  console.error("❌ Failed to create database tables:", error);

  // Check if it's a readonly database error
  if (error instanceof Error && error.message.includes("readonly database")) {
    console.warn("⚠️ Database is readonly - this is expected in Expo Go");
    console.warn("⚠️ For persistent local storage, use a development build");
    console.warn("⚠️ Data will be synced to Supabase instead");

    if (isExpoGo) {
      console.log(
        "ℹ️ You are using Expo Go - consider switching to a development build for full functionality"
      );
    }
  } else {
    throw error;
  }
}

export const db = drizzle(expoDb, { schema });

// Export the raw database instance for direct operations if needed
export { expoDb };
