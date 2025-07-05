import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { portfolios, transactions, users } from '../database/schema';


// services/DatabaseService.ts

const expo = openDatabaseSync("learn_trading_app.db");
const db = drizzle(expo);

export class LocalDatabaseService {

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

  static async getUserPortfolio(user_id: string) {
    return await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.user_id, user_id));
  }

  static async updatePortfolioAsset(asset: any) {
    // Map Supabase 'user_id' to local 'user_id' if needed
    const assetForDb = {
      ...asset,
      user_id: asset.user_id || asset.user_id, // prefer user_id, fallback to user_id
    };
    await db
      .insert(portfolios)
      .values(assetForDb)
      .onConflictDoUpdate({
        target: [portfolios.user_id, portfolios.symbol],
        set: {
          quantity: asset.quantity,
          avg_cost: asset.avg_cost,
        },
      });
  }

    static async addTransaction(transaction: {
    user_id: string;
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


  static async updateFromCloud(data: any) {
    if (data.type === "transaction") {
      await this.addTransaction(data);
    } else if (data.type === "user") {
      await this.createOrUpdateUser(data);
    }
  }
}
