-- =====================================================
-- MIGRATION: Remove DualBalance System
-- =====================================================
-- This migration removes collection balance columns from collection_members table
-- since we're removing the DualBalance system and using regular user balance only
-- =====================================================

-- Remove collection balance columns from collection_members table
-- These columns were used by DualBalance to track separate balances for collections
ALTER TABLE collection_members 
  DROP COLUMN IF EXISTS starting_balance,
  DROP COLUMN IF EXISTS current_balance;

-- Note: Collections table still has starting_balance for reference,
-- but it's no longer used for separate balance management
-- You can optionally remove it if not needed:
-- ALTER TABLE collections DROP COLUMN IF EXISTS starting_balance;

-- =====================================================
-- Migration Complete
-- =====================================================

