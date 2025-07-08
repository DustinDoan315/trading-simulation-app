// Database Schema Types - Updated for Enhanced Schema
export interface User {
  id: string; // UUID
  username: string;
  display_name?: string;
  avatar_emoji?: string;
  usdt_balance: string; // DECIMAL(30,10) - Available USDT for trading
  total_portfolio_value: string; // DECIMAL(30,10) - Total portfolio value in USD
  initial_balance: string; // DECIMAL(30,10) - Starting balance for PnL calculation
  total_pnl: string; // DECIMAL(30,10)
  total_pnl_percentage: string; // DECIMAL(10,4)
  total_trades: number;
  total_buy_volume: string; // DECIMAL(30,10)
  total_sell_volume: string; // DECIMAL(30,10)
  win_rate: string; // DECIMAL(5,2)
  global_rank?: number;
  last_trade_at?: string; // TIMESTAMP
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

// Enhanced Collection Member with separate balance tracking
export interface CollectionMember {
  id: string; // UUID
  collection_id: string; // UUID
  user_id: string; // UUID
  role: "OWNER" | "ADMIN" | "MEMBER";
  starting_balance: string; // DECIMAL(30,10) - Starting balance for this collection
  current_balance: string; // DECIMAL(30,10) - Current USDT balance in collection
  total_portfolio_value: string; // DECIMAL(30,10) - Total portfolio value in collection
  total_pnl: string; // DECIMAL(30,10) - Total PnL in collection
  total_pnl_percentage: string; // DECIMAL(10,4) - PnL percentage in collection
  total_trades: number; // Number of trades in collection
  win_rate: string; // DECIMAL(5,2) - Win rate in collection
  rank?: number; // Rank within collection
  best_trade_pnl: string; // DECIMAL(30,10) - Best single trade PnL
  worst_trade_pnl: string; // DECIMAL(30,10) - Worst single trade PnL
  joined_at: string; // TIMESTAMP
  last_trade_at?: string; // TIMESTAMP
  created_at: string; // TIMESTAMP
}

// New: Collection Portfolio for separate holdings tracking
export interface CollectionPortfolio {
  id: string; // UUID
  collection_id: string; // UUID
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

// Trading Context Types
export type TradingContextType = 'individual' | 'collection';

export interface TradingContext {
  type: TradingContextType;
  collectionId?: string;
}

// Enhanced Balance Types
export interface IndividualBalance {
  usdtBalance: number;
  totalPortfolioValue: number;
  holdings: Record<string, any>;
  totalPnL: number;
  totalPnLPercentage: number;
  initialBalance: number;
}

export interface CollectionBalance {
  usdtBalance: number;
  totalPortfolioValue: number;
  holdings: Record<string, any>;
  totalPnL: number;
  totalPnLPercentage: number;
  startingBalance: number;
  collectionId: string;
}

export interface DualBalanceState {
  individual: IndividualBalance;
  collections: Record<string, CollectionBalance>;
  activeContext: TradingContext;
}

// PnL Calculation Results
export interface PnLResult {
  totalPnL: number;
  totalPnLPercentage: number;
  context: TradingContextType;
  collectionId?: string;
  startingBalance: number;
  currentValue: number;
}

export interface CombinedPnLResult {
  individual: PnLResult;
  collections: PnLResult[];
  totalCombinedPnL: number;
  totalCombinedPnLPercentage: number;
}

// Enhanced Transaction with Context
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
  collection_id?: string; // UUID - for collection trading
  context_type?: TradingContextType; // 'individual' or 'collection'
  usdt_balance_before?: string; // DECIMAL(30,10)
  usdt_balance_after?: string; // DECIMAL(30,10)
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
  total_volume: string; // DECIMAL(30,10)
  total_trades: number;
  avg_pnl: string; // DECIMAL(10,4)
  avg_pnl_percentage: string; // DECIMAL(10,4)
  member_count: number;
  rank?: number;
  best_performer_id?: string; // UUID
  worst_performer_id?: string; // UUID
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  start_date: string; // TIMESTAMP
  end_date?: string; // TIMESTAMP
  created_at: string; // TIMESTAMP
  updated_at: string; // TIMESTAMP
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

// Database operation types
export interface CreateUserParams {
  username: string;
  display_name?: string;
  avatar_emoji?: string;
  usdt_balance?: string;
  total_portfolio_value?: string;
  initial_balance?: string;
}

export interface UpdateUserParams {
  id: string;
  display_name?: string;
  avatar_emoji?: string;
  usdt_balance?: string;
  total_portfolio_value?: string;
  total_pnl?: string;
  total_pnl_percentage?: string;
  total_trades?: number;
  total_buy_volume?: string;
  total_sell_volume?: string;
  win_rate?: string;
  global_rank?: number;
  last_trade_at?: string;
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
  users?: {
    username: string;
    display_name?: string;
  };
  member_list?: CollectionMember[];
  collection_members?: CollectionMember[];
}

export interface UserWithStats extends User {
  // Additional computed fields
  portfolio_value?: string;
  total_assets?: number;
  best_performing_asset?: string;
  worst_performing_asset?: string;
}

// User Settings interfaces removed - table deleted
// export interface UserSettings {
//   id: string; // UUID
//   user_id: string; // UUID
//   // Display preferences
//   notifications_enabled: boolean;
//   price_alerts_enabled: boolean;
//   balance_hidden: boolean;
//   show_portfolio_percentage: boolean;
//   show_profit_loss: boolean;
//   language: string;
//   theme: string;
//   currency: string;
//   // Trading preferences
//   default_order_type: "MARKET" | "LIMIT";
//   auto_refresh_interval: number;
//   risk_tolerance: "LOW" | "MEDIUM" | "HIGH";
//   // Privacy settings
//   public_profile: boolean;
//   show_in_leaderboard: boolean;
//   allow_friend_requests: boolean;
//   created_at: string; // TIMESTAMP
//   updated_at: string; // TIMESTAMP
// }

// export interface CreateUserSettingsParams {
//   user_id: string;
//   notifications_enabled?: boolean;
//   price_alerts_enabled?: boolean;
//   balance_hidden?: boolean;
//   show_portfolio_percentage?: boolean;
//   show_profit_loss?: boolean;
//   language?: string;
//   theme?: string;
//   currency?: string;
//   default_order_type?: "MARKET" | "LIMIT";
//   auto_refresh_interval?: number;
//   risk_tolerance?: "LOW" | "MEDIUM" | "HIGH";
//   public_profile?: boolean;
//   show_in_leaderboard?: boolean;
//   allow_friend_requests?: boolean;
// }

// export interface UpdateUserSettingsParams {
//   id: string;
//   notifications_enabled?: boolean;
//   price_alerts_enabled?: boolean;
//   balance_hidden?: boolean;
//   show_portfolio_percentage?: boolean;
//   show_profit_loss?: boolean;
//   language?: string;
//   theme?: string;
//   currency?: string;
//   default_order_type?: "MARKET" | "LIMIT";
//   auto_refresh_interval?: number;
//   risk_tolerance?: "LOW" | "MEDIUM" | "HIGH";
//   public_profile?: boolean;
//   show_in_leaderboard?: boolean;
//   allow_friend_requests?: boolean;
// }

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
