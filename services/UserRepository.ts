import UUIDService from './UUIDService';
import { AsyncStorageService } from './AsyncStorageService';
import { Holding } from '../types/crypto';
import { SyncService } from './SupabaseService';

// repositories/UserRepository.ts

class UserRepository {
  static async createUser(uuid: string) {
    try {
      const now = new Date().toISOString();
      const userData = {
        id: uuid,
        username: `user_${uuid.slice(0, 8)}`,
        display_name: `User ${uuid.slice(0, 8)}`,
        avatar_emoji: "🚀",
        usdt_balance: "100000",
        total_portfolio_value: "100000",
        initial_balance: "100000",
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

      await AsyncStorageService.createOrUpdateUser(userData);
      console.log("✅ User created successfully:", uuid);
      return userData;
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error;
    }
  }

  static async getUser(uuid: string) {
    try {
      const user = await AsyncStorageService.getUser(uuid);
      return user;
    } catch (error) {
      console.error("Failed to get user:", error);
      return null;
    }
  }

  static async updateUser(uuid: string, updates: any) {
    try {
      const user = await this.getUser(uuid);
      if (!user) {
        throw new Error("User not found");
      }

      const updatedUser = { ...user, ...updates, updated_at: new Date().toISOString() };
      await AsyncStorageService.createOrUpdateUser(updatedUser);
      console.log("✅ User updated successfully:", uuid);
      return updatedUser;
    } catch (error) {
      console.error("Failed to update user:", error);
      throw error;
    }
  }

  static async updateUserBalance(uuid: string, newBalance: number) {
    try {
      await AsyncStorageService.updateUserBalance(uuid, newBalance);
      console.log("✅ User balance updated successfully:", uuid, newBalance);
    } catch (error) {
      console.error("Failed to update user balance:", error);
      throw error;
    }
  }

  static async updateUserBalanceAndPortfolioValue(
    uuid: string,
    usdtBalance: number,
    totalPortfolioValue: number,
    totalPnL: number,
    totalPnLPercentage: number
  ) {
    try {
      const user = await this.getUser(uuid);
      if (!user) {
        throw new Error("User not found");
      }

      const updatedUser = {
        ...user,
        usdt_balance: usdtBalance.toString(),
        total_portfolio_value: totalPortfolioValue.toString(),
        total_pnl: totalPnL.toString(),
        total_pnl_percentage: totalPnLPercentage.toString(),
        updated_at: new Date().toISOString(),
      };

      await AsyncStorageService.createOrUpdateUser(updatedUser);
      console.log("✅ User balance and portfolio value updated successfully:", uuid);
      return updatedUser;
    } catch (error) {
      console.error("Failed to update user balance and portfolio value:", error);
      throw error;
    }
  }

  static async getPortfolio(uuid: string) {
    try {
      const portfolio = await AsyncStorageService.getUserPortfolio(uuid);
      return portfolio;
    } catch (error) {
      console.error("Failed to get portfolio:", error);
      return [];
    }
  }

  static async savePortfolio(uuid: string, portfolio: any[]) {
    try {
      await AsyncStorageService.saveUserPortfolio(uuid, portfolio);
      // Sync to Supabase cloud
      await SyncService.syncPortfolio(uuid, portfolio);
    } catch (error) {
      console.error("Failed to save portfolio:", error);
      throw error;
    }
  }

  static async addPortfolioItem(item: any) {
    try {
      await AsyncStorageService.addPortfolioItem(item);
      // Sync to Supabase cloud (fetch full portfolio for user)
      const portfolio = await AsyncStorageService.getUserPortfolio(item.user_id);
      await SyncService.syncPortfolio(item.user_id, portfolio);
    } catch (error) {
      console.error("Failed to add portfolio item:", error);
      throw error;
    }
  }

  static async updatePortfolioItem(item: any) {
    try {
      await AsyncStorageService.updatePortfolioItem(item);
      // Sync to Supabase cloud (fetch full portfolio for user)
      const portfolio = await AsyncStorageService.getUserPortfolio(item.user_id);
      await SyncService.syncPortfolio(item.user_id, portfolio);
    } catch (error) {
      console.error("Failed to update portfolio item:", error);
      throw error;
    }
  }

  static async removePortfolioItem(uuid: string, symbol: string) {
    try {
      await AsyncStorageService.removePortfolioItem(uuid, symbol);
      // Sync to Supabase cloud (fetch full portfolio for user)
      const portfolio = await AsyncStorageService.getUserPortfolio(uuid);
      await SyncService.syncPortfolio(uuid, portfolio);
    } catch (error) {
      console.error("Failed to remove portfolio item:", error);
      throw error;
    }
  }

  static async getTransactions(uuid: string) {
    try {
      const transactions = await AsyncStorageService.getTransactions(uuid);
      return transactions;
    } catch (error) {
      console.error("Failed to get transactions:", error);
      return [];
    }
  }

  static async addTransaction(transaction: any) {
    try {
      await AsyncStorageService.addTransaction(transaction);
      console.log("✅ Transaction added successfully:", transaction.id);
    } catch (error) {
      console.error("Failed to add transaction:", error);
      throw error;
    }
  }

  static async clearUserData(uuid: string) {
    try {
      await AsyncStorageService.clearUserData(uuid);
      console.log("✅ User data cleared successfully:", uuid);
    } catch (error) {
      console.error("Failed to clear user data:", error);
      throw error;
    }
  }

  static async recreateUserData(uuid: string, balance: number = 100000) {
    try {
      const userData = await AsyncStorageService.recreateUserData(uuid, balance);
      console.log("✅ User data recreated successfully:", uuid);
      return userData;
    } catch (error) {
      console.error("Failed to recreate user data:", error);
      throw error;
    }
  }
}

export default UserRepository;
