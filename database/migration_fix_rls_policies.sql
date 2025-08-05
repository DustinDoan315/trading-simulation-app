-- Migration: Fix RLS policies for anonymous access
-- This script fixes the Row Level Security policies to allow the app to work without authentication
-- Run this script in your Supabase SQL Editor

-- =====================================================
-- FIX RLS POLICIES FOR ANONYMOUS ACCESS
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;

DROP POLICY IF EXISTS "Users can view their own portfolio" ON portfolio;
DROP POLICY IF EXISTS "Users can update their own portfolio" ON portfolio;
DROP POLICY IF EXISTS "Users can insert their own portfolio" ON portfolio;
DROP POLICY IF EXISTS "Users can delete their own portfolio" ON portfolio;

DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Collection members can view collection transactions" ON transactions;

DROP POLICY IF EXISTS "Public collections are viewable" ON collections;
DROP POLICY IF EXISTS "Collection members can view private collections" ON collections;
DROP POLICY IF EXISTS "Users can create collections" ON collections;
DROP POLICY IF EXISTS "Owners can update their collections" ON collections;
DROP POLICY IF EXISTS "Owners can delete their collections" ON collections;

DROP POLICY IF EXISTS "Members can view collection membership" ON collection_members;
DROP POLICY IF EXISTS "Users can join collections" ON collection_members;
DROP POLICY IF EXISTS "Users can leave collections" ON collection_members;
DROP POLICY IF EXISTS "Collection owners can manage members" ON collection_members;

DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;

DROP POLICY IF EXISTS "Leaderboard rankings are publicly viewable" ON leaderboard_rankings;
DROP POLICY IF EXISTS "System can manage leaderboard rankings" ON leaderboard_rankings;

DROP POLICY IF EXISTS "Allow all operations for daily limits" ON daily_transaction_limits;

DROP POLICY IF EXISTS "Friends table access" ON friends;
DROP POLICY IF EXISTS "Friend invitations table access" ON friend_invitations;

-- =====================================================
-- CREATE NEW PERMISSIVE POLICIES FOR ANONYMOUS ACCESS
-- =====================================================

-- Users table - Allow all operations for anonymous access
CREATE POLICY "Allow all user operations" ON users
    FOR ALL USING (true) WITH CHECK (true);

-- Portfolio table - Allow all operations for anonymous access
CREATE POLICY "Allow all portfolio operations" ON portfolio
    FOR ALL USING (true) WITH CHECK (true);

-- Transactions table - Allow all operations for anonymous access
CREATE POLICY "Allow all transaction operations" ON transactions
    FOR ALL USING (true) WITH CHECK (true);

-- Collections table - Allow all operations for anonymous access
CREATE POLICY "Allow all collection operations" ON collections
    FOR ALL USING (true) WITH CHECK (true);

-- Collection members table - Allow all operations for anonymous access
CREATE POLICY "Allow all collection member operations" ON collection_members
    FOR ALL USING (true) WITH CHECK (true);

-- Favorites table - Allow all operations for anonymous access
CREATE POLICY "Allow all favorite operations" ON favorites
    FOR ALL USING (true) WITH CHECK (true);

-- Leaderboard rankings table - Allow all operations for anonymous access
CREATE POLICY "Allow all leaderboard operations" ON leaderboard_rankings
    FOR ALL USING (true) WITH CHECK (true);

-- Daily transaction limits table - Allow all operations for anonymous access
CREATE POLICY "Allow all daily limit operations" ON daily_transaction_limits
    FOR ALL USING (true) WITH CHECK (true);

-- Friends table - Allow all operations for anonymous access
CREATE POLICY "Allow all friend operations" ON friends
    FOR ALL USING (true) WITH CHECK (true);

-- Friend invitations table - Allow all operations for anonymous access
CREATE POLICY "Allow all friend invitation operations" ON friend_invitations
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- ALTERNATIVE: DISABLE RLS FOR DEVELOPMENT
-- =====================================================
-- Uncomment the following lines if you want to disable RLS completely for development

-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE portfolio DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE collection_members DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE leaderboard_rankings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_transaction_limits DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE friends DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE friend_invitations DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that policies are in place
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Success message
SELECT 'RLS policies fixed for anonymous access!' as status;
SELECT 'All tables now allow anonymous operations for the trading simulation app.' as details; 