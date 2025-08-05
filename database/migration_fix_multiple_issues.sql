-- =====================================================
-- MIGRATION: Fix Multiple Database Issues
-- =====================================================
-- This migration fixes several issues:
-- 1. Missing is_active column in users table
-- 2. Infinite recursion in collection_members policy
-- 3. Missing WHERE clause issues
-- 4. PGRST116 errors from empty results
-- =====================================================

-- 1. Add is_active column to users table
ALTER TABLE users 
ADD COLUMN
IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Create index for better performance
CREATE INDEX
IF NOT EXISTS idx_users_is_active ON users
(is_active);

-- 3. Update existing users to have is_active = true (if any exist)
UPDATE users 
SET is_active = TRUE 
WHERE is_active IS NULL;

-- 4. Fix infinite recursion in collection_members policy
-- Drop the problematic policy
DROP POLICY
IF EXISTS "Members can view collection membership" ON collection_members;

-- Recreate the policy without infinite recursion
CREATE POLICY "Members can view collection membership" ON collection_members 
    FOR
SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 5. Add a policy for collection owners to view all members
CREATE POLICY "Collection owners can view all members" ON collection_members 
    FOR
SELECT USING (
        EXISTS (
            SELECT 1
    FROM collections
    WHERE id = collection_members.collection_id
      AND owner_id = auth.uid()
        ) OR auth.role() = 'service_role'
    );

-- 6. Ensure all users have proper default values
UPDATE users 
SET 
    total_pnl = COALESCE(total_pnl, 0),
    total_pnl_percentage = COALESCE(total_pnl_percentage, 0),
    total_portfolio_value = COALESCE(total_portfolio_value, usdt_balance),
    total_trades = COALESCE(total_trades, 0),
    total_buy_volume = COALESCE(total_buy_volume, 0),
    total_sell_volume = COALESCE(total_sell_volume, 0),
    win_rate = COALESCE(win_rate, 0),
    last_active = COALESCE(last_active, NOW()),
    is_active = COALESCE(is_active, TRUE)
WHERE id IS NOT NULL;

-- 7. Create a function to safely reset global ranks
CREATE OR REPLACE FUNCTION safe_reset_global_ranks
()
RETURNS VOID AS $$
BEGIN
  UPDATE users 
    SET global_rank = NULL 
    WHERE id IS NOT NULL
    AND id != '00000000-0000-0000-0000-000000000000';
END;
$$ LANGUAGE plpgsql;

-- 8. Create a function to safely get user by ID with fallback
CREATE OR REPLACE FUNCTION safe_get_user
(user_uuid UUID)
RETURNS TABLE
(
    id UUID,
    username VARCHAR
(50),
    display_name VARCHAR
(100),
    avatar_emoji VARCHAR
(10),
    usdt_balance DECIMAL
(30,10),
    total_portfolio_value DECIMAL
(30,10),
    total_pnl DECIMAL
(30,10),
    total_pnl_percentage DECIMAL
(10,4),
    total_trades INTEGER,
    win_rate DECIMAL
(5,2),
    global_rank INTEGER,
    is_active BOOLEAN,
    last_active TIMESTAMP
WITH TIME ZONE,
    created_at TIMESTAMP
WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.username,
    u.display_name,
    u.avatar_emoji,
    COALESCE(u.usdt_balance, 100000.00),
    COALESCE(u.total_portfolio_value, u.usdt_balance),
    COALESCE(u.total_pnl, 0),
    COALESCE(u.total_pnl_percentage, 0),
    COALESCE(u.total_trades, 0),
    COALESCE(u.win_rate, 0),
    u.global_rank,
    COALESCE(u.is_active, TRUE),
    COALESCE(u.last_active, NOW()),
    u.created_at
  FROM users u
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 9. Create a function to safely get transaction count
CREATE OR REPLACE FUNCTION safe_get_transaction_count
(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO count_result
  FROM transactions
  WHERE user_id = user_uuid;

  RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Migration completed successfully! Fixed multiple database issues.' as status;
SELECT 'Issues fixed: is_active column, infinite recursion policy, safe functions' as details; 