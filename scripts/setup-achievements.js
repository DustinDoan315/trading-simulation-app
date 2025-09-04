#!/usr/bin/env node

/**
 * Achievement System Setup Script
 * 
 * This script helps you set up the achievement system by:
 * 1. Running the database migration
 * 2. Initializing default achievements
 * 3. Setting up daily challenges
 * 
 * Usage:
 * node scripts/setup-achievements.js
 */

const fs = require('fs');
const path = require('path');

console.log('🏆 Setting up Achievement System...\n');

// Read the migration file
const migrationPath = path.join(__dirname, '../database/migration_create_achievement_system.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Migration file loaded successfully');
console.log('📊 This will create the following tables:');
console.log('   - achievements');
console.log('   - user_achievements');
console.log('   - daily_challenges');
console.log('   - user_daily_challenges');
console.log('   - achievement_notifications');
console.log('');

console.log('🎯 Default achievements to be created:');
console.log('   - First Steps (First trade)');
console.log('   - Profit Maker (First profit)');
console.log('   - Big Winner ($10K profit)');
console.log('   - Millionaire Mindset ($100K profit)');
console.log('   - Crypto Legend ($1M profit)');
console.log('   - Hot Streak (3 wins in a row)');
console.log('   - On Fire (5 wins in a row)');
console.log('   - Unstoppable (10 wins in a row)');
console.log('   - God Mode (20 wins in a row)');
console.log('   - Active Trader ($100K volume)');
console.log('   - Volume King ($1M volume)');
console.log('   - Whale Trader ($10M volume)');
console.log('   - Market Maker ($100M volume)');
console.log('   - Consistent Winner (60% win rate)');
console.log('   - Sharpshooter (70% win rate)');
console.log('   - Precision Trader (80% win rate)');
console.log('   - Portfolio Master ($200K portfolio)');
console.log('   - Portfolio Pro ($500K portfolio)');
console.log('   - Portfolio Legend ($1M portfolio)');
console.log('   - Patient Trader (24h hold)');
console.log('   - Long-term Holder (7d hold)');
console.log('   - Diamond Hands (30d hold)');
console.log('   - Time Lord (100d hold)');
console.log('   - Perfect Timing (Perfect trade)');
console.log('   - Risk Manager (Risk management)');
console.log('   - Trend Spotter (Market predictions)');
console.log('   - Community Builder (Collection creator)');
console.log('   - Top Performer (Top 10 leaderboard)');
console.log('   - Champion (#1 leaderboard)');
console.log('');

console.log('📅 Daily challenges to be created:');
console.log('   - Daily Profit ($1K profit)');
console.log('   - Active Trading (5 trades)');
console.log('   - Perfect Day (3 wins in a row)');
console.log('   - Volume Master ($50K volume)');
console.log('   - Portfolio Growth (5% growth)');
console.log('');

console.log('⚠️  IMPORTANT: You need to run this migration in your Supabase SQL Editor');
console.log('');
console.log('📝 Steps to complete setup:');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the migration content below:');
console.log('4. Click "Run" to execute the migration');
console.log('5. Verify the tables were created successfully');
console.log('');

console.log('📄 Migration SQL:');
console.log('=' .repeat(80));
console.log(migrationContent);
console.log('=' .repeat(80));
console.log('');

console.log('✅ Setup instructions complete!');
console.log('');
console.log('🎉 After running the migration, your achievement system will be ready!');
console.log('');
console.log('📱 Next steps:');
console.log('1. The achievement system is now integrated into your app');
console.log('2. Users will automatically earn achievements as they trade');
console.log('3. Check the Achievements tab in your app to see progress');
console.log('4. Daily challenges will appear automatically');
console.log('5. Achievement notifications will show when users unlock achievements');
console.log('');
console.log('🔧 Customization:');
console.log('- Edit the migration file to add more achievements');
console.log('- Modify AchievementService.ts to add custom achievement logic');
console.log('- Update the UI components to match your app\'s design');
console.log('');
console.log('📚 Documentation:');
console.log('- Check the AchievementService.ts for API documentation');
console.log('- Review useAchievements.ts hook for component integration');
console.log('- See AchievementNotification.tsx for notification styling');
console.log('');

console.log('🚀 Achievement system setup complete!');
