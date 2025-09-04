-- Achievement System Database Schema
-- Run this in your Supabase SQL Editor

-- Achievements table - Defines all possible achievements
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- Unique identifier like "first_10k_profit"
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL, -- Ionicons name
    category VARCHAR(30) NOT NULL CHECK (category IN ('milestone', 'badge', 'daily', 'special')),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')),
    requirement_type VARCHAR(30) NOT NULL CHECK (requirement_type IN ('profit', 'trades', 'streak', 'volume', 'win_rate', 'hold_time', 'portfolio_value', 'custom')),
    requirement_value DECIMAL(30,10) NOT NULL,
    requirement_metric VARCHAR(50), -- Additional metric like 'days', 'trades', etc.
    reward_type VARCHAR(20) CHECK (reward_type IN ('virtual_money', 'badge', 'feature_unlock', 'title')),
    reward_value VARCHAR(100), -- Amount or feature name
    reward_description TEXT,
    is_repeatable BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE, -- Hidden achievements
    is_seasonal BOOLEAN DEFAULT FALSE, -- Seasonal/limited time achievements
    season_start DATE,
    season_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements table - Tracks user progress and completion
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    progress DECIMAL(30,10) DEFAULT 0,
    max_progress DECIMAL(30,10) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    reward_claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    completion_count INTEGER DEFAULT 0, -- For repeatable achievements
    last_progress_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Daily challenges table - Daily rotating challenges
CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    challenge_type VARCHAR(30) NOT NULL CHECK (challenge_type IN ('profit', 'trades', 'streak', 'volume', 'win_rate', 'hold_time', 'portfolio_value')),
    target_value DECIMAL(30,10) NOT NULL,
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('virtual_money', 'badge', 'feature_unlock')),
    reward_value VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    challenge_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User daily challenge progress
CREATE TABLE IF NOT EXISTS user_daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,
    progress DECIMAL(30,10) DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    reward_claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- Achievement notifications table - Track achievement unlocks
CREATE TABLE IF NOT EXISTS achievement_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('unlocked', 'progress', 'reward_claimed')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_difficulty ON achievements(difficulty);
CREATE INDEX IF NOT EXISTS idx_achievements_code ON achievements(code);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_challenges_user_id ON user_daily_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_notifications_user_id ON achievement_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_notifications_read ON achievement_notifications(user_id, is_read);

-- RLS Policies
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_notifications ENABLE ROW LEVEL SECURITY;

-- Achievements are publicly viewable
CREATE POLICY "Achievements are publicly viewable" ON achievements FOR SELECT USING (true);

-- Users can only see their own achievement progress
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievements" ON user_achievements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily challenges are publicly viewable
CREATE POLICY "Daily challenges are publicly viewable" ON daily_challenges FOR SELECT USING (true);

-- Users can only see their own daily challenge progress
CREATE POLICY "Users can view their own daily challenges" ON user_daily_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily challenges" ON user_daily_challenges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own daily challenges" ON user_daily_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON achievement_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON achievement_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notifications" ON achievement_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO achievements (code, title, description, icon, category, difficulty, requirement_type, requirement_value, requirement_metric, reward_type, reward_value, reward_description) VALUES
-- Milestone Achievements
('first_trade', 'First Steps', 'Complete your first trade', 'trending-up', 'milestone', 'easy', 'trades', 1, 'trades', 'badge', 'first_trade_badge', 'First Trade Badge'),
('first_profit', 'Profit Maker', 'Make your first profit', 'trending-up', 'milestone', 'easy', 'profit', 1, 'usd', 'virtual_money', '1000', 'Bonus $1,000 USDT'),
('first_10k_profit', 'Big Winner', 'Earn $10,000 in profit', 'trophy', 'milestone', 'medium', 'profit', 10000, 'usd', 'badge', 'big_winner_badge', 'Big Winner Badge'),
('first_100k_profit', 'Millionaire Mindset', 'Earn $100,000 in profit', 'diamond', 'milestone', 'hard', 'profit', 100000, 'usd', 'badge', 'millionaire_badge', 'Millionaire Badge'),
('first_million_profit', 'Crypto Legend', 'Earn $1,000,000 in profit', 'star', 'milestone', 'legendary', 'profit', 1000000, 'usd', 'title', 'Crypto Legend', 'Legendary Title'),

-- Trading Streak Achievements
('winning_streak_3', 'Hot Streak', 'Win 3 trades in a row', 'flame', 'badge', 'easy', 'streak', 3, 'wins', 'virtual_money', '500', 'Bonus $500 USDT'),
('winning_streak_5', 'On Fire', 'Win 5 trades in a row', 'flame', 'badge', 'medium', 'streak', 5, 'wins', 'virtual_money', '2000', 'Bonus $2,000 USDT'),
('winning_streak_10', 'Unstoppable', 'Win 10 trades in a row', 'flame', 'badge', 'hard', 'streak', 10, 'wins', 'badge', 'unstoppable_badge', 'Unstoppable Badge'),
('winning_streak_20', 'God Mode', 'Win 20 trades in a row', 'flame', 'badge', 'legendary', 'streak', 20, 'wins', 'title', 'Trading God', 'God Mode Title'),

-- Volume Achievements
('volume_100k', 'Active Trader', 'Trade $100,000 in volume', 'swap-horizontal', 'badge', 'easy', 'volume', 100000, 'usd', 'virtual_money', '1000', 'Bonus $1,000 USDT'),
('volume_1m', 'Volume King', 'Trade $1,000,000 in volume', 'swap-horizontal', 'badge', 'medium', 'volume', 1000000, 'usd', 'virtual_money', '5000', 'Bonus $5,000 USDT'),
('volume_10m', 'Whale Trader', 'Trade $10,000,000 in volume', 'swap-horizontal', 'badge', 'hard', 'volume', 10000000, 'usd', 'badge', 'whale_badge', 'Whale Badge'),
('volume_100m', 'Market Maker', 'Trade $100,000,000 in volume', 'swap-horizontal', 'badge', 'legendary', 'volume', 100000000, 'usd', 'title', 'Market Maker', 'Market Maker Title'),

-- Win Rate Achievements
('win_rate_60', 'Consistent Winner', 'Maintain 60% win rate with 10+ trades', 'checkmark-circle', 'badge', 'medium', 'win_rate', 60, 'percent', 'virtual_money', '2000', 'Bonus $2,000 USDT'),
('win_rate_70', 'Sharpshooter', 'Maintain 70% win rate with 20+ trades', 'checkmark-circle', 'badge', 'hard', 'win_rate', 70, 'percent', 'badge', 'sharpshooter_badge', 'Sharpshooter Badge'),
('win_rate_80', 'Precision Trader', 'Maintain 80% win rate with 50+ trades', 'checkmark-circle', 'badge', 'legendary', 'win_rate', 80, 'percent', 'title', 'Precision Master', 'Precision Master Title'),

-- Portfolio Value Achievements
('portfolio_200k', 'Portfolio Master', 'Grow portfolio to $200,000', 'pie-chart', 'badge', 'medium', 'portfolio_value', 200000, 'usd', 'virtual_money', '3000', 'Bonus $3,000 USDT'),
('portfolio_500k', 'Portfolio Pro', 'Grow portfolio to $500,000', 'pie-chart', 'badge', 'hard', 'portfolio_value', 500000, 'usd', 'badge', 'portfolio_pro_badge', 'Portfolio Pro Badge'),
('portfolio_1m', 'Portfolio Legend', 'Grow portfolio to $1,000,000', 'pie-chart', 'badge', 'legendary', 'portfolio_value', 1000000, 'usd', 'title', 'Portfolio Legend', 'Portfolio Legend Title'),

-- Hold Time Achievements
('hold_24h', 'Patient Trader', 'Hold a position for 24 hours', 'time', 'badge', 'easy', 'hold_time', 24, 'hours', 'virtual_money', '500', 'Bonus $500 USDT'),
('hold_7d', 'Long-term Holder', 'Hold a position for 7 days', 'time', 'badge', 'medium', 'hold_time', 168, 'hours', 'virtual_money', '2000', 'Bonus $2,000 USDT'),
('hold_30d', 'Diamond Hands', 'Hold a position for 30 days', 'time', 'badge', 'hard', 'hold_time', 720, 'hours', 'badge', 'diamond_hands_badge', 'Diamond Hands Badge'),
('hold_100d', 'Time Lord', 'Hold a position for 100 days', 'time', 'badge', 'legendary', 'hold_time', 2400, 'hours', 'title', 'Time Lord', 'Time Lord Title'),

-- Special Achievements
('perfect_timing', 'Perfect Timing', 'Buy at the lowest price and sell at the highest in a day', 'target', 'special', 'legendary', 'custom', 1, 'perfect_trade', 'title', 'Perfect Timing', 'Perfect Timing Title'),
('risk_manager', 'Risk Manager', 'Never lose more than 5% in a single trade', 'shield-checkmark', 'badge', 'hard', 'custom', 1, 'risk_management', 'badge', 'risk_manager_badge', 'Risk Manager Badge'),
('trend_spotters', 'Trend Spotter', 'Successfully predict 5 major market moves', 'analytics', 'badge', 'hard', 'custom', 5, 'predictions', 'badge', 'trend_spotter_badge', 'Trend Spotter Badge'),
('collection_creator', 'Community Builder', 'Create a trading collection with 10+ members', 'people', 'badge', 'medium', 'custom', 10, 'members', 'badge', 'community_builder_badge', 'Community Builder Badge'),
('leaderboard_top_10', 'Top Performer', 'Reach top 10 in global leaderboard', 'medal', 'badge', 'hard', 'custom', 10, 'rank', 'badge', 'top_performer_badge', 'Top Performer Badge'),
('leaderboard_top_1', 'Champion', 'Reach #1 in global leaderboard', 'trophy', 'badge', 'legendary', 'custom', 1, 'rank', 'title', 'Champion', 'Champion Title');

-- Insert some daily challenges
INSERT INTO daily_challenges (title, description, icon, challenge_type, target_value, reward_type, reward_value, difficulty, challenge_date) VALUES
('Daily Profit', 'Make $1,000 profit today', 'trending-up', 'profit', 1000, 'virtual_money', '500', 'easy', CURRENT_DATE),
('Active Trading', 'Complete 5 trades today', 'swap-horizontal', 'trades', 5, 'virtual_money', '300', 'easy', CURRENT_DATE),
('Perfect Day', 'Win 3 trades in a row today', 'flame', 'streak', 3, 'virtual_money', '1000', 'medium', CURRENT_DATE),
('Volume Master', 'Trade $50,000 volume today', 'swap-horizontal', 'volume', 50000, 'virtual_money', '800', 'medium', CURRENT_DATE),
('Portfolio Growth', 'Grow portfolio by 5% today', 'pie-chart', 'portfolio_value', 5, 'virtual_money', '1200', 'hard', CURRENT_DATE);
