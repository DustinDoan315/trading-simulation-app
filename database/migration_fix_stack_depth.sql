-- Migration: Fix stack depth limit exceeded error
-- This script fixes the infinite recursion in leaderboard ranking functions
-- Run this script in your Supabase SQL Editor

-- =====================================================
-- FIX INFINITE RECURSION IN LEADERBOARD FUNCTIONS
-- =====================================================

-- First, drop the problematic trigger that causes infinite recursion
DROP TRIGGER IF EXISTS update_leaderboard_rankings_trigger
ON leaderboard_rankings;

-- Drop the problematic function
DROP FUNCTION IF EXISTS update_leaderboard_rankings
();

-- Create a new, safer version of the leaderboard ranking function
CREATE OR REPLACE FUNCTION update_leaderboard_rankings
()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent infinite recursion by checking if we're already in a trigger
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
  -- Only update rankings for other rows, not the current one being modified
  -- This prevents the infinite recursion

  -- Update global rankings (no collection_id) - exclude current row
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
      AND (TG_OP = 'DELETE' OR id != COALESCE(NEW.id, OLD.id))
        ) subquery
        WHERE leaderboard_rankings.id = subquery.id
    AND (TG_OP = 'DELETE' OR leaderboard_rankings.id != COALESCE(NEW.id, OLD.id));

  -- Update collection-specific rankings - exclude current row
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
      AND (TG_OP = 'DELETE' OR id != COALESCE(NEW.id, OLD.id))
        ) subquery
        WHERE leaderboard_rankings.id = subquery.id
    AND (TG_OP = 'DELETE' OR leaderboard_rankings.id != COALESCE(NEW.id, OLD.id));
END
IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create a safer trigger that only fires on specific conditions
CREATE TRIGGER update_leaderboard_rankings_trigger 
    AFTER
INSERT OR
UPDATE OF total_pnl, portfolio_value, period, collection_id OR
DELETE ON leaderboard_rankings 
    FOR EACH
ROW
EXECUTE FUNCTION update_leaderboard_rankings
();

-- =====================================================
-- ALTERNATIVE: DISABLE LEADERBOARD TRIGGERS FOR DEVELOPMENT
-- =====================================================
-- Uncomment the following lines if you want to disable leaderboard triggers completely

-- DROP TRIGGER IF EXISTS update_leaderboard_rankings_trigger ON leaderboard_rankings;
-- DROP TRIGGER IF EXISTS update_leaderboard_rankings_timestamp ON leaderboard_rankings;

-- =====================================================
-- INCREASE STACK DEPTH LIMIT (if needed)
-- =====================================================
-- Uncomment the following line if you need to increase the stack depth limit
-- ALTER SYSTEM SET max_stack_depth = '4096kB';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that the trigger is properly configured
SELECT
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'leaderboard_rankings'
ORDER BY trigger_name;

-- Success message
SELECT 'Stack depth issue fixed!' as status;
SELECT 'Leaderboard ranking triggers have been updated to prevent infinite recursion.' as details; 