"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SupabaseService_1 = require("../services/SupabaseService");
async function createTables() {
    const tables = [
        `CREATE TABLE IF NOT EXISTS users (
      uuid TEXT PRIMARY KEY,
      balance TEXT NOT NULL DEFAULT '100000',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
        `CREATE TABLE IF NOT EXISTS portfolios (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      quantity TEXT NOT NULL,
      avg_cost TEXT NOT NULL,
      image TEXT,
      UNIQUE(user_id, symbol),
      FOREIGN KEY (user_id) REFERENCES users(uuid)
    )`,
        `CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      symbol TEXT NOT NULL,
      quantity TEXT NOT NULL,
      price TEXT NOT NULL,
      timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(uuid)
    )`,
        `CREATE TABLE IF NOT EXISTS collections (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      invite_code TEXT NOT NULL,
      rules JSONB NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(uuid)
    )`,
    ];
    for (const query of tables) {
        const { error } = await SupabaseService_1.supabase.from("sql").insert([{ query }]);
        if (error) {
            throw error;
        }
    }
}
async function main() {
    try {
        await createTables();
        console.log("Supabase tables initialized successfully");
        process.exit(0);
    }
    catch (error) {
        console.error("Failed to initialize tables:", error);
        process.exit(1);
    }
}
main();
