// database/schema.ts - Supabase Schema Definition
// This file defines the database schema for Supabase

export const SUPABASE_SCHEMA = {
  // Users table
  users: {
    id: "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
    username: "VARCHAR(50) UNIQUE NOT NULL",
    display_name: "VARCHAR(100)",
    avatar_emoji: "VARCHAR(10) DEFAULT '🚀'",
    balance: "DECIMAL(20,8) DEFAULT 100000.00",
    total_pnl: "DECIMAL(20,8) DEFAULT 0.00",
    total_trades: "INTEGER DEFAULT 0",
    win_rate: "DECIMAL(5,2) DEFAULT 0.00",
    global_rank: "INTEGER",
    join_date: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    last_active: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    created_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    updated_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
  },

  // Portfolio table
  portfolio: {
    id: "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
    user_id: "UUID REFERENCES users(id) ON DELETE CASCADE",
    symbol: "VARCHAR(20) NOT NULL",
    quantity: "DECIMAL(20,8) NOT NULL DEFAULT 0",
    avg_cost: "DECIMAL(20,8) NOT NULL DEFAULT 0",
    current_price: "DECIMAL(20,8) DEFAULT 0",
    total_value: "DECIMAL(20,8) DEFAULT 0",
    profit_loss: "DECIMAL(20,8) DEFAULT 0",
    profit_loss_percent: "DECIMAL(10,4) DEFAULT 0",
    image_url: "TEXT",
    last_updated: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    created_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    updated_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    unique_constraint: "UNIQUE(user_id, symbol)",
  },

  // Transactions table
  transactions: {
    id: "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
    user_id: "UUID REFERENCES users(id) ON DELETE CASCADE",
    type: "VARCHAR(10) NOT NULL CHECK (type IN ('BUY', 'SELL'))",
    symbol: "VARCHAR(20) NOT NULL",
    quantity: "DECIMAL(20,8) NOT NULL",
    price: "DECIMAL(20,8) NOT NULL",
    total_value: "DECIMAL(20,8) NOT NULL",
    fee: "DECIMAL(20,8) DEFAULT 0",
    order_type:
      "VARCHAR(20) DEFAULT 'MARKET' CHECK (order_type IN ('MARKET', 'LIMIT'))",
    status:
      "VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'FAILED'))",
    collection_id: "UUID REFERENCES collections(id) ON DELETE SET NULL",
    timestamp: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    created_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
  },

  // Collections table
  collections: {
    id: "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
    name: "VARCHAR(100) NOT NULL",
    description: "TEXT",
    owner_id: "UUID REFERENCES users(id) ON DELETE CASCADE",
    invite_code: "VARCHAR(20) UNIQUE NOT NULL",
    is_public: "BOOLEAN DEFAULT TRUE",
    allow_invites: "BOOLEAN DEFAULT TRUE",
    max_members: "INTEGER DEFAULT 50",
    starting_balance: "DECIMAL(20,8) DEFAULT 100000.00",
    duration_days: "INTEGER DEFAULT 30",
    rules: "JSONB DEFAULT '{}'",
    total_value: "DECIMAL(20,8) DEFAULT 0",
    avg_pnl: "DECIMAL(10,4) DEFAULT 0",
    member_count: "INTEGER DEFAULT 0",
    rank: "INTEGER",
    status:
      "VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED'))",
    start_date: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    end_date: "TIMESTAMP WITH TIME ZONE",
    created_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    updated_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
  },

  // Collection members table
  collection_members: {
    id: "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
    collection_id: "UUID REFERENCES collections(id) ON DELETE CASCADE",
    user_id: "UUID REFERENCES users(id) ON DELETE CASCADE",
    role: "VARCHAR(20) DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER'))",
    balance: "DECIMAL(20,8) DEFAULT 0",
    total_pnl: "DECIMAL(20,8) DEFAULT 0",
    rank: "INTEGER",
    joined_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    created_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    unique_constraint: "UNIQUE(collection_id, user_id)",
  },

  // Favorites table
  favorites: {
    id: "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
    user_id: "UUID REFERENCES users(id) ON DELETE CASCADE",
    crypto_id: "VARCHAR(50) NOT NULL",
    symbol: "VARCHAR(20) NOT NULL",
    name: "VARCHAR(100) NOT NULL",
    image_url: "TEXT",
    added_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    unique_constraint: "UNIQUE(user_id, crypto_id)",
  },

  // Leaderboard rankings table
  leaderboard_rankings: {
    id: "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
    user_id: "UUID REFERENCES users(id) ON DELETE CASCADE",
    collection_id: "UUID REFERENCES collections(id) ON DELETE SET NULL",
    period:
      "VARCHAR(20) NOT NULL CHECK (period IN ('WEEKLY', 'MONTHLY', 'ALL_TIME'))",
    rank: "INTEGER NOT NULL",
    total_pnl: "DECIMAL(20,8) NOT NULL",
    percentage_return: "DECIMAL(10,4) NOT NULL",
    portfolio_value: "DECIMAL(20,8) NOT NULL",
    trade_count: "INTEGER DEFAULT 0",
    win_rate: "DECIMAL(5,2) DEFAULT 0",
    calculated_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    created_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    unique_constraint: "UNIQUE(user_id, collection_id, period)",
  },

  // Search history table
  search_history: {
    id: "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
    user_id: "UUID REFERENCES users(id) ON DELETE CASCADE",
    query: "VARCHAR(255) NOT NULL",
    crypto_id: "VARCHAR(50)",
    symbol: "VARCHAR(20)",
    searched_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    created_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
  },

  // Price alerts table
  price_alerts: {
    id: "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
    user_id: "UUID REFERENCES users(id) ON DELETE CASCADE",
    crypto_id: "VARCHAR(50) NOT NULL",
    symbol: "VARCHAR(20) NOT NULL",
    target_price: "DECIMAL(20,8) NOT NULL",
    alert_type: "VARCHAR(20) NOT NULL CHECK (alert_type IN ('ABOVE', 'BELOW'))",
    is_active: "BOOLEAN DEFAULT TRUE",
    triggered_at: "TIMESTAMP WITH TIME ZONE",
    created_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    updated_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
  },

  // User settings table
  user_settings: {
    id: "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
    user_id: "UUID REFERENCES users(id) ON DELETE CASCADE",
    notifications_enabled: "BOOLEAN DEFAULT TRUE",
    price_alerts_enabled: "BOOLEAN DEFAULT TRUE",
    balance_hidden: "BOOLEAN DEFAULT FALSE",
    language: "VARCHAR(10) DEFAULT 'en'",
    theme: "VARCHAR(20) DEFAULT 'dark'",
    currency: "VARCHAR(10) DEFAULT 'USD'",
    created_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    updated_at: "TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    unique_constraint: "UNIQUE(user_id)",
  },
};

// Indexes for performance
export const SUPABASE_INDEXES = [
  // Portfolio indexes
  "CREATE INDEX IF NOT EXISTS idx_portfolio_user_symbol ON portfolio(user_id, symbol)",
  "CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id)",

  // Transaction indexes
  "CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(symbol)",
  "CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp)",
  "CREATE INDEX IF NOT EXISTS idx_transactions_collection_id ON transactions(collection_id)",

  // Collection indexes
  "CREATE INDEX IF NOT EXISTS idx_collections_owner_id ON collections(owner_id)",
  "CREATE INDEX IF NOT EXISTS idx_collections_invite_code ON collections(invite_code)",
  "CREATE INDEX IF NOT EXISTS idx_collections_rank ON collections(rank)",

  // Collection members indexes
  "CREATE INDEX IF NOT EXISTS idx_collection_members_collection_id ON collection_members(collection_id)",
  "CREATE INDEX IF NOT EXISTS idx_collection_members_user_id ON collection_members(user_id)",

  // Leaderboard indexes
  "CREATE INDEX IF NOT EXISTS idx_leaderboard_user_period ON leaderboard_rankings(user_id, period)",
  "CREATE INDEX IF NOT EXISTS idx_leaderboard_collection_period ON leaderboard_rankings(collection_id, period)",
  "CREATE INDEX IF NOT EXISTS idx_leaderboard_rank_period ON leaderboard_rankings(rank, period)",

  // Favorites indexes
  "CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_favorites_crypto_id ON favorites(crypto_id)",

  // Search history indexes
  "CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at)",

  // Price alerts indexes
  "CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_price_alerts_crypto_id ON price_alerts(crypto_id)",
  "CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active)",
];

// RLS Policies
export const SUPABASE_RLS_POLICIES = {
  users: [
    "CREATE POLICY \"Users can view their own data\" ON users FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can update their own data\" ON users FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can insert their own data\" ON users FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
  ],

  portfolio: [
    "CREATE POLICY \"Users can view their own portfolio\" ON portfolio FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can update their own portfolio\" ON portfolio FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can insert their own portfolio\" ON portfolio FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can delete their own portfolio\" ON portfolio FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
  ],

  transactions: [
    "CREATE POLICY \"Users can view their own transactions\" ON transactions FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can insert their own transactions\" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
  ],

  collections: [
    "CREATE POLICY \"Collections are viewable by all authenticated users\" ON collections FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can create collections\" ON collections FOR INSERT WITH CHECK (auth.uid() = owner_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Owners can update their collections\" ON collections FOR UPDATE USING (auth.uid() = owner_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Owners can delete their collections\" ON collections FOR DELETE USING (auth.uid() = owner_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
  ],

  collection_members: [
    "CREATE POLICY \"Members can view collection members\" ON collection_members FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM collection_members cm WHERE cm.collection_id = collection_members.collection_id AND cm.user_id = auth.uid()) OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can join collections\" ON collection_members FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can leave collections\" ON collection_members FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
  ],

  favorites: [
    "CREATE POLICY \"Users can view their own favorites\" ON favorites FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can add favorites\" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can remove favorites\" ON favorites FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
  ],

  leaderboard_rankings: [
    'CREATE POLICY "Leaderboard rankings are viewable by all" ON leaderboard_rankings FOR SELECT USING (true)',
    'CREATE POLICY "System can insert rankings" ON leaderboard_rankings FOR INSERT WITH CHECK (true)',
  ],

  search_history: [
    "CREATE POLICY \"Users can view their own search history\" ON search_history FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can add search history\" ON search_history FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can delete their search history\" ON search_history FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
  ],

  price_alerts: [
    "CREATE POLICY \"Users can view their own price alerts\" ON price_alerts FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can manage their own price alerts\" ON price_alerts FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
  ],

  user_settings: [
    "CREATE POLICY \"Users can view their own settings\" ON user_settings FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can update their own settings\" ON user_settings FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
    "CREATE POLICY \"Users can insert their own settings\" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.role() = 'anon')",
  ],
};
