import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import NetInfo from "@react-native-community/netinfo";
import UUIDService from "./UUIDService";
import { AsyncStorageService } from "./AsyncStorageService";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/utils/logger";

interface SyncResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

interface NetworkStatus {
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean | null;
}

interface QueuedOperation {
  id: string;
  type: "user_sync" | "portfolio_sync" | "collection_sync";
  payload: unknown;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

class SupabaseConfig {
  private static validateConfig(url: string, key: string): void {
    if (!url || !key) {
      throw new Error(`Supabase configuration missing:
        URL: ${url ? "Set" : "Missing"}
        Key: ${key ? "Set" : "Missing"}

        Check your environment variables:
        - EXPO_PUBLIC_SUPABASE_URL
        - EXPO_PUBLIC_SUPABASE_KEY`);
    }

    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      throw new Error("Supabase URL must start with https:// or http://");
    }
  }

  static getConfig() {
    const url =
      Constants.expoConfig?.extra?.SUPABASE_URL ||
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      "";
    const key =
      Constants.expoConfig?.extra?.SUPABASE_ANON_KEY ||
      process.env.EXPO_PUBLIC_SUPABASE_KEY ||
      "";

    this.validateConfig(url, key);
    return { url, key };
  }
}

const initializeSupabase = (): SupabaseClient => {
  const config = SupabaseConfig.getConfig();

  logger.info("Initializing Supabase", "SupabaseService", {
    url: config.url,
    hasKey: !!config.key,
  });

  const supabase = createClient(config.url, config.key, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "x-client-info": "react-native-app",
      },
    },
    db: {
      schema: "public",
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return supabase;
};

export const supabase = initializeSupabase();

class NetworkUtils {
  static async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      const netInfo = await NetInfo.fetch();
      return {
        isConnected: netInfo.isConnected ?? false,
        type: netInfo.type,
        isInternetReachable: netInfo.isInternetReachable,
      };
    } catch (error) {
      console.warn("Failed to get network status:", error);
      return {
        isConnected: false,
        type: "unknown",
        isInternetReachable: false,
      };
    }
  }

  static async waitForConnection(timeout = 30000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getNetworkStatus();
      if (status.isConnected && status.isInternetReachable !== false) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return false;
  }
}

export const handleSupabaseError = (error: any, context: string): any => {
  logger.error(`Supabase error in ${context}`, "SupabaseService", error);
  return error;
};

class OfflineQueue {
  private static QUEUE_KEY = "@sync_queue";
  private static MAX_QUEUE_SIZE = 100;

  static async addToQueue(
    operation: Omit<QueuedOperation, "id" | "retryCount">
  ): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newOperation: QueuedOperation = {
        ...operation,
        id: Math.random().toString(36).substr(2, 9),
        retryCount: 0,
      };

      queue.push(newOperation);

      if (queue.length > this.MAX_QUEUE_SIZE) {
        queue.shift();
      }

      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
      logger.info(
        `Added operation to queue: ${operation.type}`,
        "OfflineQueue"
      );
    } catch (error) {
      logger.error("Failed to add operation to queue", "OfflineQueue", error);
    }
  }

  static async getQueue(): Promise<QueuedOperation[]> {
    try {
      const queueStr = await AsyncStorage.getItem(this.QUEUE_KEY);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch (error) {
      logger.error("Failed to get queue", "OfflineQueue", error);
      return [];
    }
  }

  static async removeFromQueue(operationId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filteredQueue = queue.filter((op) => op.id !== operationId);
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(filteredQueue));
    } catch (error) {
      logger.error(
        "Failed to remove operation from queue",
        "OfflineQueue",
        error
      );
    }
  }

  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.QUEUE_KEY);
    } catch (error) {
      logger.error("Failed to clear queue", "OfflineQueue", error);
    }
  }
}

interface UserSyncPayload {
  uuid: string;
}

interface PortfolioSyncPayload {
  uuid: string;
  portfolio: Array<{
    symbol: string;
    quantity: string;
    avg_cost: string;
    current_price?: string;
    total_value?: string;
    profit_loss?: string;
    profit_loss_percent?: string;
    image?: string | null;
  }>;
}

interface CollectionSyncPayload {
  collections: Array<{
    id: number;
    name: string;
    ownerId: string;
    invite_code: string;
    rules: string;
  }>;
}

export class SyncService {
  private static readonly SYNC_STATUS_KEY = "@sync_status";
  private static readonly RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  };

  private static isUserSyncPayload(
    payload: unknown
  ): payload is UserSyncPayload {
    return typeof payload === "object" && payload !== null && "uuid" in payload;
  }

  private static isPortfolioSyncPayload(
    payload: unknown
  ): payload is PortfolioSyncPayload {
    return (
      typeof payload === "object" &&
      payload !== null &&
      "uuid" in payload &&
      "portfolio" in payload
    );
  }

  private static isCollectionSyncPayload(
    payload: unknown
  ): payload is CollectionSyncPayload {
    return (
      typeof payload === "object" &&
      payload !== null &&
      "collections" in payload
    );
  }

  static async testConnection(): Promise<SyncResult<boolean>> {
    try {
      logger.info("Testing Supabase connection", "SyncService");

      const networkStatus = await NetworkUtils.getNetworkStatus();
      if (!networkStatus.isConnected) {
        return {
          success: false,
          error: "No network connection",
          timestamp: new Date().toISOString(),
        };
      }

      const { data, error } = await supabase
        .from("users")
        .select("id")
        .limit(1);

      if (error) {
        throw new Error(error.message);
      }

      logger.info("Supabase connection successful", "SyncService");
      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Connection test failed", "SyncService", errorMessage);
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private static async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    customRetries?: number
  ): Promise<T> {
    const maxRetries = customRetries || this.RETRY_CONFIG.maxRetries;
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        logger.info(
          `${context} - Attempt ${attempt}/${maxRetries}`,
          "SyncService"
        );

        const result = await operation();

        logger.info(`${context} completed successfully`, "SyncService");
        return result;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = this.RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1);
        logger.info(`Retrying ${context} in ${delay}ms`, "SyncService");

        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
      }
    }

    throw new Error(`${context} failed after ${maxRetries} attempts`);
  }

  private static async updateSyncStatus(
    operation: string,
    status: "synced" | "failed" | "pending",
    error?: string
  ): Promise<void> {
    try {
      const syncStatus = {
        lastSyncAt: Math.floor(new Date().getTime() / 1000),
        status,
        ...(error && { lastError: error }),
      };

      await AsyncStorage.setItem(
        `${this.SYNC_STATUS_KEY}_${operation}`,
        JSON.stringify(syncStatus)
      );
    } catch (error) {
      logger.error("Failed to update sync status", "SyncService", error);
    }
  }

  static async syncUserData(uuid: string): Promise<SyncResult> {
    try {
      await this.updateSyncStatus("userSync", "pending");

      const result = await this.executeWithRetry(async () => {
        // Get local data
        const localPortfolio = await AsyncStorageService.getUserPortfolio(uuid);
        const localBalance = await AsyncStorage.getItem("user_balance");

        // Sync to Supabase
        await this.syncPortfolioToCloud(uuid, localPortfolio);

        return { portfolio: localPortfolio, balance: localBalance };
      }, "User Data Sync");

      // Update sync timestamp
      await AsyncStorage.setItem("last_sync", new Date().toISOString());
      await this.updateSyncStatus("userSync", "synced");

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("User sync failed:", errorMessage);

      // Add to offline queue if network related
      if (
        errorMessage.includes("Network") ||
        errorMessage.includes("network")
      ) {
        await OfflineQueue.addToQueue({
          type: "user_sync",
          payload: { uuid },
          timestamp: new Date().toISOString(),
          maxRetries: 5,
        });
      }

      await this.updateSyncStatus("userSync", "failed", errorMessage);
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async syncFromCloud(uuid: string): Promise<SyncResult> {
    try {
      await this.updateSyncStatus("cloudSync", "pending");

      const result = await this.executeWithRetry(async () => {
        // Get cloud data with proper error handling
        const { data: cloudPortfolio, error } = await supabase
          .from("portfolio")
          .select("*")
          .eq("user_id", uuid);

        if (error) {
          throw new Error(`Failed to fetch portfolio: ${error.message}`);
        }

        if (cloudPortfolio && cloudPortfolio.length > 0) {
          console.log(
            `Syncing ${cloudPortfolio.length} portfolio items from cloud`
          );
        }

        return cloudPortfolio;
      }, "Cloud Data Sync");

      await this.updateSyncStatus("cloudSync", "synced");
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Cloud sync failed:", errorMessage);
      await this.updateSyncStatus("cloudSync", "failed", errorMessage);

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private static async syncPortfolioToCloud(
    uuid: string,
    portfolio: Array<{
      symbol: string;
      quantity: string;
      avg_cost: string;
      current_price?: string;
      total_value?: string;
      profit_loss?: string;
      profit_loss_percent?: string;
      image?: string | null;
    }>
  ): Promise<void> {
    if (!portfolio || portfolio.length === 0) return;

    const userExists = await UUIDService.ensureUserInSupabase(uuid);
    if (!userExists) {
      console.error(
        "❌ Cannot sync portfolio: user does not exist in Supabase"
      );
      throw new Error(
        "User does not exist in Supabase. Please ensure user is created first."
      );
    }

    console.log("🔄 Starting portfolio sync with MERGE strategy...");
    console.log("📊 Local portfolio items:", portfolio.length);

    const { data: existingPortfolio, error: fetchError } = await supabase
      .from("portfolio")
      .select("*")
      .eq("user_id", uuid);

    if (fetchError) {
      console.error("❌ Failed to fetch existing portfolio:", fetchError);
      throw new Error(
        `Failed to fetch existing portfolio: ${fetchError.message}`
      );
    }

    console.log(
      "☁️ Existing cloud portfolio items:",
      existingPortfolio?.length || 0
    );

    const existingPortfolioMap = new Map<string, any>();
    if (existingPortfolio) {
      existingPortfolio.forEach((item: any) => {
        existingPortfolioMap.set(item.symbol.toUpperCase(), item);
      });
    }

    const newPortfolioMap = new Map<string, any>();
    portfolio.forEach((item: any) => {
      newPortfolioMap.set(item.symbol.toUpperCase(), item);
    });

    const operations: Array<{
      user_id: string;
      symbol: string;
      quantity: string;
      avg_cost: string;
      current_price: string;
      total_value: string;
      profit_loss: string;
      profit_loss_percent: string;
      image_url: string | null;
      last_updated: string;
    }> = [];
    const symbolsToUpdate = new Set<string>();
    const symbolsToInsert = new Set<string>();

    portfolio.forEach((asset) => {
      const symbol = asset.symbol.toUpperCase();
      const existingAsset = existingPortfolioMap.get(symbol);

      if (existingAsset) {
        const needsUpdate =
          existingAsset.quantity !== asset.quantity ||
          existingAsset.avg_cost !== asset.avg_cost ||
          existingAsset.current_price !== (asset.current_price || "0") ||
          existingAsset.total_value !== (asset.total_value || "0") ||
          existingAsset.profit_loss !== (asset.profit_loss || "0") ||
          existingAsset.profit_loss_percent !==
            (asset.profit_loss_percent || "0") ||
          existingAsset.image_url !== (asset.image || null);

        if (needsUpdate) {
          operations.push({
            user_id: uuid,
            symbol: symbol,
            quantity: asset.quantity,
            avg_cost: asset.avg_cost,
            current_price: asset.current_price || "0",
            total_value: asset.total_value || "0",
            profit_loss: asset.profit_loss || "0",
            profit_loss_percent: asset.profit_loss_percent || "0",
            image_url: asset.image || null,
            last_updated: new Date().toISOString(),
          });
          symbolsToUpdate.add(symbol);
          console.log(`🔄 Will update: ${symbol}`);
        } else {
          console.log(`✅ No changes needed: ${symbol}`);
        }
      } else {
        operations.push({
          user_id: uuid,
          symbol: symbol,
          quantity: asset.quantity,
          avg_cost: asset.avg_cost,
          current_price: asset.current_price || "0",
          total_value: asset.total_value || "0",
          profit_loss: asset.profit_loss || "0",
          profit_loss_percent: asset.profit_loss_percent || "0",
          image_url: asset.image || null,
          last_updated: new Date().toISOString(),
        });
        symbolsToInsert.add(symbol);
        console.log(`➕ Will insert: ${symbol}`);
      }
    });

    const symbolsToDelete: string[] = [];
    existingPortfolio?.forEach((cloudAsset: any) => {
      const symbol = cloudAsset.symbol.toUpperCase();
      if (!newPortfolioMap.has(symbol)) {
        symbolsToDelete.push(symbol);
        console.log(`🗑️ Will delete: ${symbol} (not in local portfolio)`);
      }
    });

    console.log(`📋 Operations summary:
      - Insert: ${symbolsToInsert.size} items
      - Update: ${symbolsToUpdate.size} items  
      - Delete: ${symbolsToDelete.length} items
      - Total operations: ${operations.length}`);

    if (operations.length > 0) {
      const { data: upsertData, error: upsertError } = await supabase
        .from("portfolio")
        .upsert(operations, {
          onConflict: "user_id,symbol",
          ignoreDuplicates: false,
        })
        .select();

      if (upsertError) {
        console.error("❌ Supabase upsert error:", upsertError);
        throw new Error(`Portfolio sync failed: ${upsertError.message}`);
      }

      console.log(
        `✅ Successfully upserted ${upsertData?.length || 0} portfolio items`
      );
    }

    if (symbolsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("portfolio")
        .delete()
        .eq("user_id", uuid)
        .in("symbol", symbolsToDelete);

      if (deleteError) {
        console.error("❌ Failed to delete removed assets:", deleteError);
      } else {
        console.log(
          `✅ Successfully deleted ${symbolsToDelete.length} removed assets`
        );
      }
    }

    console.log(`✅ Portfolio sync completed successfully:
      - Total items in cloud: ${
        (existingPortfolio?.length || 0) +
        symbolsToInsert.size -
        symbolsToDelete.length
      }
      - Local items: ${portfolio.length}`);
  }

  static async syncPortfolio(
    uuid: string,
    portfolio: any[]
  ): Promise<SyncResult> {
    logger.info("Starting portfolio sync", "SyncService", {
      uuid,
      portfolioLength: portfolio.length,
    });

    try {
      await this.updateSyncStatus("portfolioSync", "pending");

      const result = await this.executeWithRetry(async () => {
        await this.syncPortfolioToCloud(uuid, portfolio);
        return portfolio;
      }, "Portfolio Sync");

      await this.updateSyncStatus("portfolioSync", "synced");

      const successResult = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };

      logger.info(
        "Portfolio sync completed successfully",
        "SyncService",
        successResult
      );
      return successResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Portfolio sync failed", "SyncService", {
        error: errorMessage,
        details: error,
      });

      if (
        errorMessage.includes("Network") ||
        errorMessage.includes("network")
      ) {
        logger.info(
          "Adding to offline queue due to network error",
          "SyncService"
        );
        await OfflineQueue.addToQueue({
          type: "portfolio_sync",
          payload: { uuid, portfolio },
          timestamp: new Date().toISOString(),
          maxRetries: 5,
        });
      }

      await this.updateSyncStatus("portfolioSync", "failed", errorMessage);

      const errorResult = {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };

      return errorResult;
    }
  }

  static async clearUserPortfolio(uuid: string): Promise<SyncResult> {
    logger.warn(
      "clearUserPortfolio is deprecated. Use MERGE strategy instead.",
      "SyncService"
    );

    try {
      logger.info("Clearing portfolio data for user", "SyncService", { uuid });

      const { error } = await supabase
        .from("portfolio")
        .delete()
        .eq("user_id", uuid);

      if (error) {
        logger.error("Failed to clear portfolio", "SyncService", error);
        return {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }

      logger.info("Portfolio cleared successfully", "SyncService");
      return {
        success: true,
        data: { message: "Portfolio cleared" },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Error clearing portfolio", "SyncService", errorMessage);
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async syncCollectionsToCloud(collections: any[]): Promise<SyncResult> {
    try {
      await this.updateSyncStatus("collectionsSync", "pending");

      const result = await this.executeWithRetry(async () => {
        if (!collections || collections.length === 0) {
          return [];
        }

        const collectionsData = collections.map((collection) => ({
          id: collection.id,
          name: collection.name,
          owner_id: collection.ownerId,
          invite_code: collection.inviteCode,
          rules: collection.rules,
          last_updated: new Date().toISOString(),
        }));

        const { data, error } = await supabase
          .from("collections")
          .upsert(collectionsData)
          .select();

        if (error) {
          throw new Error(`Collections sync failed: ${error.message}`);
        }

        return data;
      }, "Collections Sync");

      await this.updateSyncStatus("collectionsSync", "synced");
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Collections sync failed", "SyncService", errorMessage);
      await this.updateSyncStatus("collectionsSync", "failed", errorMessage);

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async syncCollectionsFromCloud(uuid: string): Promise<any[]> {
    try {
      const result = await this.executeWithRetry(async () => {
        const { data: cloudCollections, error } = await supabase
          .from("collections")
          .select("*")
          .eq("owner_id", uuid);

        if (error) {
          throw new Error(`Failed to fetch collections: ${error.message}`);
        }

        return cloudCollections || [];
      }, "Collections From Cloud Sync");

      return result.map((c: any) => ({
        id: c.id,
        name: c.name,
        ownerId: c.owner_id,
        inviteCode: c.invite_code,
        rules: c.rules,
      }));
    } catch (error) {
      logger.error(
        "Failed to sync collections from cloud",
        "SyncService",
        error
      );
      return [];
    }
  }

  static async processOfflineQueue(): Promise<SyncResult> {
    try {
      const queue = await OfflineQueue.getQueue();

      if (queue.length === 0) {
        return {
          success: true,
          data: { message: "No queued operations" },
          timestamp: new Date().toISOString(),
        };
      }

      logger.info(
        `Processing ${queue.length} queued operations`,
        "SyncService"
      );

      const results = [];
      for (const operation of queue) {
        try {
          let result;
          switch (operation.type) {
            case "user_sync":
              if (this.isUserSyncPayload(operation.payload)) {
                result = await this.syncUserData(operation.payload.uuid);
              }
              break;
            case "portfolio_sync":
              if (this.isPortfolioSyncPayload(operation.payload)) {
                result = await this.syncPortfolio(
                  operation.payload.uuid,
                  operation.payload.portfolio
                );
              }
              break;
            case "collection_sync":
              if (this.isCollectionSyncPayload(operation.payload)) {
                result = await this.syncCollectionsToCloud(
                  operation.payload.collections
                );
              }
              break;
          }

          if (result?.success) {
            await OfflineQueue.removeFromQueue(operation.id);
            results.push({ operation: operation.type, success: true });
          } else {
            operation.retryCount++;
            if (operation.retryCount >= operation.maxRetries) {
              await OfflineQueue.removeFromQueue(operation.id);
              results.push({
                operation: operation.type,
                success: false,
                error: "Max retries exceeded",
              });
            } else {
              results.push({
                operation: operation.type,
                success: false,
                error: "Retry scheduled",
              });
            }
          }
        } catch (error) {
          logger.error(
            `Failed to process operation ${operation.type}`,
            "SyncService",
            error
          );
          results.push({
            operation: operation.type,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      logger.info(
        `Offline queue processing completed: ${successCount}/${results.length} successful`,
        "SyncService",
        { results }
      );

      return {
        success: true,
        data: { results },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        "Failed to process offline queue",
        "SyncService",
        errorMessage
      );
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async getSyncStatus(): Promise<any> {
    try {
      const status = await AsyncStorage.getItem(this.SYNC_STATUS_KEY);
      return status ? JSON.parse(status) : null;
    } catch (error) {
      logger.error("Failed to get sync status", "SyncService", error);
      return null;
    }
  }

  static async updateUserBalance(
    userId: string,
    newBalance: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("users")
        .update({ usdt_balance: newBalance.toString() })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      logger.info(
        `User USDT balance updated in Supabase: ${newBalance}`,
        "SyncService"
      );
    } catch (error) {
      logger.error("Supabase update error", "SyncService", error);
      throw error;
    }
  }

  static async updateUserBalanceAndPortfolioValue(
    userId: string,
    usdtBalance: number,
    totalPortfolioValue: number,
    totalPnL: number,
    totalPnLPercentage: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          usdt_balance: usdtBalance.toString(),
          total_portfolio_value: totalPortfolioValue.toString(),
          total_pnl: totalPnL.toString(),
          total_pnl_percentage: totalPnLPercentage.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      logger.info(
        "User balance and portfolio value updated in Supabase",
        "SyncService",
        { usdtBalance, totalPortfolioValue, totalPnL, totalPnLPercentage }
      );
    } catch (error) {
      logger.error(
        "Error in updateUserBalanceAndPortfolioValue",
        "SyncService",
        error
      );
      throw error;
    }
  }

  static async notifySyncStatus(
    operation: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      const status = success ? "completed" : "failed";
      logger.info(
        `Sync ${operation}: ${status}${error ? ` - ${error}` : ""}`,
        "SyncService"
      );
    } catch (notificationError) {
      logger.error(
        "Failed to notify sync status",
        "SyncService",
        notificationError
      );
    }
  }

  static async getDetailedSyncStatus(): Promise<{
    lastSyncAt: string | null;
    syncStatus: Record<
      string,
      { status: string; lastError?: string; lastSyncAt: string }
    >;
    hasPendingOperations: boolean;
  }> {
    try {
      const operations = ["userSync", "portfolioSync", "collectionsSync"];
      const syncStatus: Record<string, any> = {};
      let hasPendingOperations = false;

      for (const operation of operations) {
        const statusStr = await AsyncStorage.getItem(
          `${this.SYNC_STATUS_KEY}_${operation}`
        );
        if (statusStr) {
          const status = JSON.parse(statusStr);
          syncStatus[operation] = status;
          if (status.status === "pending") {
            hasPendingOperations = true;
          }
        }
      }

      const lastSyncAt = await AsyncStorage.getItem(this.SYNC_STATUS_KEY);
      const lastSync = lastSyncAt ? JSON.parse(lastSyncAt) : null;

      return {
        lastSyncAt: lastSync?.lastSyncAt || null,
        syncStatus,
        hasPendingOperations,
      };
    } catch (error) {
      logger.error("Failed to get detailed sync status", "SyncService", error);
      return {
        lastSyncAt: null,
        syncStatus: {},
        hasPendingOperations: false,
      };
    }
  }
}
