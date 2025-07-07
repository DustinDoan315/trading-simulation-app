import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageService } from './AsyncStorageService';
import { supabase } from './SupabaseService';
import { SyncService } from './SupabaseService';

import {
  CreateTransactionParams,
  CreateUserParams,
  SyncResult,
} from "../types/database";


// services/HybridStorageService.ts

interface SyncItem {
  type: "transaction" | "user";
  data: CreateTransactionParams | CreateUserParams;
  timestamp: number;
  id: string;
  retryCount?: number;
  nextRetry?: number;
  version?: number;
}

export class HybridStorageService {
  private static async isOnline(): Promise<boolean> {
    try {
      const { data } = await supabase.rpc("is_online");
      return data === true;
    } catch {
      return false;
    }
  }

  private static async syncItemToCloud(item: SyncItem): Promise<void> {
    switch (item.type) {
      case "transaction":
        await supabase
          .from("transactions")
          .upsert(item.data as CreateTransactionParams);
        break;
      case "user":
        await supabase.from("users").upsert(item.data as CreateUserParams);
        break;
      default:
        throw new Error(`Unknown sync item type: ${item.type}`);
    }
  }

  // Critical data -> SecureStore (UUID, auth tokens)
  static async setSecure(key: string, value: string): Promise<void> {
    return await SecureStore.setItemAsync(key, value);
  }

  // User preferences -> AsyncStorage
  static async setPreference(key: string, value: unknown): Promise<void> {
    return await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  // Transaction data -> AsyncStorage + Cloud sync
  static async saveTransaction(
    transaction: CreateTransactionParams
  ): Promise<void> {
    // Save locally first for immediate UI updates
    await AsyncStorageService.addTransaction({
      ...transaction,
      timestamp:
        typeof transaction.timestamp === "string"
          ? Date.parse(transaction.timestamp)
          : transaction.timestamp || Date.now(),
    });

    // Queue for cloud sync
    await this.queueForSync("transaction", transaction);
  }

  // Offline-first approach with sync queue
  static async queueForSync(
    type: "transaction" | "user",
    data: CreateTransactionParams | CreateUserParams
  ): Promise<void> {
    const syncQueue = (await AsyncStorage.getItem("sync_queue")) || "[]";
    const queue: SyncItem[] = JSON.parse(syncQueue);

    queue.push({
      type,
      data,
      timestamp: Date.now(),
      id: Crypto.randomUUID(),
    });

    await AsyncStorage.setItem("sync_queue", JSON.stringify(queue));

    // Try immediate sync if online
    if (await this.isOnline()) {
      await this.processSyncQueue();
    }
  }

  static async processSyncQueue(): Promise<void> {
    const syncQueue = (await AsyncStorage.getItem("sync_queue")) || "[]";
    const queue: SyncItem[] = JSON.parse(syncQueue);
    const failedItems: SyncItem[] = [];

    for (const item of queue) {
      try {
        // Get current version from cloud
        const cloudVersion = await this.getCloudVersion(item);

        // Check for conflicts
        if (cloudVersion && cloudVersion > (item.version || 0)) {
          // Conflict detected - resolve using latest version
          await this.resolveConflict(item, cloudVersion);
          queue.splice(queue.indexOf(item), 1);
        } else {
          // No conflict - proceed with sync
          await this.syncItemToCloud(item);
          queue.splice(queue.indexOf(item), 1);
        }
      } catch (error) {
        console.error("Failed to sync item:", error);
        failedItems.push(item);

        // Implement exponential backoff
        item.retryCount = (item.retryCount || 0) + 1;
        item.nextRetry =
          Date.now() +
          Math.min(
            1000 * Math.pow(2, item.retryCount),
            30000 // Max 30 seconds
          );
      }
    }

    // Update queue with failed items
    await AsyncStorage.setItem(
      "sync_queue",
      JSON.stringify([...queue, ...failedItems])
    );

    // Schedule next sync if there are failed items
    if (failedItems.length > 0) {
      const nextRetry = Math.min(...failedItems.map((i) => i.nextRetry || 0));
      const delay = Math.max(0, nextRetry - Date.now());

      setTimeout(() => this.processSyncQueue(), delay);
    }
  }

  private static async resolveConflict(
    item: SyncItem,
    cloudVersion: number
  ): Promise<void> {
    // Implement your conflict resolution strategy here
    // For now we'll just take the cloud version
    console.log(
      `Resolving conflict for ${item.type} with cloud version ${cloudVersion}`
    );
    // Update AsyncStorage with cloud data
    if (item.type === "transaction") {
      const transactionData = item.data as CreateTransactionParams;
      await AsyncStorageService.addTransaction({
        ...transactionData,
        timestamp:
          typeof transactionData.timestamp === "string"
            ? Date.parse(transactionData.timestamp)
            : transactionData.timestamp || Date.now(),
      });
    } else if (item.type === "user") {
      const userData = item.data as CreateUserParams;
      const now = new Date().toISOString();
      await AsyncStorageService.createOrUpdateUser({
        id: userData.username, // Use username as id for local storage
        username: userData.username,
        usdt_balance: userData.usdt_balance || "100000",
        total_portfolio_value: userData.total_portfolio_value || "100000",
        total_pnl: "0.00",
        total_trades: 0,
        win_rate: "0.00",
        join_date: now,
        last_active: now,
        created_at: now,
        updated_at: now,
      });
    }
  }

  private static async getCloudVersion(item: SyncItem): Promise<number | null> {
    try {
      // Implementation depends on your data model
      // This is a placeholder - adjust based on your actual version tracking
      const { data, error } = await supabase
        .from(item.type === "transaction" ? "transactions" : "users")
        .select("version")
        .eq("id", (item.data as any).id)
        .single();

      if (error) {
        // Handle the case where no record exists (PGRST116 error)
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data?.version || null;
    } catch {
      return null;
    }
  }
}
