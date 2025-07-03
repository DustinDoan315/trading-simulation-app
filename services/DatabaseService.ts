// services/DatabaseService.ts
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import { users, portfolios, transactions } from "../db/schema";
import { eq, and } from "drizzle-orm";

const expo = openDatabaseSync("learn_trading_app.db");
const db = drizzle(expo);

export class DatabaseService {
  static async initializeDatabase() {
    // Create tables if they don't exist
    // This should be handled by your migration system
  }

  static async createOrUpdateUser(userData: {
    uuid: string;
    balance: string;
    createdAt: Date;
  }) {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.uuid,
          set: {
            balance: userData.balance,
          },
        })
        .returning();

      return user;
    } catch (error) {
      console.error("Failed to create/update user:", error);
      throw error;
    }
  }

  static async getUserPortfolio(userId: string) {
    return await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId));
  }

  static async addTransaction(transaction: {
    userId: string;
    type: "BUY" | "SELL";
    symbol: string;
    quantity: string;
    price: string;
  }) {
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        ...transaction,
        timestamp: new Date(),
      })
      .returning();

    return newTransaction;
  }

  static async updatePortfolioAsset(asset: any) {
    await db
      .insert(portfolios)
      .values(asset)
      .onConflictDoUpdate({
        target: [portfolios.userId, portfolios.symbol],
        set: {
          quantity: asset.quantity,
          avgCost: asset.avg_cost,
        },
      });
  }

  static async updateFromCloud(data: any) {
    if (data.type === "transaction") {
      await this.addTransaction(data);
    } else if (data.type === "user") {
      await this.createOrUpdateUser(data);
    }
  }
}
