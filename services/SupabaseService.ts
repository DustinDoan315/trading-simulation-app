import { SupabaseClient, createClient } from '@supabase/supabase-js';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageService } from './AsyncStorageService';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import UUIDService from './UUIDService';

//SupabaseService.ts

// Types for better type safety
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

// Configuration validation and setup
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

// Initialize Supabase with proper configuration
const initializeSupabase = (): SupabaseClient => {
  try {
    const { url, key } = SupabaseConfig.getConfig();

    console.log("Initializing Supabase:", {
      url: url.substring(0, 30) + "...",
      keyLength: key.length,
      timestamp: new Date().toISOString(),
    });

    return createClient(url, key, {
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
      // Add retry logic at client level
      db: {
        schema: "public",
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (error) {
    console.error("Failed to initialize Supabase:", error);
    throw error;
  }
};

export const supabase = initializeSupabase();

// Network utility class
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

// Offline queue management
class OfflineQueue {
  private static QUEUE_KEY = "@sync_queue";
  private static MAX_QUEUE_SIZE = 100;

  static async addToQueue(
    operation: Omit<QueuedOperation, "id" | "retryCount">
  ): Promise<void> {
    try {
      const queue = await this.getQueue();

      if (queue.length >= this.MAX_QUEUE_SIZE) {
        // Remove oldest operations if queue is full
        queue.splice(0, queue.length - this.MAX_QUEUE_SIZE + 1);
      }

      const queuedOp: QueuedOperation = {
        ...operation,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        retryCount: 0,
      };

      queue.push(queuedOp);
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));

      console.log(
        `Added operation to queue: ${queuedOp.type} (Queue size: ${queue.length})`
      );
    } catch (error) {
      console.error("Failed to add operation to queue:", error);
    }
  }

  static async getQueue(): Promise<QueuedOperation[]> {
    try {
      const queueData = await AsyncStorage.getItem(this.QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error("Failed to get queue:", error);
      return [];
    }
  }

  static async removeFromQueue(operationId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filteredQueue = queue.filter((op) => op.id !== operationId);
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(filteredQueue));
    } catch (error) {
      console.error("Failed to remove operation from queue:", error);
    }
  }

  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.QUEUE_KEY);
    } catch (error) {
      console.error("Failed to clear queue:", error);
    }
  }
}

// Type guards for operation payloads
interface UserSyncPayload {
  uuid: string;
}

interface PortfolioSyncPayload {
  uuid: string;
  portfolio: Array<{
    symbol: string;
    quantity: string;
    avg_cost: string;
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

// Enhanced Sync Service with network resilience
export class SyncService {
  private static readonly SYNC_STATUS_KEY = "@sync_status";
  private static readonly RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  };

  // Type guard methods
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

  // Test Supabase connection
  static async testConnection(): Promise<SyncResult<boolean>> {
    try {
      console.log("Testing Supabase connection...");

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
        .select("count")
        .limit(1);

      if (error) {
        return {
          success: false,
          error: `Connection test failed: ${error.message}`,
          timestamp: new Date().toISOString(),
        };
      }

      console.log("Supabase connection successful");
      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Connection test failed:", errorMessage);
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Execute operation with retry logic
  private static async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    customRetries?: number
  ): Promise<T> {
    const maxRetries = customRetries || this.RETRY_CONFIG.maxRetries;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check network before each attempt
        const networkStatus = await NetworkUtils.getNetworkStatus();
        if (!networkStatus.isConnected) {
          throw new Error("No network connection available");
        }

        console.log(`${context} - Attempt ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.log(
          `${context} failed (attempt ${attempt}):`,
          lastError.message
        );

        if (attempt < maxRetries) {
          const delay = Math.min(
            this.RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
            this.RETRY_CONFIG.maxDelay
          );
          console.log(`Retrying ${context} in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // Update sync status
  private static async updateSyncStatus(
    operation: string,
    status: "synced" | "failed" | "pending",
    error?: string
  ): Promise<void> {
    try {
      const syncStatus = {
        [operation]: {
          lastSyncAt: new Date().toISOString(),
          status,
          ...(error && { lastError: error }),
        },
      };

      const existingStatus = await AsyncStorage.getItem(this.SYNC_STATUS_KEY);
      const currentStatus = existingStatus ? JSON.parse(existingStatus) : {};

      await AsyncStorage.setItem(
        this.SYNC_STATUS_KEY,
        JSON.stringify({ ...currentStatus, ...syncStatus })
      );
    } catch (error) {
      console.error("Failed to update sync status:", error);
    }
  }

  // Enhanced user data sync
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

  // Enhanced sync from cloud
  static async syncFromCloud(uuid: string): Promise<SyncResult> {
    try {
      await this.updateSyncStatus("cloudSync", "pending");

      const result = await this.executeWithRetry(async () => {
        // Get cloud data with proper error handling
        const { data: cloudPortfolio, error } = await supabase
          .from("portfolios")
          .select("*")
          .eq("user_id", uuid);

        if (error) {
          throw new Error(`Failed to fetch portfolio: ${error.message}`);
        }

        // Update local database
        if (cloudPortfolio && cloudPortfolio.length > 0) {
          console.log(
            `Syncing ${cloudPortfolio.length} portfolio items from cloud`
          );

          for (const asset of cloudPortfolio) {
            await AsyncStorageService.updatePortfolioAsset(asset);
          }
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

  // Enhanced portfolio sync with batch operations - MERGE strategy
  private static async syncPortfolioToCloud(
    uuid: string,
    portfolio: Array<{
      symbol: string;
      quantity: string;
      avg_cost: string;
      image?: string | null;
    }>
  ): Promise<void> {
    if (!portfolio || portfolio.length === 0) return;

    // Ensure user exists in Supabase before syncing portfolio
    const userExists = await UUIDService.ensureUserInSupabase(uuid);
    if (!userExists) {
      console.error("❌ Cannot sync portfolio: user does not exist in Supabase");
      throw new Error("User does not exist in Supabase. Please ensure user is created first.");
    }

    console.log("🔄 Starting portfolio sync with MERGE strategy...");
    console.log("📊 Local portfolio items:", portfolio.length);

    // Step 1: Get existing portfolio from cloud
    const { data: existingPortfolio, error: fetchError } = await supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", uuid);

    if (fetchError) {
      console.error("❌ Failed to fetch existing portfolio:", fetchError);
      throw new Error(`Failed to fetch existing portfolio: ${fetchError.message}`);
    }

    console.log("☁️ Existing cloud portfolio items:", existingPortfolio?.length || 0);

    // Step 2: Create a map of existing portfolio for quick lookup
    const existingPortfolioMap = new Map<string, any>();
    if (existingPortfolio) {
      existingPortfolio.forEach((item: any) => {
        existingPortfolioMap.set(item.symbol.toUpperCase(), item);
      });
    }

    // Step 3: Create a map of new portfolio for quick lookup
    const newPortfolioMap = new Map<string, any>();
    portfolio.forEach((item: any) => {
      newPortfolioMap.set(item.symbol.toUpperCase(), item);
    });

    // Step 4: Prepare operations
    const operations: Array<{
      user_id: string;
      symbol: string;
      quantity: string;
      avg_cost: string;
      image: string | null;
      last_updated: string;
    }> = [];
    const symbolsToUpdate = new Set<string>();
    const symbolsToInsert = new Set<string>();

    // Process each item in the new portfolio
    portfolio.forEach((asset) => {
      const symbol = asset.symbol.toUpperCase();
      const existingAsset = existingPortfolioMap.get(symbol);

      if (existingAsset) {
        // Asset exists - check if it needs updating
        const needsUpdate = 
          existingAsset.quantity !== asset.quantity ||
          existingAsset.avg_cost !== asset.avg_cost ||
          existingAsset.image !== (asset.image || null);

        if (needsUpdate) {
          operations.push({
            user_id: uuid,
            symbol: symbol,
            quantity: asset.quantity,
            avg_cost: asset.avg_cost,
            image: asset.image || null,
            last_updated: new Date().toISOString(),
          });
          symbolsToUpdate.add(symbol);
          console.log(`🔄 Will update: ${symbol}`);
        } else {
          console.log(`✅ No changes needed: ${symbol}`);
        }
      } else {
        // New asset - insert
        operations.push({
          user_id: uuid,
          symbol: symbol,
          quantity: asset.quantity,
          avg_cost: asset.avg_cost,
          image: asset.image || null,
          last_updated: new Date().toISOString(),
        });
        symbolsToInsert.add(symbol);
        console.log(`➕ Will insert: ${symbol}`);
      }
    });

    // Step 5: Check for assets that exist in cloud but not in local portfolio
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

    // Step 6: Execute operations
    if (operations.length > 0) {
      const { data: upsertData, error: upsertError } = await supabase
        .from("portfolios")
        .upsert(operations, {
          onConflict: "user_id,symbol",
          ignoreDuplicates: false,
        })
        .select();

      if (upsertError) {
        console.error("❌ Supabase upsert error:", upsertError);
        throw new Error(`Portfolio sync failed: ${upsertError.message}`);
      }

      console.log(`✅ Successfully upserted ${upsertData?.length || 0} portfolio items`);
    }

    // Step 7: Delete assets that are no longer in local portfolio
    if (symbolsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("portfolios")
        .delete()
        .eq("user_id", uuid)
        .in("symbol", symbolsToDelete);

      if (deleteError) {
        console.error("❌ Failed to delete removed assets:", deleteError);
        // Don't throw here - the main sync succeeded
      } else {
        console.log(`✅ Successfully deleted ${symbolsToDelete.length} removed assets`);
      }
    }

    console.log(`✅ Portfolio sync completed successfully:
      - Total items in cloud: ${(existingPortfolio?.length || 0) + symbolsToInsert.size - symbolsToDelete.length}
      - Local items: ${portfolio.length}`);
  }

  // Public method for portfolio sync
  static async syncPortfolio(
    uuid: string,
    portfolio: any[]
  ): Promise<SyncResult> {
    console.log("====================================");
    console.log("SyncService.syncPortfolio called");
    console.log("UUID:", uuid);
    console.log("Portfolio data:", JSON.stringify(portfolio, null, 2));
    console.log("Portfolio length:", portfolio.length);
    console.log("====================================");

    try {
      await this.updateSyncStatus("portfolioSync", "pending");
      console.log("✅ Sync status set to pending");

      const result = await this.executeWithRetry(async () => {
        console.log("🔄 Executing syncPortfolioToCloud...");
        await this.syncPortfolioToCloud(uuid, portfolio);
        console.log("✅ syncPortfolioToCloud completed successfully");
        return portfolio;
      }, "Portfolio Sync");

      await this.updateSyncStatus("portfolioSync", "synced");
      console.log("✅ Sync status set to synced");

      const successResult = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };

      console.log(
        "✅ syncPortfolio returning success:",
        JSON.stringify(successResult, null, 2)
      );
      return successResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Portfolio sync failed:", errorMessage);
      console.error("❌ Error details:", error);
      console.error(
        "❌ Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );

      // Add to offline queue if network related
      if (
        errorMessage.includes("Network") ||
        errorMessage.includes("network")
      ) {
        console.log("📱 Adding to offline queue due to network error");
        await OfflineQueue.addToQueue({
          type: "portfolio_sync",
          payload: { uuid, portfolio },
          timestamp: new Date().toISOString(),
          maxRetries: 5,
        });
      }

      await this.updateSyncStatus("portfolioSync", "failed", errorMessage);
      console.log("❌ Sync status set to failed");

      const errorResult = {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };

      console.log(
        "❌ syncPortfolio returning error:",
        JSON.stringify(errorResult, null, 2)
      );
      return errorResult;
    }
  }

  // DEPRECATED: Clear existing portfolio data for a user
  // This method is deprecated as we now use MERGE strategy instead of clearing
  static async clearUserPortfolio(uuid: string): Promise<SyncResult> {
    console.warn("⚠️ clearUserPortfolio is deprecated. Use MERGE strategy instead.");
    
    try {
      console.log("🗑️ Clearing portfolio data for user:", uuid);

      const { error } = await supabase
        .from("portfolios")
        .delete()
        .eq("user_id", uuid);

      if (error) {
        console.error("❌ Failed to clear portfolio:", error);
        return {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }

      console.log("✅ Portfolio cleared successfully");
      return {
        success: true,
        data: { message: "Portfolio cleared" },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Error clearing portfolio:", errorMessage);
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Enhanced collections sync
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
      console.error("Collections sync failed:", errorMessage);
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
      console.error("Failed to sync collections from cloud:", error);
      return [];
    }
  }

  // Process offline queue when connection is restored
  static async processOfflineQueue(): Promise<SyncResult> {
    try {
      const networkStatus = await NetworkUtils.getNetworkStatus();
      if (!networkStatus.isConnected) {
        return {
          success: false,
          error: "No network connection to process queue",
          timestamp: new Date().toISOString(),
        };
      }

      const queue = await OfflineQueue.getQueue();
      if (queue.length === 0) {
        return {
          success: true,
          data: { processed: 0 },
          timestamp: new Date().toISOString(),
        };
      }

      console.log(`Processing ${queue.length} queued operations`);
      let processedCount = 0;
      const failedOps: string[] = [];

      for (const operation of queue) {
        try {
          switch (operation.type) {
            case "user_sync":
              if (this.isUserSyncPayload(operation.payload)) {
                await this.syncUserData(operation.payload.uuid);
              }
              break;
            case "portfolio_sync":
              if (this.isPortfolioSyncPayload(operation.payload)) {
                await this.syncPortfolioToCloud(
                  operation.payload.uuid,
                  operation.payload.portfolio
                );
              }
              break;
            case "collection_sync":
              if (this.isCollectionSyncPayload(operation.payload)) {
                await this.syncCollectionsToCloud(
                  operation.payload.collections
                );
              }
              break;
          }

          await OfflineQueue.removeFromQueue(operation.id);
          processedCount++;
        } catch (error) {
          console.error(
            `Failed to process queued operation ${operation.id}:`,
            error
          );
          failedOps.push(operation.id);

          // Update retry count
          operation.retryCount++;
          if (operation.retryCount >= operation.maxRetries) {
            console.log(
              `Removing failed operation ${operation.id} after ${operation.retryCount} retries`
            );
            await OfflineQueue.removeFromQueue(operation.id);
          }
        }
      }

      return {
        success: true,
        data: {
          processed: processedCount,
          failed: failedOps.length,
          remaining: queue.length - processedCount,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to process offline queue:", errorMessage);
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Get sync status for monitoring
  static async getSyncStatus(): Promise<any> {
    try {
      const statusData = await AsyncStorage.getItem(this.SYNC_STATUS_KEY);
      return statusData ? JSON.parse(statusData) : {};
    } catch (error) {
      console.error("Failed to get sync status:", error);
      return {};
    }
  }

  // Add new method to update user balance in Supabase
  static async updateUserBalance(
    uuid: string,
    newBalance: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("users")
        .update({ balance: newBalance.toString() })
        .eq("uuid", uuid);

      if (error) {
        throw new Error(
          `Failed to update user balance in Supabase: ${error.message}`
        );
      }
    } catch (error) {
      console.error("Error updating user balance in Supabase:", error);
      throw error;
    }
  }

  // Utility function to handle sync status notifications
  static async notifySyncStatus(
    operation: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      const status = success ? "synced" : "failed";
      await this.updateSyncStatus(operation, status, error);

      // Log sync status for debugging
      console.log(`Sync ${operation}: ${status}${error ? ` - ${error}` : ""}`);

      // TODO: Add user notification here if needed
      // You can integrate with your notification system to show sync status to users
      // Example: showToast(success ? 'success' : 'error', 'Sync Status', message);
    } catch (notificationError) {
      console.error("Failed to notify sync status:", notificationError);
    }
  }

  // Enhanced sync status monitoring
  static async getDetailedSyncStatus(): Promise<{
    lastSyncAt: string | null;
    syncStatus: Record<
      string,
      { status: string; lastError?: string; lastSyncAt: string }
    >;
    hasPendingOperations: boolean;
  }> {
    try {
      const [statusData, queue] = await Promise.all([
        AsyncStorage.getItem(this.SYNC_STATUS_KEY),
        OfflineQueue.getQueue(),
      ]);

      const syncStatus = statusData ? JSON.parse(statusData) : {};
      const lastSyncAt = await AsyncStorage.getItem("last_sync");

      return {
        lastSyncAt,
        syncStatus,
        hasPendingOperations: queue.length > 0,
      };
    } catch (error) {
      console.error("Failed to get detailed sync status:", error);
      return {
        lastSyncAt: null,
        syncStatus: {},
        hasPendingOperations: false,
      };
    }
  }
}
