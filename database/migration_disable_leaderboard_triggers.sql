-- Migration: Disable leaderboard triggers to fix stack depth error
-- This script disables the problematic leaderboard triggers that cause infinite recursion
-- Run this script in your Supabase SQL Editor

-- =====================================================
-- DISABLE PROBLEMATIC LEADERBOARD TRIGGERS
-- =====================================================

-- Drop the problematic trigger that causes infinite recursion
DROP TRIGGER IF EXISTS update_leaderboard_rankings_trigger
ON leaderboard_rankings;

-- Drop the timestamp trigger as well to be safe
DROP TRIGGER IF EXISTS update_leaderboard_rankings_timestamp
ON leaderboard_rankings;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that the triggers are disabled
SELECT
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'leaderboard_rankings'
ORDER BY trigger_name;

-- Success message
SELECT 'Leaderboard triggers disabled!' as status;
SELECT 'Stack depth error should be resolved. Leaderboard rankings will need to be updated manually or via application logic.' as details; 