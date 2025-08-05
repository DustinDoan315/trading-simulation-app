-- Database Cleanup Script
-- Run this in your Supabase SQL Editor to clean up the problematic user data

-- First, fix the RLS policies
-- (This should be run first from the migration_fix_rls_policies.sql file)

-- Then clean up the specific user data
DELETE FROM transactions WHERE user_id = '6875B978-5128-4D29-9E07-9C5780687258';
DELETE FROM portfolio WHERE user_id = '6875B978-5128-4D29-9E07-9C5780687258';
DELETE FROM collection_members WHERE user_id = '6875B978-5128-4D29-9E07-9C5780687258';
DELETE FROM favorites WHERE user_id = '6875B978-5128-4D29-9E07-9C5780687258';
DELETE FROM daily_transaction_limits WHERE user_id = '6875B978-5128-4D29-9E07-9C5780687258';
DELETE FROM friends WHERE user_id = '6875B978-5128-4D29-9E07-9C5780687258' OR friend_id = '6875B978-5128-4D29-9E07-9C5780687258';
DELETE FROM friend_invitations WHERE created_by = '6875B978-5128-4D29-9E07-9C5780687258';
DELETE FROM leaderboard_rankings WHERE user_id = '6875B978-5128-4D29-9E07-9C5780687258';
DELETE FROM users WHERE id = '6875B978-5128-4D29-9E07-9C5780687258';

-- Verify cleanup
SELECT 'User data cleanup completed!' as status;
SELECT COUNT(*) as remaining_users
FROM users;
SELECT COUNT(*) as remaining_transactions
FROM transactions;
SELECT COUNT(*) as remaining_portfolio_items
FROM portfolio; 