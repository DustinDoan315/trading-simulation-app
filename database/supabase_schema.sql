-- Complete Supabase Schema SQL Script
-- Copy and paste this entire script into your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_emoji VARCHAR(10) DEFAULT '🚀',
    usdt_balance DECIMAL(30,10) DEFAULT 100000.00,
    total_portfolio_value DECIMAL(30,10) DEFAULT 100000.00,
    initial_balance DECIMAL(30,10) DEFAULT 100000.00,
    total_pnl DECIMAL(30,10) DEFAULT 0.00,
    total_pnl_percentage DECIMAL(10,4) DEFAULT 0.00,
    total_trades INTEGER DEFAULT 0,
    total_buy_volume DECIMAL(30,10) DEFAULT 0.00,
    total_sell_volume DECIMAL(30,10) DEFAULT 0.00,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    global_rank INTEGER,
    last_trade_at TIMESTAMP WITH TIME ZONE,
    join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    quantity DECIMAL(30,10) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    avg_cost DECIMAL(30,10) NOT NULL DEFAULT 0 CHECK (avg_cost >= 0),
    current_price DECIMAL(30,10) DEFAULT 0 CHECK (current_price >= 0),
    total_cost_basis DECIMAL(30,10) DEFAULT 0,
    current_value DECIMAL(30,10) DEFAULT 0,
    unrealized_pnl DECIMAL(30,10) DEFAULT 0,
    unrealized_pnl_percentage DECIMAL(10,4) DEFAULT 0,
    realized_pnl DECIMAL(30,10) DEFAULT 0,
    image_url TEXT,
    is_base_currency BOOLEAN DEFAULT FALSE,
    first_purchase_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('BUY', 'SELL')),
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(30,10) NOT NULL CHECK (quantity > 0),
    price DECIMAL(30,10) NOT NULL CHECK (price > 0),
    total_value DECIMAL(30,10) NOT NULL CHECK (total_value > 0),
    fee DECIMAL(30,10) DEFAULT 0 CHECK (fee >= 0),
    usdt_balance_before DECIMAL(30,10),
    usdt_balance_after DECIMAL(30,10),
    order_type VARCHAR(20) DEFAULT 'MARKET' CHECK (order_type IN ('MARKET', 'LIMIT')),
    status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'FAILED')),
    collection_id UUID,
    execution_price DECIMAL(30,10),
    market_price_at_time DECIMAL(30,10),
    slippage DECIMAL(10,4) DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    allow_invites BOOLEAN DEFAULT TRUE,
    max_members INTEGER DEFAULT 50 CHECK (max_members > 0),
    starting_balance DECIMAL(30,10) DEFAULT 100000.00,
    duration_days INTEGER DEFAULT 30 CHECK (duration_days > 0),
    rules JSONB DEFAULT '{}',
    total_volume DECIMAL(30,10) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    best_performer_id UUID REFERENCES users(id),
    worst_performer_id UUID REFERENCES users(id),
    avg_pnl DECIMAL(10,4) DEFAULT 0,
    avg_pnl_percentage DECIMAL(10,4) DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    rank INTEGER,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for transactions.collection_id after collections table is created
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_collection_id 
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS collection_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    starting_balance DECIMAL(30,10) DEFAULT 0,
    current_balance DECIMAL(30,10) DEFAULT 0,
    total_pnl DECIMAL(30,10) DEFAULT 0,
    total_pnl_percentage DECIMAL(10,4) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    rank INTEGER,
    best_trade_pnl DECIMAL(30,10) DEFAULT 0,
    worst_trade_pnl DECIMAL(30,10) DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_trade_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, user_id)
);

CREATE TABLE IF NOT EXISTS trade_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    symbol VARCHAR(20) NOT NULL,
    total_trades INTEGER DEFAULT 0,
    buy_trades INTEGER DEFAULT 0,
    sell_trades INTEGER DEFAULT 0,
    total_volume DECIMAL(30,10) DEFAULT 0,
    total_pnl DECIMAL(30,10) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    avg_trade_size DECIMAL(30,10) DEFAULT 0,
    largest_win DECIMAL(30,10) DEFAULT 0,
    largest_loss DECIMAL(30,10) DEFAULT 0,
    avg_hold_time_hours DECIMAL(10,2) DEFAULT 0,
    first_trade_at TIMESTAMP WITH TIME ZONE,
    last_trade_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, collection_id, symbol)
);

CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crypto_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    image_url TEXT,
    price_when_added DECIMAL(30,10),
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, crypto_id)
);

CREATE TABLE IF NOT EXISTS leaderboard_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    period VARCHAR(20) NOT NULL CHECK (period IN ('DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME')),
    rank INTEGER NOT NULL CHECK (rank > 0),
    total_pnl DECIMAL(30,10) NOT NULL,
    percentage_return DECIMAL(10,4) NOT NULL,
    portfolio_value DECIMAL(30,10) NOT NULL,
    trade_count INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    total_volume DECIMAL(30,10) DEFAULT 0,
    sharpe_ratio DECIMAL(10,4),
    max_drawdown DECIMAL(10,4),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, collection_id, period)
);

CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    query VARCHAR(255) NOT NULL,
    crypto_id VARCHAR(50),
    symbol VARCHAR(20),
    result_count INTEGER DEFAULT 0,
    clicked_result BOOLEAN DEFAULT FALSE,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crypto_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    target_price DECIMAL(30,10) NOT NULL CHECK (target_price > 0),
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('ABOVE', 'BELOW', 'PERCENTAGE_CHANGE')),
    percentage_threshold DECIMAL(10,4),
    current_price_when_set DECIMAL(30,10),
    is_active BOOLEAN DEFAULT TRUE,
    is_repeating BOOLEAN DEFAULT FALSE,
    triggered_count INTEGER DEFAULT 0,
    triggered_at TIMESTAMP WITH TIME ZONE,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    price_alerts_enabled BOOLEAN DEFAULT TRUE,
    balance_hidden BOOLEAN DEFAULT FALSE,
    show_portfolio_percentage BOOLEAN DEFAULT TRUE,
    show_unrealized_pnl BOOLEAN DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'dark',
    currency VARCHAR(10) DEFAULT 'USD',
    default_order_type VARCHAR(10) DEFAULT 'MARKET' CHECK (default_order_type IN ('MARKET', 'LIMIT')),
    auto_refresh_interval INTEGER DEFAULT 30,
    risk_tolerance VARCHAR(20) DEFAULT 'MEDIUM' CHECK (risk_tolerance IN ('LOW', 'MEDIUM', 'HIGH')),
    public_profile BOOLEAN DEFAULT TRUE,
    show_in_leaderboard BOOLEAN DEFAULT TRUE,
    allow_friend_requests BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS balance_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    operation_type VARCHAR(50) NOT NULL,
    symbol VARCHAR(20),
    balance_before DECIMAL(30,10),
    balance_after DECIMAL(30,10),
    amount_changed DECIMAL(30,10),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_global_rank ON users(global_rank);
CREATE INDEX IF NOT EXISTS idx_users_total_pnl ON users(total_pnl DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_symbol ON portfolio(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_symbol ON portfolio(symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_current_value ON portfolio(current_value DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_unrealized_pnl ON portfolio(unrealized_pnl DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_collection_id ON transactions(collection_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_symbol_time ON transactions(user_id, symbol, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_collections_owner_id ON collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_collections_invite_code ON collections(invite_code);
CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status);
CREATE INDEX IF NOT EXISTS idx_collections_start_date ON collections(start_date);
CREATE INDEX IF NOT EXISTS idx_collections_public ON collections(is_public, status);

CREATE INDEX IF NOT EXISTS idx_collection_members_collection_id ON collection_members(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_members_user_id ON collection_members(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_members_rank ON collection_members(collection_id, rank);
CREATE INDEX IF NOT EXISTS idx_collection_members_pnl ON collection_members(collection_id, total_pnl DESC);

CREATE INDEX IF NOT EXISTS idx_trade_stats_user_symbol ON trade_statistics(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_trade_stats_collection ON trade_statistics(collection_id);
CREATE INDEX IF NOT EXISTS idx_trade_stats_performance ON trade_statistics(total_pnl DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_period_rank ON leaderboard_rankings(period, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_collection_period ON leaderboard_rankings(collection_id, period);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_period ON leaderboard_rankings(user_id, period);
CREATE INDEX IF NOT EXISTS idx_leaderboard_pnl ON leaderboard_rankings(period, total_pnl DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_crypto_id ON favorites(crypto_id);
CREATE INDEX IF NOT EXISTS idx_favorites_added_at ON favorites(user_id, added_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user_active ON price_alerts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_price_alerts_crypto_active ON price_alerts(crypto_id, is_active);
CREATE INDEX IF NOT EXISTS idx_price_alerts_triggered ON price_alerts(triggered_at);

CREATE INDEX IF NOT EXISTS idx_balance_audit_user_time ON balance_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_balance_audit_transaction ON balance_audit_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_balance_audit_operation ON balance_audit_log(operation_type);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user trade statistics when a transaction is completed
    IF NEW.status = 'COMPLETED' THEN
        UPDATE users SET
            total_trades = total_trades + 1,
            total_buy_volume = CASE WHEN NEW.type = 'BUY' THEN total_buy_volume + NEW.total_value ELSE total_buy_volume END,
            total_sell_volume = CASE WHEN NEW.type = 'SELL' THEN total_sell_volume + NEW.total_value ELSE total_sell_volume END,
            last_trade_at = NEW.timestamp,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_portfolio_value(user_uuid UUID)
RETURNS DECIMAL(30,10) AS $$
DECLARE
    total_value DECIMAL(30,10) := 0;
BEGIN
    SELECT COALESCE(SUM(current_value), 0)
    INTO total_value
    FROM portfolio
    WHERE user_id = user_uuid;
    
    RETURN total_value;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_portfolio_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate unrealized PnL
    NEW.unrealized_pnl = NEW.current_value - NEW.total_cost_basis;
    NEW.unrealized_pnl_percentage = CASE 
        WHEN NEW.total_cost_basis > 0 THEN (NEW.unrealized_pnl / NEW.total_cost_basis) * 100
        ELSE 0
    END;
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_user_stats_trigger 
    AFTER INSERT OR UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_portfolio_stats_trigger 
    BEFORE UPDATE ON portfolio 
    FOR EACH ROW EXECUTE FUNCTION update_portfolio_stats();

CREATE TRIGGER update_users_timestamp 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_timestamp 
    BEFORE UPDATE ON portfolio 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_timestamp 
    BEFORE UPDATE ON collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view their own data" ON users 
    FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own data" ON users 
    FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own data" ON users 
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Public profiles are viewable" ON users 
    FOR SELECT USING (EXISTS (SELECT 1 FROM user_settings WHERE user_id = users.id AND public_profile = true));

CREATE POLICY "Users can view their own portfolio" ON portfolio 
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own portfolio" ON portfolio 
    FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own portfolio" ON portfolio 
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can delete their own portfolio" ON portfolio 
    FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can view their own transactions" ON transactions 
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own transactions" ON transactions 
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Collection members can view collection transactions" ON transactions 
    FOR SELECT USING (collection_id IS NOT NULL AND EXISTS (SELECT 1 FROM collection_members WHERE collection_id = transactions.collection_id AND user_id = auth.uid()));

CREATE POLICY "Public collections are viewable" ON collections 
    FOR SELECT USING (is_public = true OR auth.role() = 'service_role');

CREATE POLICY "Collection members can view private collections" ON collections 
    FOR SELECT USING (EXISTS (SELECT 1 FROM collection_members WHERE collection_id = collections.id AND user_id = auth.uid()));

CREATE POLICY "Users can create collections" ON collections 
    FOR INSERT WITH CHECK (auth.uid() = owner_id OR auth.role() = 'service_role');

CREATE POLICY "Owners can update their collections" ON collections 
    FOR UPDATE USING (auth.uid() = owner_id OR auth.role() = 'service_role');

CREATE POLICY "Owners can delete their collections" ON collections 
    FOR DELETE USING (auth.uid() = owner_id OR auth.role() = 'service_role');

CREATE POLICY "Members can view collection membership" ON collection_members 
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM collection_members cm WHERE cm.collection_id = collection_members.collection_id AND cm.user_id = auth.uid()) OR auth.role() = 'service_role');

CREATE POLICY "Users can join collections" ON collection_members 
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can leave collections" ON collection_members 
    FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Collection owners can manage members" ON collection_members 
    FOR ALL USING (EXISTS (SELECT 1 FROM collections WHERE id = collection_members.collection_id AND owner_id = auth.uid()) OR auth.role() = 'service_role');

CREATE POLICY "Users can view their own stats" ON trade_statistics 
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Collection members can view collection stats" ON trade_statistics 
    FOR SELECT USING (collection_id IS NOT NULL AND EXISTS (SELECT 1 FROM collection_members WHERE collection_id = trade_statistics.collection_id AND user_id = auth.uid()));

CREATE POLICY "System can manage trade statistics" ON trade_statistics 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage their own favorites" ON favorites 
    FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Leaderboard rankings are publicly viewable" ON leaderboard_rankings 
    FOR SELECT USING (true);

CREATE POLICY "System can manage leaderboard rankings" ON leaderboard_rankings 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage their own search history" ON search_history 
    FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can manage their own price alerts" ON price_alerts 
    FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can manage their own settings" ON user_settings 
    FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can view their own balance history" ON balance_audit_log 
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "System can manage balance audit log" ON balance_audit_log 
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Success message
SELECT 'Database schema created successfully!' as status;

-- DEVELOPMENT ONLY: Disable RLS for easier development
-- Remove these lines in production and use proper authentication
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE collection_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE trade_statistics DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE search_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE balance_audit_log DISABLE ROW LEVEL SECURITY;

SELECT 'RLS disabled for development' as development_note; 