import {
  integer,
  numeric,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Users table
export const users = sqliteTable(
  "users",
  {
    uuid: text("uuid").primaryKey(),
    balance: numeric("balance").notNull().default("100000"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
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
    userId: text("user_id")
      .notNull()
      .references(() => users.uuid),
    symbol: text("symbol").notNull(),
    quantity: numeric("quantity").notNull(),
    avgCost: numeric("avg_cost").notNull(),
  },
  (table) => ({
    userAssetIdx: uniqueIndex("user_asset_idx").on(table.userId, table.symbol),
  })
);

// Transactions table
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.uuid),
  type: text("type", { enum: ["BUY", "SELL"] }).notNull(),
  symbol: text("symbol").notNull(),
  quantity: numeric("quantity").notNull(),
  price: numeric("price").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Collections table
export const collections = sqliteTable("collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.uuid),
  inviteCode: text("invite_code").notNull(),
  rules: text("rules", { mode: "json" }).notNull(),
});
