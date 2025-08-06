-- Migration: Create daily reset function for transaction limits
-- This function resets all daily transaction limits at midnight
-- Can be triggered by Supabase cron jobs or external schedulers

-- =====================================================
-- DAILY RESET FUNCTION
-- =====================================================

-- Function to reset all daily transaction limits for all users
CREATE OR REPLACE FUNCTION reset_all_daily_transaction_limits()
RETURNS JSON AS $$
DECLARE
    reset_count INTEGER := 0;
    error_count INTEGER := 0;
    user_record RECORD;
    result JSON;
BEGIN
    -- Log the start of the reset process
    RAISE NOTICE 'Starting daily reset of transaction limits at %', NOW();
    
    -- Reset all daily transaction limits for all active users
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM daily_transaction_limits 
        WHERE transaction_date = CURRENT_DATE - INTERVAL '1 day'
    LOOP
        BEGIN
            -- Reset the daily limit for this user
            UPDATE daily_transaction_limits
            SET 
                transaction_count = 0,
                last_transaction_at = NULL,
                updated_at = NOW()
            WHERE user_id = user_record.user_id 
            AND transaction_date = CURRENT_DATE - INTERVAL '1 day';
            
            reset_count := reset_count + 1;
            
            -- Log successful reset for this user
            RAISE NOTICE 'Reset daily limits for user: %', user_record.user_id;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE WARNING 'Failed to reset daily limits for user %: %', user_record.user_id, SQLERRM;
        END;
    END LOOP;
    
    -- Also reset any limits from today that might have been created early
    -- This ensures a clean slate for the new day
    UPDATE daily_transaction_limits
    SET 
        transaction_count = 0,
        last_transaction_at = NULL,
        updated_at = NOW()
    WHERE transaction_date = CURRENT_DATE
    AND transaction_count > 0;
    
    -- Create result JSON
    result := json_build_object(
        'success', true,
        'timestamp', NOW(),
        'reset_count', reset_count,
        'error_count', error_count,
        'message', 'Daily transaction limits reset completed'
    );
    
    -- Log completion
    RAISE NOTICE 'Daily reset completed: % users reset, % errors', reset_count, error_count;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ALTERNATIVE: RESET FUNCTION FOR SPECIFIC DATE
-- =====================================================

-- Function to reset daily transaction limits for a specific date
CREATE OR REPLACE FUNCTION reset_daily_transaction_limits_for_date(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
    reset_count INTEGER := 0;
    error_count INTEGER := 0;
    user_record RECORD;
    result JSON;
BEGIN
    -- Log the start of the reset process
    RAISE NOTICE 'Starting reset of transaction limits for date: %', target_date;
    
    -- Reset all daily transaction limits for the specified date
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM daily_transaction_limits 
        WHERE transaction_date = target_date
    LOOP
        BEGIN
            -- Reset the daily limit for this user
            UPDATE daily_transaction_limits
            SET 
                transaction_count = 0,
                last_transaction_at = NULL,
                updated_at = NOW()
            WHERE user_id = user_record.user_id 
            AND transaction_date = target_date;
            
            reset_count := reset_count + 1;
            
            -- Log successful reset for this user
            RAISE NOTICE 'Reset daily limits for user: % on date: %', user_record.user_id, target_date;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE WARNING 'Failed to reset daily limits for user % on date %: %', user_record.user_id, target_date, SQLERRM;
        END;
    END LOOP;
    
    -- Create result JSON
    result := json_build_object(
        'success', true,
        'timestamp', NOW(),
        'target_date', target_date,
        'reset_count', reset_count,
        'error_count', error_count,
        'message', 'Daily transaction limits reset completed for specified date'
    );
    
    -- Log completion
    RAISE NOTICE 'Reset completed for date %: % users reset, % errors', target_date, reset_count, error_count;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CLEANUP FUNCTION FOR OLD RECORDS
-- =====================================================

-- Function to clean up old daily transaction limit records (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_daily_transaction_limits()
RETURNS JSON AS $$
DECLARE
    deleted_count INTEGER := 0;
    result JSON;
BEGIN
    -- Delete records older than 30 days
    DELETE FROM daily_transaction_limits 
    WHERE transaction_date < CURRENT_DATE - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Create result JSON
    result := json_build_object(
        'success', true,
        'timestamp', NOW(),
        'deleted_count', deleted_count,
        'message', 'Old daily transaction limit records cleaned up'
    );
    
    -- Log completion
    RAISE NOTICE 'Cleanup completed: % old records deleted', deleted_count;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION FUNCTIONS
-- =====================================================

-- Function to check daily transaction limit status for all users
CREATE OR REPLACE FUNCTION get_daily_transaction_limits_status()
RETURNS TABLE(
    user_id UUID,
    username VARCHAR,
    transaction_date DATE,
    transaction_count INTEGER,
    daily_limit INTEGER,
    remaining_transactions INTEGER,
    last_transaction_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dtl.user_id,
        u.username,
        dtl.transaction_date,
        dtl.transaction_count,
        dtl.daily_limit,
        GREATEST(0, dtl.daily_limit - dtl.transaction_count) as remaining_transactions,
        dtl.last_transaction_at
    FROM daily_transaction_limits dtl
    LEFT JOIN users u ON dtl.user_id = u.id
    WHERE dtl.transaction_date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY dtl.transaction_date DESC, dtl.transaction_count DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- To reset all daily limits (run this at midnight):
-- SELECT reset_all_daily_transaction_limits();

-- To reset limits for a specific date:
-- SELECT reset_daily_transaction_limits_for_date('2024-01-15');

-- To clean up old records (run this weekly):
-- SELECT cleanup_old_daily_transaction_limits();

-- To check current status:
-- SELECT * FROM get_daily_transaction_limits_status();

-- =====================================================
-- SUPABASE CRON JOB SETUP (if using Supabase cron)
-- =====================================================

-- Note: If you're using Supabase cron jobs, you can set up a cron job like this:
-- 
-- 1. Go to your Supabase dashboard
-- 2. Navigate to Database > Functions
-- 3. Create a new cron job with the following schedule:
--    - Schedule: 0 0 * * * (runs at midnight every day)
--    - Function: reset_all_daily_transaction_limits
--    - HTTP Method: POST
--
-- Or you can use the SQL command:
-- SELECT cron.schedule('daily-reset', '0 0 * * *', 'SELECT reset_all_daily_transaction_limits();');

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Daily reset functions created successfully!' as status;
SELECT 'Functions available:' as details;
SELECT '- reset_all_daily_transaction_limits()' as function_name;
SELECT '- reset_daily_transaction_limits_for_date(date)' as function_name;
SELECT '- cleanup_old_daily_transaction_limits()' as function_name;
SELECT '- get_daily_transaction_limits_status()' as function_name; 