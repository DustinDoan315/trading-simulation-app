import * as schema from './schema';
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';


// db/client.ts

// Create database instance with synchronous API
const expoDb = SQLite.openDatabaseSync("learn_trading_app.db");

// Initialize database tables with column names EXACTLY matching your schema
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

console.log("Database tables created successfully");

export const db = drizzle(expoDb, { schema });
