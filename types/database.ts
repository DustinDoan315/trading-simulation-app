// Database Schema Types
export interface User {
  uuid: string;
  balance: string;
  created_at: number;
}

export interface Portfolio {
  id: number;
  user_id: string;
  symbol: string;
  quantity: string;
  avg_cost: string;
  image?: string;
}

export interface Transaction {
  id: number;
  user_id: string;
  type: "BUY" | "SELL";
  symbol: string;
  quantity: string;
  price: string;
  timestamp: number;
}

export interface Collection {
  id: number;
  name: string;
  ownerId: string;
  invite_code: string;
  rules: string;
}

// Database operation types
export interface CreateUserParams {
  uuid: string;
  balance?: string;
  created_at?: number;
}

export interface UpdateUserParams {
  uuid: string;
  balance?: string;
}

export interface CreatePortfolioParams {
  user_id: string;
  symbol: string;
  quantity: string;
  avg_cost: string;
  image?: string;
}

export interface UpdatePortfolioParams {
  id: number;
  quantity?: string;
  avg_cost?: string;
  image?: string;
}

export interface CreateTransactionParams {
  user_id: string;
  type: "BUY" | "SELL";
  symbol: string;
  quantity: string;
  price: string;
  timestamp?: number;
}

export interface CreateCollectionParams {
  name: string;
  ownerId: string;
  invite_code: string;
  rules: string;
}

// Query result types
export interface PortfolioWithSymbol {
  id: number;
  user_id: string;
  symbol: string;
  quantity: string;
  avg_cost: string;
  image?: string;
  current_price?: string;
  total_value?: string;
  profit_loss?: string;
  profit_loss_percent?: string;
}

export interface TransactionWithDetails {
  id: number;
  user_id: string;
  type: "buy" | "sell";
  symbol: string;
  quantity: string;
  price: string;
  timestamp: number;
  total_value: string;
}

// Database sync types
export interface SyncStatus {
  lastSyncAt: string | null;
  syncStatus: Record<
    string,
    {
      status: "synced" | "failed" | "pending";
      lastError?: string;
      lastSyncAt: string;
    }
  >;
  hasPendingOperations: boolean;
}

export interface SyncResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
