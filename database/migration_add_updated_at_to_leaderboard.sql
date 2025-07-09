-- Migration: Add updated_at column to leaderboard_rankings table
-- Run this script to add the updated_at column to existing leaderboard_rankings table

-- Add updated_at column
ALTER TABLE leaderboard_rankings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER IF NOT EXISTS update_leaderboard_rankings_timestamp 
    BEFORE UPDATE ON leaderboard_rankings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing rows to have updated_at = created_at
UPDATE leaderboard_rankings 
SET updated_at = created_at 
WHERE updated_at IS NULL; 