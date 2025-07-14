import { supabase } from '../services/SupabaseService';
import { UserService } from '../services/UserService';

async function fixLeaderboardDuplicates() {
  try {
    console.log('🔧 Starting leaderboard duplicate cleanup...');

    // Step 1: Clean up existing duplicates
    await UserService.cleanupLeaderboardRankings();
    console.log('✅ Cleaned up existing duplicates');

    // Step 2: Get all users and recalculate their rankings
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username');

    if (error) {
      throw error;
    }

    if (!users || users.length === 0) {
      console.log('No users found');
      return;
    }

    console.log(`🔄 Recalculating rankings for ${users.length} users...`);

    // Step 3: Update rankings for each user
    for (const user of users) {
      try {
        await UserService.updateLeaderboardRankings(user.id);
        console.log(`✅ Updated rankings for user: ${user.username || user.id}`);
      } catch (error) {
        console.error(`❌ Error updating rankings for user ${user.username || user.id}:`, error);
        // Continue with other users even if one fails
      }
    }

    // Step 4: Final cleanup to ensure no duplicates remain
    await UserService.cleanupLeaderboardRankings();
    console.log('✅ Final cleanup completed');

    // Step 5: Verify the results
    const { data: rankings, error: rankingsError } = await supabase
      .from('leaderboard_rankings')
      .select('user_id, rank, total_pnl')
      .eq('period', 'ALL_TIME')
      .is('collection_id', null)
      .order('rank', { ascending: true });

    if (rankingsError) {
      throw rankingsError;
    }

    console.log(`📊 Final leaderboard has ${rankings?.length || 0} entries`);
    
    // Check for duplicates
    const userIds = rankings?.map(r => r.user_id) || [];
    const uniqueUserIds = new Set(userIds);
    
    if (userIds.length !== uniqueUserIds.size) {
      console.warn(`⚠️  Warning: Found ${userIds.length - uniqueUserIds.size} duplicate entries`);
    } else {
      console.log('✅ No duplicate entries found');
    }

    console.log('🎉 Leaderboard duplicate cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error during leaderboard cleanup:', error);
    throw error;
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  fixLeaderboardDuplicates()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { fixLeaderboardDuplicates }; 