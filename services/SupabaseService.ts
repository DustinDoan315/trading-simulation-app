// Enhanced SupabaseService.ts
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DatabaseService } from "./DatabaseService";

import Constants from "expo-constants";

const SUPABASE_URL =
  Constants.expoConfig?.extra?.SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "";
const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  "";
const SUPABASE_SERVICE_KEY =
  Constants.expoConfig?.extra?.SUPABASE_SERVICE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY ||
  "";

// Client for regular operations
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Admin client for operations requiring elevated privileges
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export class SupabaseInitializer {
  static async initializeTables() {
    try {
      // First create tables if they don't exist
      await SupabaseInitializer.createTablesIfNotExists();

      // Then setup RLS policies using admin client
      await SupabaseInitializer.setupRLSPolicies();
    } catch (error) {
      console.error("Error initializing Supabase tables:", error);
    }
  }

  private static async createTablesIfNotExists() {
    try {
      // Check if users table exists
      const { data: usersTable, error: usersError } = await supabase
        .from("information_schema.tables")
        .select("*")
        .eq("table_name", "users")
        .eq("table_schema", "public");

      if (usersTable?.length === 0 || usersError) {
        const { error } = await supabase.from("sql").insert([
          {
            query: `CREATE TABLE users (
              uuid TEXT PRIMARY KEY,
              balance TEXT NOT NULL DEFAULT '100000',
              created_at TIMESTAMP NOT NULL DEFAULT NOW()
            )`,
          },
        ]);
        if (error) throw error;
      }

      // Check if portfolios table exists
      const { data: portfoliosTable, error: portfoliosError } = await supabase
        .from("information_schema.tables")
        .select("*")
        .eq("table_name", "portfolios")
        .eq("table_schema", "public");

      if (portfoliosTable?.length === 0 || portfoliosError) {
        const { error } = await supabase.from("sql").insert([
          {
            query: `CREATE TABLE portfolios (
              id SERIAL PRIMARY KEY,
              user_id TEXT NOT NULL,
              symbol TEXT NOT NULL,
              quantity TEXT NOT NULL,
              avg_cost TEXT NOT NULL,
              image TEXT,
              UNIQUE(user_id, symbol),
              FOREIGN KEY (user_id) REFERENCES users(uuid)
            )`,
          },
        ]);
        if (error) throw error;
      }

      // Check if transactions table exists
      const { data: transactionsTable, error: transactionsError } =
        await supabase
          .from("information_schema.tables")
          .select("*")
          .eq("table_name", "transactions")
          .eq("table_schema", "public");

      if (transactionsTable?.length === 0 || transactionsError) {
        const { error } = await supabase.from("sql").insert([
          {
            query: `CREATE TABLE transactions (
              id SERIAL PRIMARY KEY,
              user_id TEXT NOT NULL,
              type TEXT NOT NULL,
              symbol TEXT NOT NULL,
              quantity TEXT NOT NULL,
              price TEXT NOT NULL,
              timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
              FOREIGN KEY (user_id) REFERENCES users(uuid)
            )`,
          },
        ]);
        if (error) throw error;
      }

      // Check if collections table exists
      const { data: collectionsTable, error: collectionsError } = await supabase
        .from("information_schema.tables")
        .select("*")
        .eq("table_name", "collections")
        .eq("table_schema", "public");

      if (collectionsTable?.length === 0 || collectionsError) {
        const { error } = await supabase.from("sql").insert([
          {
            query: `CREATE TABLE collections (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              owner_id TEXT NOT NULL,
              invite_code TEXT NOT NULL,
              rules JSONB NOT NULL,
              FOREIGN KEY (owner_id) REFERENCES users(uuid)
            )`,
          },
        ]);
        if (error) throw error;
      }

      console.log("All tables created successfully");
    } catch (error) {
      console.error("Error creating tables:", error);
      throw error;
    }
  }

  private static async setupRLSPolicies() {
    try {
      // Enable RLS on all tables
      await supabaseAdmin
        .from("sql")
        .insert([
          { query: "ALTER TABLE users ENABLE ROW LEVEL SECURITY" },
          { query: "ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY" },
          { query: "ALTER TABLE transactions ENABLE ROW LEVEL SECURITY" },
          { query: "ALTER TABLE collections ENABLE ROW LEVEL SECURITY" },
        ]);

      // Create RLS policies
      await supabaseAdmin.from("sql").insert([
        {
          query: `CREATE POLICY "Users read access" ON users FOR SELECT USING (auth.uid() = uuid)`,
        },
        {
          query: `CREATE POLICY "Users insert access" ON users FOR INSERT WITH CHECK (auth.uid() = uuid)`,
        },
        {
          query: `CREATE POLICY "Users update access" ON users FOR UPDATE USING (auth.uid() = uuid)`,
        },
        {
          query: `CREATE POLICY "Portfolios read access" ON portfolios FOR SELECT USING (auth.uid() = user_id)`,
        },
        {
          query: `CREATE POLICY "Portfolios insert access" ON portfolios FOR INSERT WITH CHECK (auth.uid() = user_id)`,
        },
        {
          query: `CREATE POLICY "Portfolios update access" ON portfolios FOR UPDATE USING (auth.uid() = user_id)`,
        },
        {
          query: `CREATE POLICY "Transactions read access" ON transactions FOR SELECT USING (auth.uid() = user_id)`,
        },
        {
          query: `CREATE POLICY "Transactions insert access" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id)`,
        },
        {
          query: `CREATE POLICY "Transactions update access" ON transactions FOR UPDATE USING (auth.uid() = user_id)`,
        },
        {
          query: `CREATE POLICY "Collections read access" ON collections FOR SELECT USING (auth.uid() = owner_id)`,
        },
        {
          query: `CREATE POLICY "Collections insert access" ON collections FOR INSERT WITH CHECK (auth.uid() = owner_id)`,
        },
        {
          query: `CREATE POLICY "Collections update access" ON collections FOR UPDATE USING (auth.uid() = owner_id)`,
        },
      ]);

      console.log("RLS policies created successfully");
    } catch (error) {
      console.error("Error setting up RLS policies:", error);
      throw error;
    }
  }
}

export class SyncService {
  static async syncUserData(uuid: string) {
    try {
      // Get local data
      const localPortfolio = await DatabaseService.getUserPortfolio(uuid);
      const localBalance = await AsyncStorage.getItem("user_balance");

      // Sync to Supabase
      await this.syncPortfolioToCloud(uuid, localPortfolio);
      await this.syncBalanceToCloud(uuid, localBalance);

      // Update sync timestamp
      await AsyncStorage.setItem("last_sync", new Date().toISOString());
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }

  static async syncFromCloud(uuid: string) {
    try {
      // Get cloud data
      const { data: cloudPortfolio } = await supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", uuid);

      // Update local database
      if (cloudPortfolio) {
        for (const asset of cloudPortfolio) {
          await DatabaseService.updatePortfolioAsset(asset);
        }
      }
    } catch (error) {
      console.error("Sync from cloud failed:", error);
    }
  }

  private static async syncPortfolioToCloud(uuid: string, portfolio: any[]) {
    for (const asset of portfolio) {
      await supabase.from("portfolios").upsert({
        user_id: uuid,
        symbol: asset.symbol,
        quantity: asset.quantity,
        avg_cost: asset.avgCost,
        image: asset.image,
      });
    }
  }

  private static async syncBalanceToCloud(
    uuid: string,
    balance: string | null
  ) {
    if (balance) {
      await supabase.from("users").upsert({
        uuid,
        balance,
        created_at: new Date().toISOString(),
      });
    }
  }

  static async syncCollectionsToCloud(collections: any[]) {
    for (const collection of collections) {
      await supabase.from("collections").upsert({
        id: collection.id,
        name: collection.name,
        owner_id: collection.ownerId,
        invite_code: collection.inviteCode,
        rules: collection.rules,
      });
    }
  }

  static async syncCollectionsFromCloud(uuid: string) {
    try {
      const { data: cloudCollections } = await supabase
        .from("collections")
        .select("*")
        .eq("owner_id", uuid);

      if (cloudCollections) {
        return cloudCollections.map((c) => ({
          id: c.id,
          name: c.name,
          ownerId: c.owner_id,
          inviteCode: c.invite_code,
          rules: c.rules,
        }));
      }
      return [];
    } catch (error) {
      console.error("Failed to sync collections:", error);
      return [];
    }
  }
}
