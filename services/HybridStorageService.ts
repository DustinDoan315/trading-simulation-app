// services/HybridStorageService.ts
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DatabaseService } from "./DatabaseService";
import { supabase } from "./SupabaseService";
import { SyncService } from "./SupabaseService";

export class HybridStorageService {
  private static async isOnline(): Promise<boolean> {
    try {
      const { data } = await supabase.rpc("is_online");
      return data === true;
    } catch {
      return false;
    }
  }

  private static async syncItemToCloud(item: any): Promise<void> {
    switch (item.type) {
      case "transaction":
        await supabase.from("transactions").upsert(item.data);
        break;
      case "user":
        await supabase.from("users").upsert(item.data);
        break;
      default:
        throw new Error(`Unknown sync item type: ${item.type}`);
    }
  }
  // Critical data -> SecureStore (UUID, auth tokens)
  static async setSecure(key: string, value: string) {
    return await SecureStore.setItemAsync(key, value);
  }

  // User preferences -> AsyncStorage
  static async setPreference(key: string, value: any) {
    return await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  // Transaction data -> SQLite + Cloud sync
  static async saveTransaction(transaction: any) {
    // Save locally first for immediate UI updates
    await DatabaseService.addTransaction(transaction);

    // Queue for cloud sync
    await this.queueForSync("transaction", transaction);
  }

  // Offline-first approach with sync queue
  static async queueForSync(type: string, data: any) {
    const syncQueue = (await AsyncStorage.getItem("sync_queue")) || "[]";
    const queue = JSON.parse(syncQueue);

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

  static async processSyncQueue() {
    const syncQueue = (await AsyncStorage.getItem("sync_queue")) || "[]";
    const queue = JSON.parse(syncQueue);
    const failedItems = [];

    for (const item of queue) {
      try {
        // Get current version from cloud
        const cloudVersion = await this.getCloudVersion(item);

        // Check for conflicts
        if (cloudVersion && cloudVersion > item.version) {
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
      const nextRetry = Math.min(...failedItems.map((i) => i.nextRetry));
      const delay = Math.max(0, nextRetry - Date.now());

      setTimeout(() => this.processSyncQueue(), delay);
    }
  }

  private static async resolveConflict(item: any, cloudVersion: number) {
    // Implement your conflict resolution strategy here
    // For now we'll just take the cloud version
    console.log(
      `Resolving conflict for ${item.type} with cloud version ${cloudVersion}`
    );
    await DatabaseService.updateFromCloud(item.data);
  }

  private static async getCloudVersion(item: any): Promise<number | null> {
    try {
      // Implementation depends on your data model
      // This is a placeholder - adjust based on your actual version tracking
      const { data } = await supabase
        .from(item.type === "transaction" ? "transactions" : "users")
        .select("version")
        .eq("id", item.data.id)
        .single();

      return data?.version || null;
    } catch {
      return null;
    }
  }
}
