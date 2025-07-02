"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
// services/DatabaseService.ts
const expo_sqlite_1 = require("drizzle-orm/expo-sqlite");
const expo_sqlite_2 = require("expo-sqlite");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const expo = (0, expo_sqlite_2.openDatabaseSync)("trading_app.db");
const db = (0, expo_sqlite_1.drizzle)(expo);
class DatabaseService {
    static async initializeDatabase() {
        // Create tables if they don't exist
        // This should be handled by your migration system
    }
    static async createOrUpdateUser(userData) {
        try {
            const [user] = await db
                .insert(schema_1.users)
                .values(userData)
                .onConflictDoUpdate({
                target: schema_1.users.uuid,
                set: {
                    balance: userData.balance,
                },
            })
                .returning();
            return user;
        }
        catch (error) {
            console.error("Failed to create/update user:", error);
            throw error;
        }
    }
    static async getUserPortfolio(userId) {
        return await db
            .select()
            .from(schema_1.portfolios)
            .where((0, drizzle_orm_1.eq)(schema_1.portfolios.userId, userId));
    }
    static async addTransaction(transaction) {
        const [newTransaction] = await db
            .insert(schema_1.transactions)
            .values(Object.assign(Object.assign({}, transaction), { timestamp: new Date() }))
            .returning();
        return newTransaction;
    }
    static async updatePortfolioAsset(asset) {
        await db
            .insert(schema_1.portfolios)
            .values(asset)
            .onConflictDoUpdate({
            target: [schema_1.portfolios.userId, schema_1.portfolios.symbol],
            set: {
                quantity: asset.quantity,
                avgCost: asset.avg_cost,
            },
        });
    }
    static async updateFromCloud(data) {
        if (data.type === "transaction") {
            await this.addTransaction(data);
        }
        else if (data.type === "user") {
            await this.createOrUpdateUser(data);
        }
    }
}
exports.DatabaseService = DatabaseService;
