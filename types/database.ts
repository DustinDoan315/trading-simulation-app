// Database Schema Types - Updated for Simplified Schema
export interface User {
  id: string; // UUID
  username: string;
  display_name?: string;
  avatar_emoji?: string;
  balance: string; // DECIMAL(20,8)
  total_pnl: string; // DECIMAL(20,8)
  total_trades: number;
  win_rate: string; // DECIMAL(5,2)
  global_rank?: number;
  join_date: string; // TIMESTAMP
  last_active: string; // TIMESTAMP
  created_at: string; // TIMESTAMP
  updated_at: string; // TIMESTAMP
}

export interface Portfolio {
  id: string; // UUID
  user_id: string; // UUID
  symbol: string;
  quantity: string; // DECIMAL(20,8)
  avg_cost: string; // DECIMAL(20,8)
  current_price: string; // DECIMAL(20,8)
  total_value: string; // DECIMAL(20,8)
  profit_loss: string; // DECIMAL(20,8)
  profit_loss_percent: string; // DECIMAL(10,4)
  image_url?: string;
  last_updated: string; // TIMESTAMP
  created_at: string; // TIMESTAMP
  updated_at: string; // TIMESTAMP
}

export interface Transaction {
  id: string; // UUID
  user_id: string; // UUID
  type: "BUY" | "SELL";
  symbol: string;
  quantity: string; // DECIMAL(20,8)
  price: string; // DECIMAL(20,8)
  total_value: string; // DECIMAL(20,8)
  fee: string; // DECIMAL(20,8)
  order_type: "MARKET" | "LIMIT";
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "FAILED";
  collection_id?: string; // UUID
  timestamp: string; // TIMESTAMP
  created_at: string; // TIMESTAMP
}

export interface Collection {
  id: string; // UUID
  name: string;
  description?: string;
  owner_id: string; // UUID
  invite_code: string;
  is_public: boolean;
  allow_invites: boolean;
  max_members: number;
  starting_balance: string; // DECIMAL(20,8)
  duration_days: number;
  rules: Record<string, any>; // JSONB
  total_value: string; // DECIMAL(20,8)
  avg_pnl: string; // DECIMAL(10,4)
  member_count: number;
  rank?: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  start_date: string; // TIMESTAMP
  end_date?: string; // TIMESTAMP
  created_at: string; // TIMESTAMP
  updated_at: string; // TIMESTAMP
}

export interface CollectionMember {
  id: string; // UUID
  collection_id: string; // UUID
  user_id: string; // UUID
  role: "OWNER" | "ADMIN" | "MEMBER";
  balance: string; // DECIMAL(20,8)
  total_pnl: string; // DECIMAL(20,8)
  rank?: number;
  joined_at: string; // TIMESTAMP
  created_at: string; // TIMESTAMP
}

export interface Favorite {
  id: string; // UUID
  user_id: string; // UUID
  crypto_id: string;
  symbol: string;
  name: string;
  image_url?: string;
  added_at: string; // TIMESTAMP
}

export interface LeaderboardRanking {
  id: string; // UUID
  user_id: string; // UUID
  collection_id?: string; // UUID
  period: "WEEKLY" | "MONTHLY" | "ALL_TIME";
  rank: number;
  total_pnl: string; // DECIMAL(20,8)
  percentage_return: string; // DECIMAL(10,4)
  portfolio_value: string; // DECIMAL(20,8)
  trade_count: number;
  win_rate: string; // DECIMAL(5,2)
  calculated_at: string; // TIMESTAMP
  created_at: string; // TIMESTAMP
}

export interface SearchHistory {
  id: string; // UUID
  user_id: string; // UUID
  query: string;
  crypto_id?: string;
  symbol?: string;
  searched_at: string; // TIMESTAMP
  created_at: string; // TIMESTAMP
}

export interface PriceAlert {
  id: string; // UUID
  user_id: string; // UUID
  crypto_id: string;
  symbol: string;
  target_price: string; // DECIMAL(20,8)
  alert_type: "ABOVE" | "BELOW";
  is_active: boolean;
  triggered_at?: string; // TIMESTAMP
  created_at: string; // TIMESTAMP
  updated_at: string; // TIMESTAMP
}

export interface UserSettings {
  id: string; // UUID
  user_id: string; // UUID
  notifications_enabled: boolean;
  price_alerts_enabled: boolean;
  balance_hidden: boolean;
  language: string;
  theme: string;
  currency: string;
  created_at: string; // TIMESTAMP
  updated_at: string; // TIMESTAMP
}

// Database operation types
export interface CreateUserParams {
  username: string;
  display_name?: string;
  avatar_emoji?: string;
  balance?: string;
}

export interface UpdateUserParams {
  id: string;
  display_name?: string;
  avatar_emoji?: string;
  balance?: string;
  total_pnl?: string;
  total_trades?: number;
  win_rate?: string;
  global_rank?: number;
  last_active?: string;
}

export interface CreatePortfolioParams {
  user_id: string;
  symbol: string;
  quantity: string;
  avg_cost: string;
  current_price?: string;
  total_value?: string;
  profit_loss?: string;
  profit_loss_percent?: string;
  image_url?: string;
}

export interface UpdatePortfolioParams {
  id: string;
  quantity?: string;
  avg_cost?: string;
  current_price?: string;
  total_value?: string;
  profit_loss?: string;
  profit_loss_percent?: string;
  image_url?: string;
}

export interface CreateTransactionParams {
  user_id: string;
  type: "BUY" | "SELL";
  symbol: string;
  quantity: string;
  price: string;
  total_value: string;
  fee?: string;
  order_type?: "MARKET" | "LIMIT";
  status?: "PENDING" | "COMPLETED" | "CANCELLED" | "FAILED";
  collection_id?: string;
  timestamp?: string;
}

export interface CreateCollectionParams {
  name: string;
  description?: string;
  owner_id: string;
  invite_code: string;
  is_public?: boolean;
  allow_invites?: boolean;
  max_members?: number;
  starting_balance?: string;
  duration_days?: number;
  rules?: Record<string, any>;
}

export interface UpdateCollectionParams {
  id: string;
  name?: string;
  description?: string;
  is_public?: boolean;
  allow_invites?: boolean;
  max_members?: number;
  rules?: Record<string, any>;
  status?: "ACTIVE" | "COMPLETED" | "CANCELLED";
  end_date?: string;
}

export interface CreateCollectionMemberParams {
  collection_id: string;
  user_id: string;
  role?: "OWNER" | "ADMIN" | "MEMBER";
  balance?: string;
}

export interface CreateFavoriteParams {
  user_id: string;
  crypto_id: string;
  symbol: string;
  name: string;
  image_url?: string;
}

export interface CreateLeaderboardRankingParams {
  user_id: string;
  collection_id?: string;
  period: "WEEKLY" | "MONTHLY" | "ALL_TIME";
  rank: number;
  total_pnl: string;
  percentage_return: string;
  portfolio_value: string;
  trade_count?: number;
  win_rate?: string;
}

export interface CreateSearchHistoryParams {
  user_id: string;
  query: string;
  crypto_id?: string;
  symbol?: string;
}

export interface CreatePriceAlertParams {
  user_id: string;
  crypto_id: string;
  symbol: string;
  target_price: string;
  alert_type: "ABOVE" | "BELOW";
}

export interface UpdatePriceAlertParams {
  id: string;
  target_price?: string;
  alert_type?: "ABOVE" | "BELOW";
  is_active?: boolean;
  triggered_at?: string;
}

export interface CreateUserSettingsParams {
  user_id: string;
  notifications_enabled?: boolean;
  price_alerts_enabled?: boolean;
  balance_hidden?: boolean;
  language?: string;
  theme?: string;
  currency?: string;
}

export interface UpdateUserSettingsParams {
  id: string;
  notifications_enabled?: boolean;
  price_alerts_enabled?: boolean;
  balance_hidden?: boolean;
  language?: string;
  theme?: string;
  currency?: string;
}

// Query result types
export interface PortfolioWithSymbol extends Portfolio {
  // Additional fields for UI display
  symbol_name?: string;
  price_change_24h?: string;
  price_change_percent_24h?: string;
}

export interface TransactionWithDetails extends Transaction {
  // Additional fields for UI display
  symbol_name?: string;
  collection_name?: string;
}

export interface CollectionWithDetails extends Collection {
  // Additional fields for UI display
  owner_name?: string;
  member_list?: CollectionMember[];
}

export interface UserWithStats extends User {
  // Additional computed fields
  portfolio_value?: string;
  total_assets?: number;
  best_performing_asset?: string;
  worst_performing_asset?: string;
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
