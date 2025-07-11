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
        usdt_balance: "100000",
        total_portfolio_value: "100000",
        total_pnl: "0",
        total_trades: 0,
        win_rate: "0",
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

  static async getOrCreateUser() {
    const uuid = await UUIDService.getOrCreateUser();
    let user = await this.getUser(uuid);

    return user;
  }

  static async updateUserBalance(uuid: string, newBalance: number) {
    try {
      await AsyncStorageService.updateUserBalance(uuid, newBalance);

      console.log(
        "Balance updated for user:",
        uuid,
        "New balance:",
        newBalance
      );

      // Sync to Supabase
      try {
        await SyncService.updateUserBalance(uuid, newBalance);
        console.log("✅ Balance synced to Supabase");
      } catch (syncError) {
        console.error("Failed to sync balance to Supabase:", syncError);
        // Log sync failure but don't throw - local update succeeded
        // The SyncService will handle offline queueing if needed
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to update user balance:", error);
      throw error;
    }
  }

  static async updateUserBalanceAndPortfolioValue(
    uuid: string, 
    usdtBalance: number, 
    totalPortfolioValue: number,
    totalPnL: number = 0
  ) {
    try {
      console.log("🔄 UserRepository.updateUserBalanceAndPortfolioValue - Starting update...");
      console.log("🔄 UserRepository.updateUserBalanceAndPortfolioValue - UUID:", uuid);
      console.log("🔄 UserRepository.updateUserBalanceAndPortfolioValue - USDT Balance:", usdtBalance);
      console.log("🔄 UserRepository.updateUserBalanceAndPortfolioValue - Total Portfolio Value:", totalPortfolioValue);
      
      // Calculate total PnL percentage based on initial balance (default 100000)
      const initialBalance = 100000; // Default initial balance
      const totalPnLPercentage = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

      // Update local storage
      console.log("🔄 UserRepository.updateUserBalanceAndPortfolioValue - Calling AsyncStorageService.updateUserBalance...");
      await AsyncStorageService.updateUserBalance(uuid, usdtBalance);
      console.log("🔄 UserRepository.updateUserBalanceAndPortfolioValue - AsyncStorageService.updateUserBalance completed");

      console.log(
        "User balance and portfolio value updated for user:",
        uuid,
        "USDT balance:",
        usdtBalance,
        "Total portfolio value:",
        totalPortfolioValue,
        "Total PnL:",
        totalPnL,
        "PnL percentage:",
        totalPnLPercentage
      );

      // Sync to Supabase with better error handling
      try {
        console.log("🔄 Starting Supabase sync for user balance and portfolio value...");
        
        // Ensure user exists in Supabase first
        const userExists = await UUIDService.ensureUserInSupabase(uuid);
        if (!userExists) {
          console.error("❌ Cannot sync: user does not exist in Supabase");
          throw new Error("User does not exist in Supabase");
        }

        await SyncService.updateUserBalanceAndPortfolioValue(
          uuid, 
          usdtBalance, 
          totalPortfolioValue, 
          totalPnL, 
          totalPnLPercentage
        );
        console.log("✅ User balance and portfolio value synced to Supabase");
      } catch (syncError) {
        console.error("❌ Failed to sync user balance and portfolio value to Supabase:", syncError);
        console.error("Sync error details:", {
          uuid,
          usdtBalance,
          totalPortfolioValue,
          totalPnL,
          error: syncError instanceof Error ? syncError.message : syncError
        });
        
        // Log sync failure for manual retry
        console.log("⚠️ Sync failed - will retry on next operation");
      }

      return { success: true };
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

  static async updatePortfolio(
    uuid: string,
    holdings: Record<string, Holding>
  ) {
    console.log("====================================");
    console.log("Updating portfolio for UUID:", uuid);
    console.log("Holdings to update:", JSON.stringify(holdings, null, 2));
    console.log("====================================");

    try {
      // Normalize holdings to prevent duplicate entries (case-insensitive)
      const normalizedHoldings: Record<string, Holding> = {};

      Object.entries(holdings).forEach(([symbol, holding]) => {
        const normalizedSymbol = symbol.toUpperCase();

        if (normalizedHoldings[normalizedSymbol]) {
          // Merge duplicate entries
          const existing = normalizedHoldings[normalizedSymbol];
          const totalAmount = existing.amount + holding.amount;
          const totalValue = existing.valueInUSD + holding.valueInUSD;

          normalizedHoldings[normalizedSymbol] = {
            ...existing,
            amount: totalAmount,
            valueInUSD: totalValue,
            averageBuyPrice: totalValue / totalAmount,
          };
        } else {
          normalizedHoldings[normalizedSymbol] = {
            ...holding,
            symbol: normalizedSymbol,
          };
        }
      });

      console.log(
        "Normalized holdings:",
        JSON.stringify(normalizedHoldings, null, 2)
      );

      // Convert holdings to portfolio data format
      const portfolioData = Object.entries(normalizedHoldings).map(
        ([symbol, holding]) => ({
          user_id: uuid,
          symbol,
          quantity: (holding.amount || 0).toString(),
          avg_cost: (holding.averageBuyPrice || 0).toString(),
          current_price: (holding.currentPrice || 0).toString(),
          total_value: (holding.valueInUSD || 0).toString(),
          profit_loss: (holding.profitLoss || 0).toString(),
          profit_loss_percent: (holding.profitLossPercentage || 0).toString(),
          image_url: holding.image_url || undefined,
        })
      );

      // Update portfolio in AsyncStorage
      await AsyncStorageService.updatePortfolio(uuid, portfolioData);
      console.log("✅ Portfolio updated in AsyncStorage for user:", uuid);

      console.log("Portfolio updated successfully for user:", uuid);

      // Sync to Supabase
      try {
        console.log("Preparing to sync portfolio to Supabase...");

        // Ensure user exists in Supabase before syncing portfolio
        const userExists = await UUIDService.ensureUserInSupabase(uuid);
        if (!userExists) {
          console.error(
            "❌ Cannot sync portfolio: user does not exist in Supabase"
          );
          console.error(
            "❌ Portfolio sync will be retried when user is created"
          );
          return; // Don't throw, just return and let the sync retry later
        }

        // Convert holdings to portfolio array format expected by SyncService
        const portfolioArray = Object.entries(normalizedHoldings).map(
          ([symbol, holding]) => ({
            symbol,
            quantity: (holding.amount || 0).toString(),
            avg_cost: (holding.averageBuyPrice || 0).toString(),
            current_price: (holding.currentPrice || 0).toString(),
            total_value: (holding.valueInUSD || 0).toString(),
            profit_loss: (holding.profitLoss || 0).toString(),
            profit_loss_percent: (holding.profitLossPercentage || 0).toString(),
            image: holding.image_url || null,
          })
        );

        console.log(
          "Portfolio array to sync to Supabase:",
          JSON.stringify(portfolioArray, null, 2)
        );
        console.log("Portfolio array length:", portfolioArray.length);

        const syncResult = await SyncService.syncPortfolio(
          uuid,
          portfolioArray
        );
        console.log(
          "Supabase sync result:",
          JSON.stringify(syncResult, null, 2)
        );

        if (syncResult.success) {
          console.log(
            "✅ Portfolio synced to Supabase successfully for user:",
            uuid
          );
        } else {
          console.error(
            "❌ Portfolio sync to Supabase failed:",
            syncResult.error
          );
          console.error("Sync result details:", syncResult);
        }
      } catch (syncError) {
        console.error("❌ Exception during Supabase sync:", syncError);
        console.error(
          "Sync error stack:",
          syncError instanceof Error ? syncError.stack : "No stack trace"
        );
        // Don't throw here - local update succeeded, cloud sync can be retried later
        // The SyncService will handle offline queueing if needed
      }
    } catch (error) {
      console.error("❌ Failed to update portfolio:", error);
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );

      // Check if it's a readonly database error
      if (
        error instanceof Error &&
        error.message.includes("readonly database")
      ) {
        console.warn(
          "⚠️ Database is readonly (likely using Expo Go) - portfolio will only sync to Supabase"
        );
        console.warn(
          "⚠️ For persistent local storage, use a development build or standalone app"
        );

        // Still try to sync to Supabase even if local DB fails
        try {
          const portfolioArray = Object.entries(holdings).map(
            ([symbol, holding]) => ({
              symbol: symbol.toUpperCase(),
              quantity: (holding.amount || 0).toString(),
              avg_cost: (holding.averageBuyPrice || 0).toString(),
              current_price: (holding.currentPrice || 0).toString(),
              total_value: (holding.valueInUSD || 0).toString(),
              profit_loss: (holding.profitLoss || 0).toString(),
              profit_loss_percent: (
                holding.profitLossPercentage || 0
              ).toString(),
              image: holding.image_url || null,
            })
          );

          await SyncService.syncPortfolio(uuid, portfolioArray);
          console.log(
            "✅ Portfolio synced to Supabase despite local DB failure"
          );
        } catch (supabaseError) {
          console.error("❌ Supabase sync also failed:", supabaseError);
        }
      } else {
        throw error;
      }
    }
  }

  async getCurrentUser() {
    return UserRepository.getOrCreateUser();
  }
}

export default UserRepository;
