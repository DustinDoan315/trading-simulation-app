"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collections = exports.transactions = exports.portfolios = exports.users = void 0;
// db/schema.ts
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
// Users table
exports.users = (0, sqlite_core_1.sqliteTable)("users", {
    uuid: (0, sqlite_core_1.text)("uuid").primaryKey(),
    balance: (0, sqlite_core_1.text)("balance").notNull().default("100000"),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull(),
}, (table) => ({
    uuidIdx: (0, sqlite_core_1.uniqueIndex)("uuid_idx").on(table.uuid),
}));
// Portfolios table
exports.portfolios = (0, sqlite_core_1.sqliteTable)("portfolios", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.text)("userId").notNull(),
    symbol: (0, sqlite_core_1.text)("symbol").notNull(),
    quantity: (0, sqlite_core_1.text)("quantity").notNull(),
    avgCost: (0, sqlite_core_1.text)("avgCost").notNull(),
    image: (0, sqlite_core_1.text)("image"),
}, (table) => ({
    userAssetIdx: (0, sqlite_core_1.uniqueIndex)("user_asset_idx").on(table.userId, table.symbol),
}));
// Transactions table
exports.transactions = (0, sqlite_core_1.sqliteTable)("transactions", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.text)("userId").notNull(),
    type: (0, sqlite_core_1.text)("type", { enum: ["BUY", "SELL"] }).notNull(),
    symbol: (0, sqlite_core_1.text)("symbol").notNull(),
    quantity: (0, sqlite_core_1.text)("quantity").notNull(),
    price: (0, sqlite_core_1.text)("price").notNull(),
    timestamp: (0, sqlite_core_1.integer)("timestamp", { mode: "timestamp" }).notNull(),
});
// Collections table
exports.collections = (0, sqlite_core_1.sqliteTable)("collections", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)("name").notNull(),
    ownerId: (0, sqlite_core_1.text)("ownerId").notNull(),
    inviteCode: (0, sqlite_core_1.text)("invite_code").notNull(),
    rules: (0, sqlite_core_1.text)("rules", { mode: "json" }).notNull(),
});
