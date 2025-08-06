# Daily Reset Setup Guide

This guide explains how to set up automatic daily reset of transaction limits at midnight using Supabase.

## Overview

The trading simulation app now includes comprehensive daily reset functionality that:

1. **Resets all daily transaction limits** for all users at midnight
2. **Clears transaction history** when users reset their account
3. **Resets leaderboard rankings** when users reset their account
4. **Resets portfolio data** when users reset their account
5. **Automatically cleans up old records** to maintain database performance

## Setup Instructions

### Step 1: Run the Migration

First, run the migration to create the necessary database functions:

```sql
-- Run this in your Supabase SQL Editor
-- File: database/migration_create_daily_reset_function.sql
```

This creates the following functions:

- `reset_all_daily_transaction_limits()` - Resets all daily limits at midnight
- `reset_daily_transaction_limits_for_date(date)` - Resets limits for a specific date
- `cleanup_old_daily_transaction_limits()` - Cleans up old records
- `get_daily_transaction_limits_status()` - Shows current status

### Step 2: Set Up Supabase Cron Job (Recommended)

#### Option A: Using Supabase Dashboard

1. Go to your Supabase dashboard
2. Navigate to **Database** > **Functions**
3. Click **Create a new cron job**
4. Configure the job:
   - **Name**: `daily-transaction-limits-reset`
   - **Schedule**: `0 0 * * *` (runs at midnight every day)
   - **Function**: `reset_all_daily_transaction_limits`
   - **HTTP Method**: `POST`

#### Option B: Using SQL Command

Run this SQL command in your Supabase SQL Editor:

```sql
-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the daily reset job
SELECT cron.schedule(
    'daily-transaction-limits-reset',
    '0 0 * * *',
    'SELECT reset_all_daily_transaction_limits();'
);
```

### Step 3: Set Up Weekly Cleanup (Optional)

To automatically clean up old records weekly:

```sql
-- Clean up old records every Sunday at 2 AM
SELECT cron.schedule(
    'weekly-cleanup',
    '0 2 * * 0',
    'SELECT cleanup_old_daily_transaction_limits();'
);
```

## How It Works

### Daily Reset Process

1. **At midnight (00:00 UTC)**, the cron job triggers `reset_all_daily_transaction_limits()`
2. The function finds all users with daily transaction limits from the previous day
3. It resets their `transaction_count` to 0 and clears `last_transaction_at`
4. It also resets any limits from today that might have been created early
5. The function returns a JSON response with reset statistics

### Account Reset Process

When a user resets their account (via profile screen):

1. **Portfolio data** is cleared
2. **Transaction history** is cleared
3. **Favorites** are cleared
4. **Leaderboard rankings** are removed
5. **Daily transaction limits** are cleared
6. **User profile** is reset to default values
7. **AsyncStorage** is updated with reset data

## Manual Testing

You can test the functions manually:

```sql
-- Test the daily reset function
SELECT reset_all_daily_transaction_limits();

-- Test reset for a specific date
SELECT reset_daily_transaction_limits_for_date('2024-01-15');

-- Test cleanup function
SELECT cleanup_old_daily_transaction_limits();

-- Check current status
SELECT * FROM get_daily_transaction_limits_status();
```

## Monitoring

### Check Cron Job Status

```sql
-- View all scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### Check Daily Limits Status

```sql
-- View current daily limits for all users
SELECT
    dtl.user_id,
    u.username,
    dtl.transaction_date,
    dtl.transaction_count,
    dtl.daily_limit,
    (dtl.daily_limit - dtl.transaction_count) as remaining,
    dtl.last_transaction_at
FROM daily_transaction_limits dtl
LEFT JOIN users u ON dtl.user_id = u.id
WHERE dtl.transaction_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY dtl.transaction_date DESC, dtl.transaction_count DESC;
```

## Troubleshooting

### Common Issues

1. **Cron job not running**

   - Check if pg_cron extension is enabled
   - Verify the schedule syntax is correct
   - Check Supabase logs for errors

2. **Function not found**

   - Ensure the migration was run successfully
   - Check that the function exists: `SELECT * FROM pg_proc WHERE proname = 'reset_all_daily_transaction_limits';`

3. **Permission errors**
   - Ensure the function has proper permissions
   - Check RLS policies on the `daily_transaction_limits` table

### Debug Commands

```sql
-- Check if functions exist
SELECT proname, prosrc FROM pg_proc
WHERE proname LIKE '%daily%' OR proname LIKE '%reset%';

-- Check table structure
\d daily_transaction_limits

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'daily_transaction_limits';
```

## App Integration

The app automatically:

1. **Schedules daily reset** when the app starts (as backup to Supabase cron)
2. **Calls Supabase functions** for reliable server-side execution
3. **Logs all operations** for debugging and monitoring
4. **Handles errors gracefully** without breaking the app

## Security Considerations

- All functions use RLS policies to ensure data security
- Functions only operate on data they have permission to access
- Error handling prevents sensitive information leakage
- Logging is done at appropriate levels (info, warn, error)

## Performance Notes

- The reset function processes users in batches to avoid timeouts
- Old records are automatically cleaned up to maintain performance
- Indexes are in place for efficient queries
- Functions use efficient SQL operations

## Support

If you encounter issues:

1. Check the Supabase logs in the dashboard
2. Verify the migration was applied correctly
3. Test the functions manually
4. Check the app logs for any client-side errors
5. Ensure your Supabase plan supports cron jobs (Pro plan or higher)
