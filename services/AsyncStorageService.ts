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
  // Helper function to normalize user IDs for consistent comparison
  private static normalizeUserId(userId: string): string {
    return userId.toLowerCase();
  }
  // User operations
  static async createOrUpdateUser(userData: UserData): Promise<UserData> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      
      // Verify the data was saved correctly
      const savedData = await AsyncStorage.getItem(USER_KEY);
      
      return userData;
    } catch (error) {
      throw error;
    }
  }

  static async getUser(userId: string): Promise<UserData | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      
      if (userData) {
        const user = JSON.parse(userData) as UserData;
        
        // Use case-insensitive comparison for user ID
        const userIdMatch = this.normalizeUserId(user.id) === this.normalizeUserId(userId);
        
        if (userIdMatch) {
          return user;
        } else {
          return null;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  static async updateUserBalance(
    userId: string,
    newBalance: number
  ): Promise<void> {
    try {
      const user = await this.getUser(userId);
      
      if (user) {
        user.usdt_balance = newBalance.toString();
        user.updated_at = new Date().toISOString();
        await this.createOrUpdateUser(user);
      } else {
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
      }
    } catch (error) {
      throw error;
    }
  }

  // Portfolio operations
  static async getUserPortfolio(user_id: string): Promise<PortfolioData[]> {
    try {
      const portfolioData = await AsyncStorage.getItem(PORTFOLIO_KEY);
      if (portfolioData) {
        const portfolio = JSON.parse(portfolioData) as PortfolioData[];
        return portfolio.filter((item) => this.normalizeUserId(item.user_id) === this.normalizeUserId(user_id));
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  static async saveUserPortfolio(user_id: string, portfolio: PortfolioData[]): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(PORTFOLIO_KEY);
      let allPortfolio: PortfolioData[] = [];
      
      if (existingData) {
        allPortfolio = JSON.parse(existingData) as PortfolioData[];
        // Remove existing portfolio for this user (case-insensitive)
        allPortfolio = allPortfolio.filter((item) => this.normalizeUserId(item.user_id) !== this.normalizeUserId(user_id));
      }
      
      // Add new portfolio data
      allPortfolio.push(...portfolio);
      
      await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(allPortfolio));
    } catch (error) {
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
      
      // Remove existing item with same symbol for this user (case-insensitive)
      portfolio = portfolio.filter((existing) => 
        !(this.normalizeUserId(existing.user_id) === this.normalizeUserId(item.user_id) && existing.symbol === item.symbol)
      );
      
      // Add new item
      portfolio.push(item);
      
      await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
    } catch (error) {
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
      
      // Find and update the item (case-insensitive)
      const index = portfolio.findIndex((item) => 
        this.normalizeUserId(item.user_id) === this.normalizeUserId(updatedItem.user_id) && item.symbol === updatedItem.symbol
      );
      
      if (index !== -1) {
        portfolio[index] = updatedItem;
        await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
      } else {
        throw new Error("Portfolio item not found");
      }
    } catch (error) {
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
      
      // Remove the item (case-insensitive)
      portfolio = portfolio.filter((item) => 
        !(this.normalizeUserId(item.user_id) === this.normalizeUserId(user_id) && item.symbol === symbol)
      );
      
      await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
    } catch (error) {
      throw error;
    }
  }

  // Transaction operations
  static async getTransactions(user_id: string): Promise<TransactionData[]> {
    try {
      const transactionsData = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      if (transactionsData) {
        const transactions = JSON.parse(transactionsData) as TransactionData[];
        return transactions.filter((item) => this.normalizeUserId(item.user_id) === this.normalizeUserId(user_id));
      }
      return [];
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      throw error;
    }
  }

  static async clearSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    } catch (error) {
      throw error;
    }
  }

  // Clear user-specific data (for user reset)
  static async clearUserData(userId: string): Promise<void> {
    try {
      // Get existing data and remove user-specific entries (case-insensitive)
      const portfolioData = await AsyncStorage.getItem(PORTFOLIO_KEY);
      if (portfolioData) {
        const portfolio = JSON.parse(portfolioData) as PortfolioData[];
        const filteredPortfolio = portfolio.filter(item => 
          this.normalizeUserId(item.user_id) !== this.normalizeUserId(userId)
        );
        await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(filteredPortfolio));
      }

      const transactionsData = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      if (transactionsData) {
        const transactions = JSON.parse(transactionsData) as TransactionData[];
        const filteredTransactions = transactions.filter(item => 
          this.normalizeUserId(item.user_id) !== this.normalizeUserId(userId)
        );
        await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filteredTransactions));
      }

      // Clear user profile
      await AsyncStorage.removeItem(USER_KEY);
      
      // Clear any additional cached data that might be user-specific
      const additionalKeys = [
        'user_balance',
        'user_portfolio', 
        'user_transactions',
        'user_favorites',
        'portfolio_cache',
        'balance_cache',
        'last_app_reset'
      ];
      
      for (const key of additionalKeys) {
        try {
          await AsyncStorage.removeItem(key);
        } catch (error) {
          // Silently ignore errors for additional keys
        }
      }
    } catch (error) {
      throw error;
    }
  }

  // Recreate user data if corrupted or missing
  static async recreateUserData(userId: string, balance: number = 100000): Promise<UserData> {
    try {
      const now = new Date().toISOString();
      const timestamp = Date.now().toString().slice(-6); // Get last 6 digits of timestamp
      const userData: UserData = {
        id: userId,
        username: `user_${userId.slice(0, 8)}_${timestamp}`,
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
      return userData;
    } catch (error) {
      throw error;
    }
  }

  // Clear all data from AsyncStorage
  static async clearAllData(): Promise<void> {
    try {
      // Get all keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Clear all keys
      await AsyncStorage.multiRemove(allKeys);
    } catch (error) {
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
      return { size: 0, keys: [] };
    }
  }
}
