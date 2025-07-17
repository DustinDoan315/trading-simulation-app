-- Migration: Create daily transaction limits table
-- This table tracks how many transactions each user has made per day
-- Used to enforce daily transaction limits (e.g., 10 transactions per day)

CREATE TABLE IF NOT EXISTS daily_transaction_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    daily_limit INTEGER NOT NULL DEFAULT 10,
    last_transaction_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user per day
    UNIQUE(user_id, transaction_date)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_daily_transaction_limits_user_date 
ON daily_transaction_limits(user_id, transaction_date);

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_daily_transaction_limits_date 
ON daily_transaction_limits(transaction_date);

-- Add RLS (Row Level Security) policies
ALTER TABLE daily_transaction_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own daily limits
CREATE POLICY "Users can view own daily limits" ON daily_transaction_limits
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own daily limits (for incrementing count)
CREATE POLICY "Users can update own daily limits" ON daily_transaction_limits
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: System can insert daily limits
CREATE POLICY "System can insert daily limits" ON daily_transaction_limits
    FOR INSERT WITH CHECK (true);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_transaction_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_daily_transaction_limits_updated_at
    BEFORE UPDATE ON daily_transaction_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_transaction_limits_updated_at();

-- Function to get or create daily limit record
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

-- Function to increment transaction count
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

-- Function to get remaining transactions for today
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

-- Function to reset daily limits (useful for testing or admin purposes)
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