import { db } from "../db/client";
import { users, portfolios } from "../db/schema";
import { eq } from "drizzle-orm";
import UUIDService from "./UUIDService";
import { Holding } from "../app/types/crypto";

class UserRepository {
  static async createUser(uuid: string) {
    return db.insert(users).values({ uuid }).run();
  }

  static async getUser(uuid: string) {
    return db.select().from(users).where(eq(users.uuid, uuid)).get();
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
    return db
      .update(users)
      .set({ balance: newBalance.toString() })
      .where(eq(users.uuid, uuid))
      .run();
  }

  static async getPortfolio(uuid: string) {
    return db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, uuid))
      .all();
  }

  static async updatePortfolio(
    uuid: string,
    holdings: Record<string, Holding>
  ) {
    // First delete all existing holdings
    await db.delete(portfolios).where(eq(portfolios.userId, uuid)).run();

    // Then insert updated holdings
    for (const [symbol, holding] of Object.entries(holdings)) {
      await db
        .insert(portfolios)
        .values({
          userId: uuid,
          symbol,
          quantity: holding.amount.toString(),
          avgCost: holding.averageBuyPrice.toString(),
        })
        .run();
    }
  }

  async getCurrentUser() {
    return UserRepository.getOrCreateUser();
  }
}

export default UserRepository;
