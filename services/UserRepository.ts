// repositories/UserRepository.ts
import { db } from "../db/client";
import { users, portfolios } from "../db/schema";
import { eq } from "drizzle-orm";
import UUIDService from "./UUIDService";
import { Holding } from "../app/types/crypto";

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
      return result[0] || null; // Return first result or null
    } catch (error) {
      console.error("Failed to get user:", error);
      return null;
    }
  }

  static async getOrCreateUser() {
    const uuid = await UUIDService.getOrCreateUser();
    let user = await this.getUser(uuid);

    if (!user) {
      await this.createUser(uuid);
      user = await this.getUser(uuid);
    }

    return user;
  }

  static async updateUserBalance(uuid: string, newBalance: number) {
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
    try {
      // Use Drizzle transaction for consistency
      await db.transaction(async (tx) => {
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
