// repositories/UserRepository.ts
import { db } from "../database/client";
import { users, portfolios } from "../database/schema";
import { eq } from "drizzle-orm";
import UUIDService from "./UUIDService";
import { SyncService } from "./SupabaseService";
import { Holding } from "../types/crypto";

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
      await SyncService.updateUserBalance(uuid, newBalance);
      console.log("Balance synced to Supabase for user:", uuid);
      
      return result;
    } catch (error) {
      console.error("Failed to update user balance:", error);
      throw error;
    }
  }

  static async getPortfolio(uuid: string) {
    try {
      const result = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.userId, uuid));

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
    console.log('====================================');
    try {
      // Use Drizzle transaction for consistency
      await db.transaction(async (tx: any) => {
        // Delete existing holdings
        await tx.delete(portfolios).where(eq(portfolios.userId, uuid));

        // Insert new holdings if any exist
        if (Object.keys(holdings).length > 0) {
          const portfolioData = Object.entries(holdings).map(
            ([symbol, holding]) => ({
              userId: uuid,
              symbol,
              quantity: holding.amount.toString(),
              avgCost: holding.averageBuyPrice.toString(),
            })
          );

          await tx.insert(portfolios).values(portfolioData);
        }
      });

      console.log("Portfolio updated successfully for user:", uuid);
    } catch (error) {
      console.error("Failed to update portfolio:", error);
      throw error;
    }
  }

  async getCurrentUser() {
    return UserRepository.getOrCreateUser();
  }
}

export default UserRepository;
