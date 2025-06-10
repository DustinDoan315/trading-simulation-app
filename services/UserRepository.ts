import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import UUIDService from "./UUIDService";

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

  async getCurrentUser() {
    return UserRepository.getOrCreateUser();
  }
}

export default UserRepository;
