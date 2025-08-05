-- =====================================================
-- PRODUCTION DATABASE SCHEMA FOR TRADING SIMULATION APP
-- =====================================================
-- This file contains the complete database schema for the trading simulation app
-- Copy and paste this entire script into your Supabase SQL Editor for production deployment
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table
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
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(20,8) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    avg_cost DECIMAL(20,8) NOT NULL DEFAULT 0 CHECK (avg_cost >= 0),
    current_price DECIMAL(20,8) DEFAULT 0 CHECK (current_price >= 0),
    total_value DECIMAL(20,8) DEFAULT 0,
    profit_loss DECIMAL(20,8) DEFAULT 0,
    profit_loss_percent DECIMAL(10,4) DEFAULT 0,
    image_url TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

-- Transactions table
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

-- Collections table
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

-- Collection members table
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

-- Favorites table
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

-- Leaderboard rankings table
CREATE TABLE IF NOT EXISTS leaderboard_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    period VARCHAR(20) NOT NULL CHECK (period IN ('DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME')),
    rank INTEGER NOT NULL CHECK (rank >= 0),
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, collection_id, period)
);

-- =====================================================
-- FEATURE TABLES
-- =====================================================

-- Daily transaction limits table
CREATE TABLE IF NOT EXISTS daily_transaction_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    daily_limit INTEGER NOT NULL DEFAULT 10,
    last_transaction_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, transaction_date)
);

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED')),
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    invite_code VARCHAR(20) UNIQUE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, friend_id)
);

-- Friend invitations table
CREATE TABLE IF NOT EXISTS friend_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    max_uses INTEGER DEFAULT 10,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraint for transactions.collection_id after collections table is created
ALTER TABLE transactions ADD CONSTRAINT IF NOT EXISTS fk_transactions_collection_id 
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL;

-- =====================================================
-- INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_global_rank ON users(global_rank);
CREATE INDEX IF NOT EXISTS idx_users_total_pnl ON users(total_pnl DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Portfolio indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_user_symbol ON portfolio(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_symbol ON portfolio(symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_total_value ON portfolio(total_value DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_profit_loss ON portfolio(profit_loss DESC);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_collection_id ON transactions(collection_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_symbol_time ON transactions(user_id, symbol, timestamp DESC);

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_owner_id ON collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_collections_invite_code ON collections(invite_code);
CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status);
CREATE INDEX IF NOT EXISTS idx_collections_start_date ON collections(start_date);
CREATE INDEX IF NOT EXISTS idx_collections_public ON collections(is_public, status);

-- Collection members indexes
CREATE INDEX IF NOT EXISTS idx_collection_members_collection_id ON collection_members(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_members_user_id ON collection_members(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_members_rank ON collection_members(collection_id, rank);
CREATE INDEX IF NOT EXISTS idx_collection_members_pnl ON collection_members(collection_id, total_pnl DESC);

-- Leaderboard indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_period_rank ON leaderboard_rankings(period, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_collection_period ON leaderboard_rankings(collection_id, period);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_period ON leaderboard_rankings(user_id, period);
CREATE INDEX IF NOT EXISTS idx_leaderboard_pnl ON leaderboard_rankings(period, total_pnl DESC);

-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_crypto_id ON favorites(crypto_id);
CREATE INDEX IF NOT EXISTS idx_favorites_added_at ON favorites(user_id, added_at DESC);

-- Daily transaction limits indexes
CREATE INDEX IF NOT EXISTS idx_daily_transaction_limits_user_date ON daily_transaction_limits(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_daily_transaction_limits_date ON daily_transaction_limits(transaction_date);

-- Friends indexes
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_friends_user_status ON friends(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friends_invite_code ON friends(invite_code);
CREATE INDEX IF NOT EXISTS idx_friend_invitations_code ON friend_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_friend_invitations_created_by ON friend_invitations(created_by);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Update updated_at column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update leaderboard rankings function
CREATE OR REPLACE FUNCTION update_leaderboard_rankings()
RETURNS TRIGGER AS $$
BEGIN
    -- Update global rankings (no collection_id)
    UPDATE leaderboard_rankings 
    SET rank = subquery.new_rank
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY period 
                ORDER BY total_pnl DESC, portfolio_value DESC
            ) as new_rank
        FROM leaderboard_rankings 
        WHERE collection_id IS NULL
    ) subquery
    WHERE leaderboard_rankings.id = subquery.id;
    
    -- Update collection-specific rankings
    UPDATE leaderboard_rankings 
    SET rank = subquery.new_rank
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY collection_id, period 
                ORDER BY total_pnl DESC, portfolio_value DESC
            ) as new_rank
        FROM leaderboard_rankings 
        WHERE collection_id IS NOT NULL
    ) subquery
    WHERE leaderboard_rankings.id = subquery.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if user should be ranked function
CREATE OR REPLACE FUNCTION should_user_be_ranked(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_trades BOOLEAN;
BEGIN
    -- Check if user has any portfolio items other than USDT with quantity > 0
    SELECT EXISTS(
        SELECT 1 FROM portfolio 
        WHERE user_id = user_uuid 
        AND symbol != 'USDT' 
        AND quantity > 0
    ) INTO has_trades;
    
    RETURN has_trades;
END;
$$ LANGUAGE plpgsql;

-- Update user stats function
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

-- Calculate portfolio value function
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

-- Update portfolio stats function
CREATE OR REPLACE FUNCTION update_portfolio_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate profit/loss
    NEW.profit_loss = NEW.total_value - (NEW.quantity * NEW.avg_cost);
    NEW.profit_loss_percent = CASE 
        WHEN (NEW.quantity * NEW.avg_cost) > 0 THEN (NEW.profit_loss / (NEW.quantity * NEW.avg_cost)) * 100
        ELSE 0
    END;
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Daily transaction limits functions
CREATE OR REPLACE FUNCTION update_daily_transaction_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_or_create_daily_limit(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE,
    p_daily_limit INTEGER DEFAULT 10
)
RETURNS daily_transaction_limits AS $$
DECLARE
    result daily_transaction_limits;
BEGIN
    -- Try to get existing record
    SELECT * INTO result
    FROM daily_transaction_limits
    WHERE user_id = p_user_id AND transaction_date = p_date;
    
    -- If no record exists, create one
    IF result IS NULL THEN
        INSERT INTO daily_transaction_limits (user_id, transaction_date, daily_limit)
        VALUES (p_user_id, p_date, p_daily_limit)
        RETURNING * INTO result;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_daily_transaction_count(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    current_limit daily_transaction_limits;
BEGIN
    -- Get or create daily limit record
    SELECT * INTO current_limit
    FROM get_or_create_daily_limit(p_user_id, p_date);
    
    -- Check if user has reached their daily limit
    IF current_limit.transaction_count >= current_limit.daily_limit THEN
        RETURN FALSE; -- Limit reached
    END IF;
    
    -- Increment transaction count
    UPDATE daily_transaction_limits
    SET 
        transaction_count = transaction_count + 1,
        last_transaction_at = NOW()
    WHERE user_id = p_user_id AND transaction_date = p_date;
    
    RETURN TRUE; -- Transaction allowed
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_remaining_daily_transactions(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    current_limit daily_transaction_limits;
BEGIN
    -- Get or create daily limit record
    SELECT * INTO current_limit
    FROM get_or_create_daily_limit(p_user_id, p_date);
    
    RETURN GREATEST(0, current_limit.daily_limit - current_limit.transaction_count);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reset_daily_transaction_limit(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
BEGIN
    UPDATE daily_transaction_limits
    SET 
        transaction_count = 0,
        last_transaction_at = NULL
    WHERE user_id = p_user_id AND transaction_date = p_date;
END;
$$ LANGUAGE plpgsql;

-- Friends functions
CREATE OR REPLACE FUNCTION generate_friend_invite_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    code VARCHAR(20);
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate a 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM friend_invitations WHERE invite_code = code) THEN
            RETURN code;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique invite code after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_friend_invitation(
    p_created_by UUID,
    p_max_uses INTEGER DEFAULT 10,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VARCHAR(20) 
SECURITY DEFINER
AS $$
DECLARE
    invite_code VARCHAR(20);
BEGIN
    -- Generate unique invite code
    invite_code := generate_friend_invite_code();
    
    -- Create invitation record
    INSERT INTO friend_invitations (
        invite_code,
        created_by,
        max_uses,
        expires_at
    ) VALUES (
        invite_code,
        p_created_by,
        p_max_uses,
        COALESCE(p_expires_at, NOW() + INTERVAL '7 days')
    );
    
    RETURN invite_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION accept_friend_invitation(
    p_invite_code VARCHAR(20),
    p_user_id UUID
)
RETURNS BOOLEAN 
SECURITY DEFINER
AS $$
DECLARE
    invitation_record RECORD;
    friend_record RECORD;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation_record 
    FROM friend_invitations 
    WHERE invite_code = p_invite_code 
    AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation code';
    END IF;
    
    -- Check if invitation is expired
    IF invitation_record.expires_at < NOW() THEN
        RAISE EXCEPTION 'Invitation has expired';
    END IF;
    
    -- Check if max uses reached
    IF invitation_record.current_uses >= invitation_record.max_uses THEN
        RAISE EXCEPTION 'Invitation usage limit reached';
    END IF;
    
    -- Check if user is trying to add themselves
    IF invitation_record.created_by = p_user_id THEN
        RAISE EXCEPTION 'Cannot add yourself as a friend';
    END IF;
    
    -- Check if friendship already exists
    IF EXISTS (
        SELECT 1 FROM friends 
        WHERE (user_id = invitation_record.created_by AND friend_id = p_user_id)
        OR (user_id = p_user_id AND friend_id = invitation_record.created_by)
    ) THEN
        RAISE EXCEPTION 'Friendship already exists';
    END IF;
    
    -- Create bidirectional friendship
    INSERT INTO friends (user_id, friend_id, status, invited_by, invite_code, accepted_at)
    VALUES 
        (invitation_record.created_by, p_user_id, 'ACCEPTED', invitation_record.created_by, p_invite_code, NOW()),
        (p_user_id, invitation_record.created_by, 'ACCEPTED', invitation_record.created_by, p_invite_code, NOW());
    
    -- Update invitation usage count
    UPDATE friend_invitations 
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE invite_code = p_invite_code;
    
    -- Deactivate invitation if max uses reached
    IF invitation_record.current_uses + 1 >= invitation_record.max_uses THEN
        UPDATE friend_invitations 
        SET is_active = FALSE,
            updated_at = NOW()
        WHERE invite_code = p_invite_code;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps triggers
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

CREATE TRIGGER update_leaderboard_rankings_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON leaderboard_rankings 
    FOR EACH ROW EXECUTE FUNCTION update_leaderboard_rankings();

CREATE TRIGGER update_leaderboard_rankings_timestamp 
    BEFORE UPDATE ON leaderboard_rankings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friends_timestamp 
    BEFORE UPDATE ON friends 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friend_invitations_timestamp 
    BEFORE UPDATE ON friend_invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_daily_transaction_limits_updated_at
    BEFORE UPDATE ON daily_transaction_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_transaction_limits_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_transaction_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_invitations ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users 
    FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own data" ON users 
    FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own data" ON users 
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Portfolio policies
CREATE POLICY "Users can view their own portfolio" ON portfolio 
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own portfolio" ON portfolio 
    FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own portfolio" ON portfolio 
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can delete their own portfolio" ON portfolio 
    FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions 
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own transactions" ON transactions 
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Collection members can view collection transactions" ON transactions 
    FOR SELECT USING (collection_id IS NOT NULL AND EXISTS (SELECT 1 FROM collection_members WHERE collection_id = transactions.collection_id AND user_id = auth.uid()));

-- Collections policies
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

-- Collection members policies
CREATE POLICY "Members can view collection membership" ON collection_members 
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can join collections" ON collection_members 
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can leave collections" ON collection_members 
    FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Collection owners can manage members" ON collection_members 
    FOR ALL USING (EXISTS (SELECT 1 FROM collections WHERE id = collection_members.collection_id AND owner_id = auth.uid()) OR auth.role() = 'service_role');

-- Favorites policies
CREATE POLICY "Users can manage their own favorites" ON favorites 
    FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Leaderboard policies
CREATE POLICY "Leaderboard rankings are publicly viewable" ON leaderboard_rankings 
    FOR SELECT USING (true);

CREATE POLICY "System can manage leaderboard rankings" ON leaderboard_rankings 
    FOR ALL USING (auth.role() = 'service_role');

-- Daily transaction limits policies
CREATE POLICY "Allow all operations for daily limits" ON daily_transaction_limits
    FOR ALL USING (true) WITH CHECK (true);

-- Friends policies
CREATE POLICY "Friends table access" ON friends 
    FOR ALL USING (auth.role() = 'service_role' OR auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Friend invitations table access" ON friend_invitations 
    FOR ALL USING (auth.role() = 'service_role' OR auth.uid() = created_by);

-- =====================================================
-- PRODUCTION SETTINGS
-- =====================================================

-- For production, keep RLS enabled
-- The policies above will handle access control

-- Success message
SELECT 'Production database schema created successfully for trading simulation app!' as status;
SELECT 'All tables, indexes, functions, triggers, and RLS policies have been created.' as details;
SELECT 'Ready for production deployment.' as deployment_status; 