import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./SupabaseService";
import { TimestampUtils } from "@/utils/helper";

const SYNC_STATUS_KEY = "sync_status";

export class UserSyncService {
  static async syncUserToCloud(
    userProfile: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Use TimestampUtils to ensure proper timestamp format for Supabase
      let createdAt: string;
      try {
        createdAt = TimestampUtils.toISOTimestamp(
          userProfile.created_at || userProfile.createdAt
        );
      } catch (error) {
        console.warn("Invalid timestamp format, using current time:", error);
        createdAt = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("users")
        .upsert({
          id: userProfile.id || userProfile.uuid, // Use 'id' instead of 'uuid' to match schema
          username:
            userProfile.username ||
            `user_${(userProfile.id || userProfile.uuid).slice(0, 8)}`,
          usdt_balance:
            userProfile.usdt_balance || userProfile.balance || "100000",
          total_portfolio_value: userProfile.total_portfolio_value || "100000",
          initial_balance: userProfile.initial_balance || "100000",
          total_pnl: userProfile.total_pnl || "0.00",
          total_trades: userProfile.total_trades || 0,
          win_rate: userProfile.win_rate || "0.00",
          join_date: userProfile.join_date || createdAt,
          last_active: userProfile.last_active || createdAt,
          created_at: createdAt,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      console.log("Sync operation result:", { data, error });

      if (error) {
        console.error("Supabase error:", error);
        await this.updateSyncStatus("failed", error.message);
        return { success: false, error: error.message };
      }

      if (!data) {
        console.warn("No data returned from upsert");
        await this.updateSyncStatus("failed", "No data returned");
        return { success: false, error: "No data returned from upsert" };
      }

      await this.updateSyncStatus("synced");
      console.log("User synced successfully:", data);
      return { success: true, data };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Sync failed:", errorMessage);
      await this.updateSyncStatus("failed", errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  static async checkUserExists(
    uuid: string
  ): Promise<{ exists: boolean; error?: string }> {
    try {
      const { data: existingUser, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", uuid)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return { exists: false };
        }
        return { exists: false, error: error.message };
      }

      return { exists: !!existingUser };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return { exists: false, error: errorMessage };
    }
  }

  static async ensureUserInSupabase(
    uuid: string,
    userProfile: any
  ): Promise<boolean> {
    try {
      const { exists, error } = await this.checkUserExists(uuid);

      if (error) {
        console.warn("Error checking user existence:", error);
        return false;
      }

      if (!exists) {
        console.log("User not found in Supabase, creating...");
        const syncResult = await this.syncUserToCloud(userProfile);
        return syncResult.success;
      }

      return true;
    } catch (error) {
      console.warn("Failed to ensure user in Supabase:", error);
      return false;
    }
  }

  // Helper method for cleaner sync status management
  private static async updateSyncStatus(
    status: "synced" | "failed",
    error?: string
  ) {
    const syncStatus = {
      lastSyncAt: Math.floor(new Date().getTime() / 1000),
      status,
      ...(error && { lastError: error }),
    };

    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
  }
}
