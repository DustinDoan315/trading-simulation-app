// db/schema.ts
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Users table
export const users = sqliteTable(
  "users",
  {
    uuid: text("uuid").primaryKey(),
    balance: text("balance").notNull().default("100000"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    uuidIdx: uniqueIndex("uuid_idx").on(table.uuid),
  })
);

// Portfolios table
export const portfolios = sqliteTable(
  "portfolios",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: text("user_id").notNull(),
    symbol: text("symbol").notNull(),
    quantity: text("quantity").notNull(),
    avg_cost: text("avg_cost").notNull(),
    image: text("image"),
  },
  (table) => ({
    userAssetIdx: uniqueIndex("user_asset_idx").on(table.user_id, table.symbol),
  })
);

// Transactions table
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id").notNull(),
  type: text("type", { enum: ["BUY", "SELL"] }).notNull(),
  symbol: text("symbol").notNull(),
  quantity: text("quantity").notNull(),
  price: text("price").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});

// Collections table
export const collections = sqliteTable("collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  ownerId: text("ownerId").notNull(),
  inviteCode: text("invite_code").notNull(),
  rules: text("rules", { mode: "json" }).notNull(),
});
