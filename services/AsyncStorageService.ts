import AsyncStorage from '@react-native-async-storage/async-storage';
import { Holding } from '../types/crypto';

// AsyncStorage keys
const USER_KEY = "user_profile"; // Changed to match UUIDService
const PORTFOLIO_KEY = "portfolio_data";
const TRANSACTIONS_KEY = "transactions_data";
const SYNC_QUEUE_KEY = "sync_queue";

interface UserData {
  id: string;
  username: string;
  display_name?: string;
  avatar_emoji?: string;
  usdt_balance: string;
  total_portfolio_value: string;
  total_pnl: string;
  total_trades: number;
  win_rate: string;
  join_date: string;
  last_active: string;
  created_at: string;
  updated_at: string;
}

interface PortfolioData {
  user_id: string;
  symbol: string;
  quantity: string;
  avg_cost: string;
  current_price?: string;
  total_value?: string;
  profit_loss?: string;
  profit_loss_percent?: string;
  image?: string;
}

interface TransactionData {
  id: string;
  user_id: string;
  type: "BUY" | "SELL";
  symbol: string;
  quantity: string;
  price: string;
  timestamp: number;
}

interface SyncQueueItem {
  id: string;
  type: "transaction" | "user" | "portfolio";
  data: any;
  timestamp: number;
  retryCount: number;
}

export class AsyncStorageService {
  // User operations
  static async createOrUpdateUser(userData: UserData): Promise<UserData> {
    try {
      console.log("💾 AsyncStorageService.createOrUpdateUser - Saving user data:", userData);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      console.log("✅ User data saved to AsyncStorage:", userData.id);
      
      // Verify the data was saved correctly
      const savedData = await AsyncStorage.getItem(USER_KEY);
      console.log("💾 AsyncStorageService.createOrUpdateUser - Verification - saved data:", savedData);
      
      return userData;
    } catch (error) {
      console.error("❌ Failed to save user data to AsyncStorage:", error);
      throw error;
    }
  }

  static async getUser(userId: string): Promise<UserData | null> {
    try {
      console.log("🔍 AsyncStorageService.getUser - Looking for userId:", userId);
      const userData = await AsyncStorage.getItem(USER_KEY);
      console.log("🔍 AsyncStorageService.getUser - Raw userData:", userData);
      
      if (userData) {
        const user = JSON.parse(userData) as UserData;
        console.log("🔍 AsyncStorageService.getUser - Parsed user:", user);
        console.log("🔍 AsyncStorageService.getUser - User ID match:", user.id === userId);
        
        // Since we're storing a single user object, just verify the ID matches
        if (user.id === userId) {
          return user;
        } else {
          console.log("🔍 AsyncStorageService.getUser - User ID mismatch, expected:", userId, "got:", user.id);
          return null;
        }
      }
      console.log("🔍 AsyncStorageService.getUser - No userData found");
      return null;
    } catch (error) {
      console.error("❌ Failed to get user from AsyncStorage:", error);
      return null;
    }
  }

  static async updateUserBalance(
    userId: string,
    newBalance: number
  ): Promise<void> {
    try {
      console.log("💰 AsyncStorageService.updateUserBalance - Updating balance for userId:", userId, "to:", newBalance);
      const user = await this.getUser(userId);
      console.log("💰 AsyncStorageService.updateUserBalance - Retrieved user:", user);
      
      if (user) {
        user.usdt_balance = newBalance.toString();
        user.updated_at = new Date().toISOString();
        console.log("💰 AsyncStorageService.updateUserBalance - Updated user object:", user);
        await this.createOrUpdateUser(user);
        console.log("✅ User USDT balance updated in AsyncStorage:", newBalance);
      } else {
        console.error("❌ AsyncStorageService.updateUserBalance - User not found for userId:", userId);
        console.log("💰 AsyncStorageService.updateUserBalance - Creating new user with balance:", newBalance);
        
        // Create a new user with the current balance
        const now = new Date().toISOString();
        const newUser: UserData = {
          id: userId,
          username: `user_${userId.slice(0, 8)}`,
          usdt_balance: newBalance.toString(),
          total_portfolio_value: newBalance.toString(),
          total_pnl: "0",
          total_trades: 0,
          win_rate: "0",
          join_date: now,
          last_active: now,
          created_at: now,
          updated_at: now,
        };
        
        await this.createOrUpdateUser(newUser);
        console.log("✅ New user created with balance:", newBalance);
      }
    } catch (error) {
      console.error("❌ Failed to update user balance in AsyncStorage:", error);
      throw error;
    }
  }

  // Portfolio operations
  static async getUserPortfolio(user_id: string): Promise<PortfolioData[]> {
    try {
      const portfolioData = await AsyncStorage.getItem(PORTFOLIO_KEY);
      if (portfolioData) {
        const portfolio = JSON.parse(portfolioData) as PortfolioData[];
        return portfolio.filter((item) => item.user_id === user_id);
      }
      return [];
    } catch (error) {
      console.error("❌ Failed to get portfolio from AsyncStorage:", error);
      return [];
    }
  }

  static async updatePortfolio(
    user_id: string,
    portfolio: PortfolioData[]
  ): Promise<void> {
    try {
      // Get existing portfolio data
      const existingData = await AsyncStorage.getItem(PORTFOLIO_KEY);
      let allPortfolio: PortfolioData[] = [];

      if (existingData) {
        allPortfolio = JSON.parse(existingData) as PortfolioData[];
        // Remove existing entries for this user
        allPortfolio = allPortfolio.filter((item) => item.user_id !== user_id);
      }

      // Add new portfolio entries
      allPortfolio.push(...portfolio);

      await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(allPortfolio));
      console.log("✅ Portfolio updated in AsyncStorage for user:", user_id);
    } catch (error) {
      console.error("❌ Failed to update portfolio in AsyncStorage:", error);
      throw error;
    }
  }

  static async updatePortfolioAsset(asset: PortfolioData): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(PORTFOLIO_KEY);
      let portfolio: PortfolioData[] = [];

      if (existingData) {
        portfolio = JSON.parse(existingData) as PortfolioData[];
      }

      // Find and update existing asset or add new one
      const existingIndex = portfolio.findIndex(
        (item) => item.user_id === asset.user_id && item.symbol === asset.symbol
      );

      if (existingIndex >= 0) {
        portfolio[existingIndex] = asset;
      } else {
        portfolio.push(asset);
      }

      await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
      console.log("✅ Portfolio asset updated in AsyncStorage:", asset.symbol);
    } catch (error) {
      console.error(
        "❌ Failed to update portfolio asset in AsyncStorage:",
        error
      );
      throw error;
    }
  }

  // Transaction operations
  static async addTransaction(
    transaction: Omit<TransactionData, "id">
  ): Promise<TransactionData> {
    try {
      const newTransaction: TransactionData = {
        ...transaction,
        id: Date.now().toString(),
      };

      const existingData = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      let transactions: TransactionData[] = [];

      if (existingData) {
        transactions = JSON.parse(existingData) as TransactionData[];
      }

      transactions.push(newTransaction);
      await AsyncStorage.setItem(
        TRANSACTIONS_KEY,
        JSON.stringify(transactions)
      );

      console.log("✅ Transaction added to AsyncStorage:", newTransaction.id);
      return newTransaction;
    } catch (error) {
      console.error("❌ Failed to add transaction to AsyncStorage:", error);
      throw error;
    }
  }

  static async getTransactions(user_id: string): Promise<TransactionData[]> {
    try {
      const transactionsData = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      if (transactionsData) {
        const transactions = JSON.parse(transactionsData) as TransactionData[];
        return transactions.filter((item) => item.user_id === user_id);
      }
      return [];
    } catch (error) {
      console.error("❌ Failed to get transactions from AsyncStorage:", error);
      return [];
    }
  }

  // Sync queue operations
  static async addToSyncQueue(item: Omit<SyncQueueItem, "id">): Promise<void> {
    try {
      const syncItem: SyncQueueItem = {
        ...item,
        id: Date.now().toString(),
      };

      const existingData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      let queue: SyncQueueItem[] = [];

      if (existingData) {
        queue = JSON.parse(existingData) as SyncQueueItem[];
      }

      queue.push(syncItem);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));

      console.log("✅ Item added to sync queue:", syncItem.type);
    } catch (error) {
      console.error("❌ Failed to add item to sync queue:", error);
      throw error;
    }
  }

  static async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (queueData) {
        return JSON.parse(queueData) as SyncQueueItem[];
      }
      return [];
    } catch (error) {
      console.error("❌ Failed to get sync queue from AsyncStorage:", error);
      return [];
    }
  }

  static async removeFromSyncQueue(id: string): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const filteredQueue = queue.filter((item) => item.id !== id);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filteredQueue));
      console.log("✅ Item removed from sync queue:", id);
    } catch (error) {
      console.error("❌ Failed to remove item from sync queue:", error);
      throw error;
    }
  }

  static async updateSyncQueueItem(
    id: string,
    updates: Partial<SyncQueueItem>
  ): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const updatedQueue = queue.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
      console.log("✅ Sync queue item updated:", id);
    } catch (error) {
      console.error("❌ Failed to update sync queue item:", error);
      throw error;
    }
  }

  // Clear all data (for testing or reset)
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        USER_KEY,
        PORTFOLIO_KEY,
        TRANSACTIONS_KEY,
        SYNC_QUEUE_KEY,
      ]);
      console.log("✅ All AsyncStorage data cleared");
    } catch (error) {
      console.error("❌ Failed to clear AsyncStorage data:", error);
      throw error;
    }
  }

  // Clear user-specific data (for user reset)
  static async clearUserData(userId: string): Promise<void> {
    try {
      // Get existing data and remove user-specific entries
      const portfolioData = await AsyncStorage.getItem(PORTFOLIO_KEY);
      if (portfolioData) {
        const portfolio = JSON.parse(portfolioData) as PortfolioData[];
        const filteredPortfolio = portfolio.filter(item => item.user_id !== userId);
        await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(filteredPortfolio));
      }

      const transactionsData = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      if (transactionsData) {
        const transactions = JSON.parse(transactionsData) as TransactionData[];
        const filteredTransactions = transactions.filter(item => item.user_id !== userId);
        await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filteredTransactions));
      }

      // Clear user profile
      await AsyncStorage.removeItem(USER_KEY);
      
      console.log("✅ User-specific AsyncStorage data cleared for user:", userId);
    } catch (error) {
      console.error("❌ Failed to clear user AsyncStorage data:", error);
      throw error;
    }
  }

  // Recreate user data if corrupted or missing
  static async recreateUserData(userId: string, balance: number = 100000): Promise<UserData> {
    try {
      console.log("🔄 AsyncStorageService.recreateUserData - Recreating user data for:", userId);
      
      const now = new Date().toISOString();
      const userData: UserData = {
        id: userId,
        username: `user_${userId.slice(0, 8)}`,
        usdt_balance: balance.toString(),
        total_portfolio_value: balance.toString(),
        total_pnl: "0",
        total_trades: 0,
        win_rate: "0",
        join_date: now,
        last_active: now,
        created_at: now,
        updated_at: now,
      };

      await this.createOrUpdateUser(userData);
      console.log("✅ User data recreated successfully:", userData);
      return userData;
    } catch (error) {
      console.error("❌ Failed to recreate user data:", error);
      throw error;
    }
  }

  // Get storage info
  static async getStorageInfo(): Promise<{ size: number; keys: string[] }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const size = keys.length;
      return { size, keys: [...keys] };
    } catch (error) {
      console.error("❌ Failed to get storage info:", error);
      return { size: 0, keys: [] };
    }
  }
}
