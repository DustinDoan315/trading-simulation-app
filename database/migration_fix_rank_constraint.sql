-- Migration: Fix rank constraint to allow temporary rank 0
-- This allows the database trigger to calculate proper ranks

-- Drop the existing check constraint
ALTER TABLE leaderboard_rankings 
DROP CONSTRAINT IF EXISTS leaderboard_rankings_rank_check;

-- Add new check constraint that allows rank 0 (temporary) and positive ranks
ALTER TABLE leaderboard_rankings 
ADD CONSTRAINT leaderboard_rankings_rank_check 
CHECK (rank >= 0);

-- Update any existing rank 0 entries to rank 1 temporarily
UPDATE leaderboard_rankings 
SET rank = 1 
WHERE rank = 0;

-- The database trigger will recalculate proper ranks after this 