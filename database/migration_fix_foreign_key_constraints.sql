-- =====================================================
-- MIGRATION: Fix Foreign Key Constraint Issues
-- =====================================================
-- This migration fixes foreign key constraint violations
-- by ensuring users exist before creating related records
-- =====================================================

-- 1. Create a function to safely create users if they don't exist
CREATE OR REPLACE FUNCTION ensure_user_exists(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE id = user_uuid) INTO user_exists;
    
    -- If user doesn't exist, create a default user
    IF NOT user_exists THEN
        INSERT INTO users (
            id,
            username,
            display_name,
            avatar_emoji,
            usdt_balance,
            total_portfolio_value,
            initial_balance,
            total_pnl,
            total_pnl_percentage,
            total_trades,
            total_buy_volume,
            total_sell_volume,
            win_rate,
            is_active,
            join_date,
            last_active,
            created_at,
            updated_at
        ) VALUES (
            user_uuid,
            'user_' || substring(user_uuid::text from 1 for 8),
            'Default User',
            '🚀',
            100000.00,
            100000.00,
            100000.00,
            0.00,
            0.00,
            0,
            0.00,
            0.00,
            0.00,
            TRUE,
            NOW(),
            NOW(),
            NOW(),
            NOW()
        );
        
        RETURN TRUE; -- User created
    END IF;
    
    RETURN FALSE; -- User already existed
END;
$$ LANGUAGE plpgsql;

-- 2. Create a function to safely create daily transaction limits
CREATE OR REPLACE FUNCTION safe_create_daily_transaction_limit(
    p_user_id UUID,
    p_transaction_date DATE DEFAULT CURRENT_DATE,
    p_daily_limit INTEGER DEFAULT 10
)
RETURNS daily_transaction_limits AS $$
DECLARE
    result daily_transaction_limits;
    user_created BOOLEAN;
BEGIN
    -- Ensure user exists
    user_created := ensure_user_exists(p_user_id);
    
    IF user_created THEN
        RAISE NOTICE 'Created default user for ID: %', p_user_id;
    END IF;
    
    -- Try to get existing daily limit
    SELECT * INTO result
    FROM daily_transaction_limits
    WHERE user_id = p_user_id AND transaction_date = p_transaction_date;
    
    -- If no record exists, create one
    IF result IS NULL THEN
        INSERT INTO daily_transaction_limits (
            user_id,
            transaction_date,
            daily_limit,
            transaction_count,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            p_transaction_date,
            p_daily_limit,
            0,
            NOW(),
            NOW()
        )
        RETURNING * INTO result;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a function to safely create portfolio items
CREATE OR REPLACE FUNCTION safe_create_portfolio_item(
    p_user_id UUID,
    p_symbol VARCHAR(20),
    p_quantity DECIMAL(20,8),
    p_avg_cost DECIMAL(20,8),
    p_current_price DECIMAL(20,8),
    p_total_value DECIMAL(20,8),
    p_profit_loss DECIMAL(20,8),
    p_profit_loss_percent DECIMAL(10,4),
    p_image_url TEXT DEFAULT NULL
)
RETURNS portfolio AS $$
DECLARE
    result portfolio;
    user_created BOOLEAN;
BEGIN
    -- Ensure user exists
    user_created := ensure_user_exists(p_user_id);
    
    IF user_created THEN
        RAISE NOTICE 'Created default user for ID: %', p_user_id;
    END IF;
    
    -- Insert or update portfolio item
    INSERT INTO portfolio (
        user_id,
        symbol,
        quantity,
        avg_cost,
        current_price,
        total_value,
        profit_loss,
        profit_loss_percent,
        image_url,
        last_updated,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_symbol,
        p_quantity,
        p_avg_cost,
        p_current_price,
        p_total_value,
        p_profit_loss,
        p_profit_loss_percent,
        p_image_url,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, symbol)
    DO UPDATE SET
        quantity = EXCLUDED.quantity,
        avg_cost = EXCLUDED.avg_cost,
        current_price = EXCLUDED.current_price,
        total_value = EXCLUDED.total_value,
        profit_loss = EXCLUDED.profit_loss,
        profit_loss_percent = EXCLUDED.profit_loss_percent,
        image_url = EXCLUDED.image_url,
        last_updated = NOW(),
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a function to safely create transactions
CREATE OR REPLACE FUNCTION safe_create_transaction(
    p_user_id UUID,
    p_type VARCHAR(10),
    p_symbol VARCHAR(20),
    p_quantity DECIMAL(30,10),
    p_price DECIMAL(30,10),
    p_total_value DECIMAL(30,10),
    p_fee DECIMAL(30,10) DEFAULT 0,
    p_order_type VARCHAR(20) DEFAULT 'MARKET',
    p_status VARCHAR(20) DEFAULT 'COMPLETED'
)
RETURNS transactions AS $$
DECLARE
    result transactions;
    user_created BOOLEAN;
BEGIN
    -- Ensure user exists
    user_created := ensure_user_exists(p_user_id);
    
    IF user_created THEN
        RAISE NOTICE 'Created default user for ID: %', p_user_id;
    END IF;
    
    -- Insert transaction
    INSERT INTO transactions (
        user_id,
        type,
        symbol,
        quantity,
        price,
        total_value,
        fee,
        order_type,
        status,
        timestamp,
        executed_at,
        created_at
    ) VALUES (
        p_user_id,
        p_type,
        p_symbol,
        p_quantity,
        p_price,
        p_total_value,
        p_fee,
        p_order_type,
        p_status,
        NOW(),
        NOW(),
        NOW()
    )
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5. Update existing daily_transaction_limits to ensure users exist
DO $$
DECLARE
    limit_record RECORD;
    user_exists BOOLEAN;
BEGIN
    FOR limit_record IN 
        SELECT DISTINCT user_id 
        FROM daily_transaction_limits 
        WHERE user_id NOT IN (SELECT id FROM users)
    LOOP
        -- Create default user for each missing user
        PERFORM ensure_user_exists(limit_record.user_id);
        RAISE NOTICE 'Created default user for daily_transaction_limits: %', limit_record.user_id;
    END LOOP;
END $$;

-- 6. Update existing portfolio items to ensure users exist
DO $$
DECLARE
    portfolio_record RECORD;
BEGIN
    FOR portfolio_record IN 
        SELECT DISTINCT user_id 
        FROM portfolio 
        WHERE user_id NOT IN (SELECT id FROM users)
    LOOP
        -- Create default user for each missing user
        PERFORM ensure_user_exists(portfolio_record.user_id);
        RAISE NOTICE 'Created default user for portfolio: %', portfolio_record.user_id;
    END LOOP;
END $$;

-- 7. Update existing transactions to ensure users exist
DO $$
DECLARE
    transaction_record RECORD;
BEGIN
    FOR transaction_record IN 
        SELECT DISTINCT user_id 
        FROM transactions 
        WHERE user_id NOT IN (SELECT id FROM users)
    LOOP
        -- Create default user for each missing user
        PERFORM ensure_user_exists(transaction_record.user_id);
        RAISE NOTICE 'Created default user for transactions: %', transaction_record.user_id;
    END LOOP;
END $$;

-- Success message
SELECT 'Migration completed successfully! Fixed foreign key constraint issues.' as status;
SELECT 'Created helper functions for safe user creation and record insertion.' as details; 