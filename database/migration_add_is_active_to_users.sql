-- =====================================================
-- MIGRATION: Add is_active column to users table
-- =====================================================
-- This migration adds the missing is_active column to the users table
-- Run this script in your Supabase SQL Editor to fix the PGRST204 error
-- =====================================================

-- Add is_active column to users table
ALTER TABLE users 
ADD COLUMN
IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for better performance
CREATE INDEX
IF NOT EXISTS idx_users_is_active ON users
(is_active);

-- Update existing users to have is_active = true (if any exist)
UPDATE users 
SET is_active = TRUE 
WHERE is_active IS NULL;

-- Success message
SELECT 'Migration completed successfully! Added is_active column to users table.' as status; 