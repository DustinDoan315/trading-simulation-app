require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// Validate environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase configuration. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in .env file"
  );
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

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
    try {
      const { data, error } = await supabase.rpc("execute_sql", { sql: query });

      if (error) {
        console.error(`Error creating table ${query.split(" ")[2]}:`);
        console.error(error);
        throw error;
      }

      console.log(`Successfully created table: ${query.split(" ")[2]}`);
    } catch (error) {
      console.error(`Failed to execute query: ${query}`);
      console.error("Full error details:", error);
      throw error;
    }
  }
}

createTables()
  .then(() => {
    console.log("All tables created successfully");
    console.log("Created tables: users, portfolios, transactions, collections");
  })
  .catch((err) => {
    console.error("Error initializing Supabase tables:");
    if (err.message) {
      console.error(err.message);
    }
    if (err.response) {
      console.error("Response:", err.response);
    }
    console.error("Full error:", err);
  });
