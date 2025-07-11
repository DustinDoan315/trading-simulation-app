-- Migration to fix leaderboard_rankings table columns
-- Run this in your Supabase SQL Editor

-- First, let's check if the table exists and what columns it has
-- You can run this to see the current structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leaderboard_rankings';

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add percentage_return column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leaderboard_rankings' AND column_name = 'percentage_return'
    ) THEN
        ALTER TABLE leaderboard_rankings ADD COLUMN percentage_return DECIMAL(10,4) DEFAULT 0;
        RAISE NOTICE 'Added percentage_return column to leaderboard_rankings';
    END IF;

    -- Add portfolio_value column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leaderboard_rankings' AND column_name = 'portfolio_value'
    ) THEN
        ALTER TABLE leaderboard_rankings ADD COLUMN portfolio_value DECIMAL(30,10) DEFAULT 0;
        RAISE NOTICE 'Added portfolio_value column to leaderboard_rankings';
    END IF;

    -- Add trade_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leaderboard_rankings' AND column_name = 'trade_count'
    ) THEN
        ALTER TABLE leaderboard_rankings ADD COLUMN trade_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added trade_count column to leaderboard_rankings';
    END IF;

    -- Add win_rate column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leaderboard_rankings' AND column_name = 'win_rate'
    ) THEN
        ALTER TABLE leaderboard_rankings ADD COLUMN win_rate DECIMAL(5,2) DEFAULT 0;
        RAISE NOTICE 'Added win_rate column to leaderboard_rankings';
    END IF;

    -- Add total_volume column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leaderboard_rankings' AND column_name = 'total_volume'
    ) THEN
        ALTER TABLE leaderboard_rankings ADD COLUMN total_volume DECIMAL(30,10) DEFAULT 0;
        RAISE NOTICE 'Added total_volume column to leaderboard_rankings';
    END IF;

    -- Add sharpe_ratio column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leaderboard_rankings' AND column_name = 'sharpe_ratio'
    ) THEN
        ALTER TABLE leaderboard_rankings ADD COLUMN sharpe_ratio DECIMAL(10,4);
        RAISE NOTICE 'Added sharpe_ratio column to leaderboard_rankings';
    END IF;

    -- Add max_drawdown column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leaderboard_rankings' AND column_name = 'max_drawdown'
    ) THEN
        ALTER TABLE leaderboard_rankings ADD COLUMN max_drawdown DECIMAL(10,4);
        RAISE NOTICE 'Added max_drawdown column to leaderboard_rankings';
    END IF;

    -- Add calculated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leaderboard_rankings' AND column_name = 'calculated_at'
    ) THEN
        ALTER TABLE leaderboard_rankings ADD COLUMN calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added calculated_at column to leaderboard_rankings';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leaderboard_rankings' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE leaderboard_rankings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to leaderboard_rankings';
    END IF;

    RAISE NOTICE 'Migration completed successfully';
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_leaderboard_period_rank ON leaderboard_rankings(period, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_collection_period ON leaderboard_rankings(collection_id, period);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_period ON leaderboard_rankings(user_id, period);
CREATE INDEX IF NOT EXISTS idx_leaderboard_pnl ON leaderboard_rankings(period, total_pnl DESC);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'leaderboard_rankings_user_collection_period_unique'
    ) THEN
        ALTER TABLE leaderboard_rankings ADD CONSTRAINT leaderboard_rankings_user_collection_period_unique 
        UNIQUE(user_id, collection_id, period);
        RAISE NOTICE 'Added unique constraint on (user_id, collection_id, period)';
    END IF;
END $$;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'leaderboard_rankings' 
ORDER BY ordinal_position; 