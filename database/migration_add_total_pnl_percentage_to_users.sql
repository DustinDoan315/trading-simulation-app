-- Migration to add total_pnl_percentage column to users table
-- Run this in your Supabase SQL Editor

-- Add total_pnl_percentage column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_pnl_percentage DECIMAL(10,4) DEFAULT 0.00;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'total_pnl_percentage'; 