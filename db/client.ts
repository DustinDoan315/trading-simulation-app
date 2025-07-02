// db/client.ts
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import * as schema from "./schema";

// Create database instance with synchronous API
const expoDb = SQLite.openDatabaseSync("trading.db");

// Drop existing tables to ensure clean state
expoDb.execSync(`
  DROP TABLE IF EXISTS collections;
  DROP TABLE IF EXISTS transactions;
  DROP TABLE IF EXISTS portfolios;
  DROP TABLE IF EXISTS users;
`);

// Initialize database tables with column names EXACTLY matching your schema
expoDb.execSync(`
  CREATE TABLE IF NOT EXISTS users (
    uuid TEXT PRIMARY KEY,
    balance TEXT NOT NULL DEFAULT '100000',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    symbol TEXT NOT NULL,
    quantity TEXT NOT NULL,
    avgCost TEXT NOT NULL,
    UNIQUE(userId, symbol)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
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
