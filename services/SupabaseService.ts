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


export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});


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
