import UUIDService from './UUIDService';
import { db } from '../database/client';
import { eq } from 'drizzle-orm';
import { Holding } from '../types/crypto';
import { portfolios, users } from '../database/schema';
import { SyncService } from './SupabaseService';


// repositories/UserRepository.ts

class UserRepository {
  static async createUser(uuid: string) {
    try {
      const result = await db.insert(users).values({
        uuid,
        createdAt: new Date(),
      });
      console.log("User created successfully:", uuid);
      return result;
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error;
    }
  }

  static async getUser(uuid: string) {
    try {
      const result = await db.select().from(users).where(eq(users.uuid, uuid));
      return result[0] || null;
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
    console.log('====================================');
    console.log("Updating user balance for UUID:", uuid);
    console.log('====================================');
    try {
      const result = await db
        .update(users)
        .set({ balance: newBalance.toString() })
        .where(eq(users.uuid, uuid));

      console.log(
        "Balance updated for user:",
        uuid,
        "New balance:",
        newBalance
      );
      
      // Sync to Supabase
      try {
        await SyncService.updateUserBalance(uuid, newBalance);
        console.log("Balance synced to Supabase for user:", uuid);
      } catch (syncError) {
        console.error("Failed to sync balance to Supabase:", syncError);
        // Log sync failure but don't throw - local update succeeded
        // The SyncService will handle offline queueing if needed
      }
      
      return result;
    } catch (error) {
      console.error("Failed to update user balance:", error);
      
      // Check if it's a readonly database error
      if (error instanceof Error && error.message.includes('readonly database')) {
        console.warn("⚠️ Database is readonly (likely using Expo Go) - balance will only sync to Supabase");
        console.warn("⚠️ For persistent local storage, use a development build or standalone app");
      } else {
        throw error;
      }
    }
  }

  static async getPortfolio(uuid: string) {
    try {
      const result = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.user_id, uuid));

      return result;
    } catch (error) {
      console.error("Failed to get portfolio:", error);
      return [];
    }
  }

  static async updatePortfolio(
    uuid: string,
    holdings: Record<string, Holding>
  ) {
    console.log('====================================');
    console.log("Updating portfolio for UUID:", uuid);
    console.log("Holdings to update:", JSON.stringify(holdings, null, 2));
    console.log('====================================');
    
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

      console.log("Normalized holdings:", JSON.stringify(normalizedHoldings, null, 2));

      // Use Drizzle transaction for consistency
      await db.transaction(async (tx: any) => {
        // Delete existing holdings
        await tx.delete(portfolios).where(eq(portfolios.user_id, uuid));
        console.log("Deleted existing portfolio entries for user:", uuid);

        // Insert new holdings if any exist
        if (Object.keys(normalizedHoldings).length > 0) {
          const portfolioData = Object.entries(normalizedHoldings).map(
            ([symbol, holding]) => ({
              user_id: uuid,
              symbol,
              quantity: holding.amount.toString(),
              avg_cost: holding.averageBuyPrice.toString(),
            })
          );

          console.log("Inserting portfolio data:", JSON.stringify(portfolioData, null, 2));
          await tx.insert(portfolios).values(portfolioData);
          console.log("Successfully inserted", portfolioData.length, "portfolio entries");
        } else {
          console.log("No holdings to insert - portfolio is empty");
        }
      });

      console.log("Portfolio updated successfully for user:", uuid);
      
      // Sync to Supabase
      try {
        console.log("Preparing to sync portfolio to Supabase...");
        
        // Convert holdings to portfolio array format expected by SyncService
        const portfolioArray = Object.entries(normalizedHoldings).map(([symbol, holding]) => ({
          symbol,
          quantity: holding.amount.toString(),
          avg_cost: holding.averageBuyPrice.toString(),
          image: holding.image || null,
        }));
        
        console.log("Portfolio array to sync to Supabase:", JSON.stringify(portfolioArray, null, 2));
        console.log("Portfolio array length:", portfolioArray.length);
        
        const syncResult = await SyncService.syncPortfolio(uuid, portfolioArray);
        console.log("Supabase sync result:", JSON.stringify(syncResult, null, 2));
        
        if (syncResult.success) {
          console.log("✅ Portfolio synced to Supabase successfully for user:", uuid);
        } else {
          console.error("❌ Portfolio sync to Supabase failed:", syncResult.error);
          console.error("Sync result details:", syncResult);
        }
      } catch (syncError) {
        console.error("❌ Exception during Supabase sync:", syncError);
        console.error("Sync error stack:", syncError instanceof Error ? syncError.stack : 'No stack trace');
        // Don't throw here - local update succeeded, cloud sync can be retried later
        // The SyncService will handle offline queueing if needed
      }
      
    } catch (error) {
      console.error("❌ Failed to update portfolio:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      // Check if it's a readonly database error
      if (error instanceof Error && error.message.includes('readonly database')) {
        console.warn("⚠️ Database is readonly (likely using Expo Go) - portfolio will only sync to Supabase");
        console.warn("⚠️ For persistent local storage, use a development build or standalone app");
        
        // Still try to sync to Supabase even if local DB fails
        try {
          const portfolioArray = Object.entries(holdings).map(([symbol, holding]) => ({
            symbol: symbol.toUpperCase(),
            quantity: holding.amount.toString(),
            avg_cost: holding.averageBuyPrice.toString(),
            image: holding.image || null,
          }));
          
          await SyncService.syncPortfolio(uuid, portfolioArray);
          console.log("✅ Portfolio synced to Supabase despite local DB failure");
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
