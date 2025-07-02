"use strict";
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = exports.SupabaseInitializer = exports.supabase = void 0;
// Enhanced SupabaseService.ts
const supabase_js_1 = require("@supabase/supabase-js");
const async_storage_1 = require("@react-native-async-storage/async-storage");
const DatabaseService_1 = require("./DatabaseService");
const expo_constants_1 = require("expo-constants");
const SUPABASE_URL = ((_b = (_a = expo_constants_1.default.expoConfig) === null || _a === void 0 ? void 0 : _a.extra) === null || _b === void 0 ? void 0 : _b.SUPABASE_URL) || "";
const SUPABASE_KEY = ((_d = (_c = expo_constants_1.default.expoConfig) === null || _c === void 0 ? void 0 : _c.extra) === null || _d === void 0 ? void 0 : _d.SUPABASE_ANON_KEY) || "";
exports.supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        storage: async_storage_1.default,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
class SupabaseInitializer {
    static async initializeTables() {
        try {
            // Check if users table exists
            const { data: usersTable, error: usersError } = await exports.supabase
                .from("information_schema.tables")
                .select("*")
                .eq("table_name", "users")
                .eq("table_schema", "public");
            if ((usersTable === null || usersTable === void 0 ? void 0 : usersTable.length) === 0 || usersError) {
                const { error } = await exports.supabase.from("sql").insert([
                    {
                        query: `CREATE TABLE users (
              uuid TEXT PRIMARY KEY,
              balance TEXT NOT NULL DEFAULT '100000',
              created_at TIMESTAMP NOT NULL DEFAULT NOW()
            )`,
                    },
                ]);
                if (error)
                    throw error;
            }
            // Check if portfolios table exists
            const { data: portfoliosTable, error: portfoliosError } = await exports.supabase
                .from("information_schema.tables")
                .select("*")
                .eq("table_name", "portfolios")
                .eq("table_schema", "public");
            if ((portfoliosTable === null || portfoliosTable === void 0 ? void 0 : portfoliosTable.length) === 0 || portfoliosError) {
                const { error } = await exports.supabase.from("sql").insert([
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
                if (error)
                    throw error;
            }
            // Check if transactions table exists
            const { data: transactionsTable, error: transactionsError } = await exports.supabase
                .from("information_schema.tables")
                .select("*")
                .eq("table_name", "transactions")
                .eq("table_schema", "public");
            if ((transactionsTable === null || transactionsTable === void 0 ? void 0 : transactionsTable.length) === 0 || transactionsError) {
                const { error } = await exports.supabase.from("sql").insert([
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
                if (error)
                    throw error;
            }
            // Check if collections table exists
            const { data: collectionsTable, error: collectionsError } = await exports.supabase
                .from("information_schema.tables")
                .select("*")
                .eq("table_name", "collections")
                .eq("table_schema", "public");
            if ((collectionsTable === null || collectionsTable === void 0 ? void 0 : collectionsTable.length) === 0 || collectionsError) {
                const { error } = await exports.supabase.from("sql").insert([
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
                if (error)
                    throw error;
            }
            console.log("All tables created successfully");
        }
        catch (error) {
            console.error("Error initializing Supabase tables:", error);
        }
    }
}
exports.SupabaseInitializer = SupabaseInitializer;
class SyncService {
    static async syncUserData(uuid) {
        try {
            // Get local data
            const localPortfolio = await DatabaseService_1.DatabaseService.getUserPortfolio(uuid);
            const localBalance = await async_storage_1.default.getItem("user_balance");
            // Sync to Supabase
            await this.syncPortfolioToCloud(uuid, localPortfolio);
            await this.syncBalanceToCloud(uuid, localBalance);
            // Update sync timestamp
            await async_storage_1.default.setItem("last_sync", new Date().toISOString());
        }
        catch (error) {
            console.error("Sync failed:", error);
        }
    }
    static async syncFromCloud(uuid) {
        try {
            // Get cloud data
            const { data: cloudPortfolio } = await exports.supabase
                .from("portfolios")
                .select("*")
                .eq("user_id", uuid);
            // Update local database
            if (cloudPortfolio) {
                for (const asset of cloudPortfolio) {
                    await DatabaseService_1.DatabaseService.updatePortfolioAsset(asset);
                }
            }
        }
        catch (error) {
            console.error("Sync from cloud failed:", error);
        }
    }
    static async syncPortfolioToCloud(uuid, portfolio) {
        for (const asset of portfolio) {
            await exports.supabase.from("portfolios").upsert({
                user_id: uuid,
                symbol: asset.symbol,
                quantity: asset.quantity,
                avg_cost: asset.avgCost,
                image: asset.image,
            });
        }
    }
    static async syncBalanceToCloud(uuid, balance) {
        if (balance) {
            await exports.supabase.from("users").upsert({
                uuid,
                balance,
                created_at: new Date().toISOString(),
            });
        }
    }
    static async syncCollectionsToCloud(collections) {
        for (const collection of collections) {
            await exports.supabase.from("collections").upsert({
                id: collection.id,
                name: collection.name,
                owner_id: collection.ownerId,
                invite_code: collection.inviteCode,
                rules: collection.rules,
            });
        }
    }
    static async syncCollectionsFromCloud(uuid) {
        try {
            const { data: cloudCollections } = await exports.supabase
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
        }
        catch (error) {
            console.error("Failed to sync collections:", error);
            return [];
        }
    }
}
exports.SyncService = SyncService;
