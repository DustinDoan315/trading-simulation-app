// import { and, eq } from "drizzle-orm";
// import { db } from "../database/client";
// import { portfolios, transactions, users } from "../database/schema";

// // services/DatabaseService.ts

// export class LocalDatabaseService {
//   static async createOrUpdateUser(userData: {
//     uuid: string;
//     balance: string;
//     createdAt: Date;
//   }) {
//     try {
//       const [user] = await db
//         .insert(users)
//         .values(userData)
//         .onConflictDoUpdate({
//           target: users.uuid,
//           set: {
//             balance: userData.balance,
//           },
//         })
//         .returning();

//       return user;
//     } catch (error) {
//       console.error("Failed to create/update user:", error);

//       // Check if it's a readonly database error
//       if (
//         error instanceof Error &&
//         error.message.includes("readonly database")
//       ) {
//         console.warn(
//           "⚠️ Database is readonly - user will only be synced to Supabase"
//         );
//         // Return a mock user object for UI consistency
//         return {
//           uuid: userData.uuid,
//           balance: userData.balance,
//           createdAt: userData.createdAt,
//         };
//       }

//       throw error;
//     }
//   }

//   static async getUserPortfolio(user_id: string) {
//     try {
//       return await db
//         .select()
//         .from(portfolios)
//         .where(eq(portfolios.user_id, user_id));
//     } catch (error) {
//       console.error("Failed to get user portfolio:", error);

//       if (
//         error instanceof Error &&
//         error.message.includes("readonly database")
//       ) {
//         console.warn("⚠️ Database is readonly - returning empty portfolio");
//         return [];
//       }

//       throw error;
//     }
//   }

//   static async updatePortfolioAsset(asset: any) {
//     // Map Supabase 'user_id' to local 'user_id' if needed
//     const assetForDb = {
//       ...asset,
//       user_id: asset.user_id || asset.user_id, // prefer user_id, fallback to user_id
//     };
//     await db
//       .insert(portfolios)
//       .values(assetForDb)
//       .onConflictDoUpdate({
//         target: [portfolios.user_id, portfolios.symbol],
//         set: {
//           quantity: asset.quantity,
//           avg_cost: asset.avg_cost,
//         },
//       });
//   }

//   static async addTransaction(transaction: {
//     user_id: string;
//     type: "BUY" | "SELL";
//     symbol: string;
//     quantity: string;
//     price: string;
//   }) {
//     try {
//       const [newTransaction] = await db
//         .insert(transactions)
//         .values({
//           ...transaction,
//           timestamp: new Date(),
//         })
//         .returning();

//       return newTransaction;
//     } catch (error) {
//       console.error("Failed to add transaction:", error);

//       if (
//         error instanceof Error &&
//         error.message.includes("readonly database")
//       ) {
//         console.warn(
//           "⚠️ Database is readonly - transaction will only be synced to Supabase"
//         );
//         // Return a mock transaction object for UI consistency
//         return {
//           id: Date.now(),
//           ...transaction,
//           timestamp: new Date(),
//         };
//       }

//       throw error;
//     }
//   }

//   static async updateFromCloud(data: any) {
//     try {
//       if (data.type === "transaction") {
//         await this.addTransaction(data);
//       } else if (data.type === "user") {
//         await this.createOrUpdateUser(data);
//       }
//     } catch (error) {
//       console.error("Failed to update from cloud:", error);

//       if (
//         error instanceof Error &&
//         error.message.includes("readonly database")
//       ) {
//         console.warn(
//           "⚠️ Database is readonly - cloud data will not be stored locally"
//         );
//       } else {
//         throw error;
//       }
//     }
//   }
// }
