# 🏆 Achievement System Documentation

## Overview

The Achievement System is a comprehensive gamification feature that rewards users for their trading activities and progress. It includes achievements, daily challenges, notifications, and rewards to increase user engagement and retention.

## Features

### 🎯 Achievements
- **Milestone Achievements**: First trade, profit milestones, portfolio growth
- **Badge Achievements**: Trading streaks, volume milestones, win rates
- **Special Achievements**: Perfect timing, risk management, community building
- **Legendary Achievements**: High-value accomplishments with special titles

### 📅 Daily Challenges
- Rotating daily challenges with different difficulty levels
- Real-time progress tracking
- Reward claiming system
- Automatic challenge generation

### 🔔 Notifications
- Achievement unlock notifications
- Progress updates
- Reward claim reminders
- Animated notification components

### 🎁 Rewards
- Virtual money bonuses
- Badge unlocks
- Feature unlocks
- Special titles

## Database Schema

### Tables Created

1. **achievements** - Defines all possible achievements
2. **user_achievements** - Tracks user progress and completion
3. **daily_challenges** - Daily rotating challenges
4. **user_daily_challenges** - User progress on daily challenges
5. **achievement_notifications** - Achievement notifications

### Key Fields

```sql
-- Achievements table
achievements (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE, -- Unique identifier
  title VARCHAR(100),
  description TEXT,
  icon VARCHAR(50), -- Ionicons name
  category VARCHAR(30), -- milestone, badge, daily, special
  difficulty VARCHAR(20), -- easy, medium, hard, legendary
  requirement_type VARCHAR(30), -- profit, trades, streak, volume, etc.
  requirement_value DECIMAL(30,10),
  reward_type VARCHAR(20), -- virtual_money, badge, feature_unlock, title
  reward_value VARCHAR(100),
  is_repeatable BOOLEAN,
  is_hidden BOOLEAN,
  is_seasonal BOOLEAN
)

-- User achievements table
user_achievements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  progress DECIMAL(30,10),
  max_progress DECIMAL(30,10),
  is_completed BOOLEAN,
  completed_at TIMESTAMP,
  reward_claimed BOOLEAN,
  claimed_at TIMESTAMP,
  completion_count INTEGER
)
```

## Setup Instructions

### 1. Database Migration

Run the migration script in your Supabase SQL Editor:

```bash
# View the migration content
node scripts/setup-achievements.js

# Or copy the content from database/migration_create_achievement_system.sql
```

### 2. Verify Tables

Check that all tables were created successfully in your Supabase dashboard.

### 3. Test the System

The achievement system is automatically integrated into your app. Test by:

1. Making a trade
2. Checking the Achievements tab
3. Verifying achievement progress updates

## API Reference

### AchievementService

```typescript
// Get all achievements
const achievements = await AchievementService.getInstance().getAllAchievements();

// Get user achievements
const userAchievements = await AchievementService.getInstance().getUserAchievements(userId);

// Update achievement progress
const result = await AchievementService.getInstance().updateAchievementProgress(
  userId, 
  'first_trade', 
  1
);

// Claim achievement reward
const success = await AchievementService.getInstance().claimAchievementReward(
  userId, 
  achievementId
);
```

### useAchievements Hook

```typescript
const {
  // Data
  userAchievements,
  dailyChallenges,
  notifications,
  loading,
  refreshing,

  // Actions
  refresh,
  claimReward,
  markNotificationAsRead,

  // Computed values
  completedAchievements,
  incompleteAchievements,
  unreadNotificationsCount,
} = useAchievements();
```

## Components

### AchievementCard
Displays individual achievements with progress bars and completion status.

```typescript
<AchievementCard
  title="First Steps"
  description="Complete your first trade"
  icon="trending-up"
  progress={1}
  maxProgress={1}
  isCompleted={true}
  reward="First Trade Badge"
  onPress={() => {}}
/>
```

### AchievementSummary
Shows achievement progress summary on the home screen.

```typescript
<AchievementSummary />
```

### AchievementNotification
Animated notification for achievement unlocks.

```typescript
<AchievementNotification
  visible={true}
  title="Achievement Unlocked!"
  description="You completed your first trade"
  icon="trophy"
  reward="1000 USDT"
  onClose={() => {}}
  onPress={() => {}}
/>
```

## Integration Points

### Trading System
Achievements are automatically checked after each trade in `DualBalanceService.executeTrade()`.

### Home Screen
The `AchievementSummary` component shows recent achievements and progress.

### Navigation
Achievements tab added to the main navigation with trophy icon.

## Customization

### Adding New Achievements

1. **Database**: Add new achievement record to the `achievements` table
2. **Service**: Add achievement checking logic to `AchievementService.checkTradingAchievements()`
3. **UI**: Update achievement cards and notifications as needed

### Example Achievement

```sql
INSERT INTO achievements (
  code, title, description, icon, category, difficulty,
  requirement_type, requirement_value, reward_type, reward_value
) VALUES (
  'custom_achievement',
  'Custom Achievement',
  'Complete a custom task',
  'star',
  'special',
  'medium',
  'custom',
  1,
  'virtual_money',
  '500'
);
```

### Modifying Achievement Logic

Edit the `checkTradingAchievements` method in `AchievementService.ts`:

```typescript
async checkTradingAchievements(userId: string, tradeData: {
  profit?: number;
  volume?: number;
  winRate?: number;
  totalTrades?: number;
  portfolioValue?: number;
}): Promise<void> {
  // Add your custom achievement logic here
  if (tradeData.profit && tradeData.profit > 50000) {
    await this.updateAchievementProgress(userId, 'custom_achievement', tradeData.profit);
  }
}
```

## Achievement Categories

### Milestone Achievements
- `first_trade` - Complete first trade
- `first_profit` - Make first profit
- `first_10k_profit` - Earn $10K profit
- `first_100k_profit` - Earn $100K profit
- `first_million_profit` - Earn $1M profit

### Trading Streaks
- `winning_streak_3` - Win 3 trades in a row
- `winning_streak_5` - Win 5 trades in a row
- `winning_streak_10` - Win 10 trades in a row
- `winning_streak_20` - Win 20 trades in a row

### Volume Achievements
- `volume_100k` - Trade $100K volume
- `volume_1m` - Trade $1M volume
- `volume_10m` - Trade $10M volume
- `volume_100m` - Trade $100M volume

### Win Rate Achievements
- `win_rate_60` - Maintain 60% win rate
- `win_rate_70` - Maintain 70% win rate
- `win_rate_80` - Maintain 80% win rate

### Portfolio Achievements
- `portfolio_200k` - Grow portfolio to $200K
- `portfolio_500k` - Grow portfolio to $500K
- `portfolio_1m` - Grow portfolio to $1M

### Hold Time Achievements
- `hold_24h` - Hold position for 24 hours
- `hold_7d` - Hold position for 7 days
- `hold_30d` - Hold position for 30 days
- `hold_100d` - Hold position for 100 days

### Special Achievements
- `perfect_timing` - Perfect trade timing
- `risk_manager` - Risk management
- `trend_spotters` - Market predictions
- `collection_creator` - Community building
- `leaderboard_top_10` - Top 10 leaderboard
- `leaderboard_top_1` - #1 leaderboard

## Daily Challenges

### Challenge Types
- **Profit**: Make specific profit amount
- **Trades**: Complete specific number of trades
- **Streak**: Win specific number of trades in a row
- **Volume**: Trade specific volume amount
- **Win Rate**: Achieve specific win rate
- **Hold Time**: Hold positions for specific time
- **Portfolio Value**: Grow portfolio by specific percentage

### Challenge Difficulty
- **Easy**: Quick to complete, small rewards
- **Medium**: Moderate effort, medium rewards
- **Hard**: Challenging, large rewards

## Troubleshooting

### Common Issues

1. **Achievements not updating**
   - Check database connection
   - Verify user authentication
   - Check achievement service logs

2. **Notifications not showing**
   - Verify notification permissions
   - Check notification component rendering
   - Ensure achievement unlock logic is working

3. **Rewards not claiming**
   - Check user balance updates
   - Verify reward claiming logic
   - Check for duplicate claims

### Debug Mode

Enable debug logging in `AchievementService.ts`:

```typescript
logger.info('Achievement check completed for trade', {
  userId,
  symbol: order.symbol,
  type: order.type,
  totalTrades: user.total_trades,
});
```

## Performance Considerations

### Optimization Tips

1. **Batch Updates**: Group achievement updates to reduce database calls
2. **Caching**: Cache achievement data to reduce API calls
3. **Lazy Loading**: Load achievements on demand
4. **Indexing**: Ensure proper database indexes for performance

### Monitoring

Monitor achievement system performance:

```typescript
// Track achievement unlock rates
logger.info('Achievement unlocked', {
  achievementId,
  userId,
  unlockTime: new Date().toISOString(),
});

// Track reward claim rates
logger.info('Reward claimed', {
  achievementId,
  userId,
  rewardType,
  rewardValue,
});
```

## Future Enhancements

### Planned Features

1. **Seasonal Achievements**: Time-limited achievements
2. **Achievement Leaderboards**: Compare achievement progress
3. **Achievement Sharing**: Share achievements on social media
4. **Achievement Trading**: Trade achievements with other users
5. **Achievement Collections**: Group achievements into collections
6. **Achievement Badges**: Visual badges for completed achievements

### Customization Options

1. **Achievement Themes**: Different visual themes
2. **Custom Icons**: User-defined achievement icons
3. **Achievement Sound Effects**: Custom unlock sounds
4. **Achievement Animations**: Custom unlock animations

## Support

For issues or questions about the achievement system:

1. Check the troubleshooting section
2. Review the database schema
3. Test with the setup script
4. Check the service logs
5. Verify component integration

## License

This achievement system is part of the trading simulation app and follows the same license terms.
