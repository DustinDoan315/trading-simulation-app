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
  initial_balance: string;
  total_pnl: string;
  total_pnl_percentage: string;
  total_trades: number;
  total_buy_volume: string;
  total_sell_volume: string;
  win_rate: string;
  global_rank?: number;
  last_trade_at?: string;
  join_date: string;
  last_active: string;
  created_at: string;
  updated_at: string;
}

interface PortfolioData {
  id: string;
  user_id: string;
  symbol: string;
  quantity: string;
  avg_cost: string;
  current_price: string;
  total_value: string;
  profit_loss: string;
  profit_loss_percent: string;
  image_url?: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

interface TransactionData {
  id: string;
  user_id: string;
  type: string;
  symbol: string;
  quantity: string;
  price: string;
  total_value: string;
  fee: string;
  usdt_balance_before?: string;
  usdt_balance_after?: string;
  order_type: string;
  status: string;
  collection_id?: string;
  execution_price?: string;
  market_price_at_time?: string;
  slippage?: string;
  timestamp: string;
  executed_at?: string;
  created_at: string;
}

interface SyncQueueItem {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
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
          display_name: `User ${userId.slice(0, 8)}`,
          avatar_emoji: "🚀",
          usdt_balance: newBalance.toString(),
          total_portfolio_value: newBalance.toString(),
          initial_balance: newBalance.toString(),
          total_pnl: "0.00",
          total_pnl_percentage: "0.00",
          total_trades: 0,
          total_buy_volume: "0.00",
          total_sell_volume: "0.00",
          win_rate: "0.00",
          global_rank: undefined,
          last_trade_at: undefined,
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

  static async saveUserPortfolio(user_id: string, portfolio: PortfolioData[]): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(PORTFOLIO_KEY);
      let allPortfolio: PortfolioData[] = [];
      
      if (existingData) {
        allPortfolio = JSON.parse(existingData) as PortfolioData[];
        // Remove existing portfolio for this user
        allPortfolio = allPortfolio.filter((item) => item.user_id !== user_id);
      }
      
      // Add new portfolio data
      allPortfolio.push(...portfolio);
      
      await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(allPortfolio));
      console.log("✅ Portfolio saved to AsyncStorage for user:", user_id);
    } catch (error) {
      console.error("❌ Failed to save portfolio to AsyncStorage:", error);
      throw error;
    }
  }

  static async addPortfolioItem(item: PortfolioData): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(PORTFOLIO_KEY);
      let portfolio: PortfolioData[] = [];
      
      if (existingData) {
        portfolio = JSON.parse(existingData) as PortfolioData[];
      }
      
      // Remove existing item with same symbol for this user
      portfolio = portfolio.filter((existing) => 
        !(existing.user_id === item.user_id && existing.symbol === item.symbol)
      );
      
      // Add new item
      portfolio.push(item);
      
      await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
      console.log("✅ Portfolio item added to AsyncStorage:", item.symbol);
    } catch (error) {
      console.error("❌ Failed to add portfolio item to AsyncStorage:", error);
      throw error;
    }
  }

  static async updatePortfolioItem(updatedItem: PortfolioData): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(PORTFOLIO_KEY);
      if (!existingData) {
        throw new Error("No portfolio data found");
      }
      
      let portfolio: PortfolioData[] = JSON.parse(existingData) as PortfolioData[];
      
      // Find and update the item
      const index = portfolio.findIndex((item) => 
        item.user_id === updatedItem.user_id && item.symbol === updatedItem.symbol
      );
      
      if (index !== -1) {
        portfolio[index] = updatedItem;
        await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
        console.log("✅ Portfolio item updated in AsyncStorage:", updatedItem.symbol);
      } else {
        throw new Error("Portfolio item not found");
      }
    } catch (error) {
      console.error("❌ Failed to update portfolio item in AsyncStorage:", error);
      throw error;
    }
  }

  static async removePortfolioItem(user_id: string, symbol: string): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(PORTFOLIO_KEY);
      if (!existingData) {
        return;
      }
      
      let portfolio: PortfolioData[] = JSON.parse(existingData) as PortfolioData[];
      
      // Remove the item
      portfolio = portfolio.filter((item) => 
        !(item.user_id === user_id && item.symbol === symbol)
      );
      
      await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
      console.log("✅ Portfolio item removed from AsyncStorage:", symbol);
    } catch (error) {
      console.error("❌ Failed to remove portfolio item from AsyncStorage:", error);
      throw error;
    }
  }

  // Transaction operations
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

  static async addTransaction(transaction: TransactionData): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      let transactions: TransactionData[] = [];
      
      if (existingData) {
        transactions = JSON.parse(existingData) as TransactionData[];
      }
      
      transactions.push(transaction);
      
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
      console.log("✅ Transaction added to AsyncStorage:", transaction.id);
    } catch (error) {
      console.error("❌ Failed to add transaction to AsyncStorage:", error);
      throw error;
    }
  }

  // Sync queue operations
  static async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      let queue: SyncQueueItem[] = [];
      
      if (existingData) {
        queue = JSON.parse(existingData) as SyncQueueItem[];
      }
      
      queue.push(item);
      
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      console.log("✅ Item added to sync queue:", item.id);
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

  static async removeFromSyncQueue(itemId: string): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (!existingData) {
        return;
      }
      
      let queue: SyncQueueItem[] = JSON.parse(existingData) as SyncQueueItem[];
      
      // Remove the item
      queue = queue.filter((item) => item.id !== itemId);
      
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      console.log("✅ Item removed from sync queue:", itemId);
    } catch (error) {
      console.error("❌ Failed to remove item from sync queue:", error);
      throw error;
    }
  }

  static async clearSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
      console.log("✅ Sync queue cleared");
    } catch (error) {
      console.error("❌ Failed to clear sync queue:", error);
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
        display_name: `User ${userId.slice(0, 8)}`,
        avatar_emoji: "🚀",
        usdt_balance: balance.toString(),
        total_portfolio_value: balance.toString(),
        initial_balance: balance.toString(),
        total_pnl: "0.00",
        total_pnl_percentage: "0.00",
        total_trades: 0,
        total_buy_volume: "0.00",
        total_sell_volume: "0.00",
        win_rate: "0.00",
        global_rank: undefined,
        last_trade_at: undefined,
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
