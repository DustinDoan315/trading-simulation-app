// repositories/TransactionRepository.ts
import { db } from "../db/client";
import { transactions } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export class TransactionRepository {
  static async addTransaction(
    userId: string,
    type: "BUY" | "SELL",
    symbol: string,
    quantity: number,
    price: number
  ) {
    try {
      const result = await db.insert(transactions).values({
        userId,
        type,
        symbol,
        quantity: quantity.toString(),
        price: price.toString(),
        timestamp: new Date(),
      });

      console.log("Transaction added:", {
        userId,
        type,
        symbol,
        quantity,
        price,
      });
      return result;
    } catch (error) {
      console.error("Failed to add transaction:", error);
      throw error;
    }
  }

  static async getUserTransactions(userId: string, limit = 50) {
    try {
      const result = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.timestamp))
        .limit(limit);

      return result;
    } catch (error) {
      console.error("Failed to get user transactions:", error);
      return [];
    }
  }

  static async getSymbolTransactions(userId: string, symbol?: string) {
    try {
      const result = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        // .where(eq(transactions.symbol, symbol))
        .orderBy(desc(transactions.timestamp));

      return result;
    } catch (error) {
      console.error("Failed to get symbol transactions:", error);
      return [];
    }
  }
}
