import { logger } from '@/utils/logger';
import { supabase } from './SupabaseService';

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: 'milestone' | 'badge' | 'daily' | 'special';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  requirement_type: 'profit' | 'trades' | 'streak' | 'volume' | 'win_rate' | 'hold_time' | 'portfolio_value' | 'custom';
  requirement_value: string;
  requirement_metric?: string;
  reward_type?: 'virtual_money' | 'badge' | 'feature_unlock' | 'title';
  reward_value?: string;
  reward_description?: string;
  is_repeatable: boolean;
  is_hidden: boolean;
  is_seasonal: boolean;
  season_start?: string;
  season_end?: string;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: string;
  max_progress: string;
  is_completed: boolean;
  completed_at?: string;
  reward_claimed: boolean;
  claimed_at?: string;
  completion_count: number;
  last_progress_update: string;
  created_at: string;
  updated_at: string;
  achievement?: Achievement;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  challenge_type: 'profit' | 'trades' | 'streak' | 'volume' | 'win_rate' | 'hold_time' | 'portfolio_value';
  target_value: string;
  reward_type: 'virtual_money' | 'badge' | 'feature_unlock';
  reward_value: string;
  difficulty: 'easy' | 'medium' | 'hard';
  challenge_date: string;
  is_active: boolean;
  created_at: string;
}

export interface UserDailyChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: string;
  is_completed: boolean;
  completed_at?: string;
  reward_claimed: boolean;
  claimed_at?: string;
  created_at: string;
  updated_at: string;
  challenge?: DailyChallenge;
}

export interface AchievementNotification {
  id: string;
  user_id: string;
  achievement_id: string;
  notification_type: 'unlocked' | 'progress' | 'reward_claimed';
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  achievement?: Achievement;
}

class AchievementService {
  private static instance: AchievementService;

  public static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  // Get all achievements
  async getAllAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('difficulty', { ascending: true })
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching achievements:', error);
      return [];
    }
  }

  // Get user achievements with progress
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching user achievements:', error);
      return [];
    }
  }

  // Get daily challenges
  async getDailyChallenges(date: string = new Date().toISOString().split('T')[0]): Promise<DailyChallenge[]> {
    try {
      const { data, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('challenge_date', date)
        .eq('is_active', true)
        .order('difficulty', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching daily challenges:', error);
      return [];
    }
  }

  // Get user daily challenges
  async getUserDailyChallenges(userId: string, date: string = new Date().toISOString().split('T')[0]): Promise<UserDailyChallenge[]> {
    try {
      const { data, error } = await supabase
        .from('user_daily_challenges')
        .select(`
          *,
          challenge:daily_challenges(*)
        `)
        .eq('user_id', userId)
        .eq('challenge.challenge_date', date);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching user daily challenges:', error);
      return [];
    }
  }

  // Initialize user achievements
  async initializeUserAchievements(userId: string): Promise<void> {
    try {
      const achievements = await this.getAllAchievements();
      
      for (const achievement of achievements) {
        await supabase
          .from('user_achievements')
          .upsert({
            user_id: userId,
            achievement_id: achievement.id,
            progress: '0',
            max_progress: achievement.requirement_value,
            is_completed: false,
            reward_claimed: false,
            completion_count: 0
          }, { onConflict: 'user_id,achievement_id' });
      }
    } catch (error) {
      logger.error('Error initializing user achievements:', error);
    }
  }

  // Update achievement progress
  async updateAchievementProgress(
    userId: string,
    achievementCode: string,
    progress: number,
    forceComplete: boolean = false
  ): Promise<{ unlocked: boolean; achievement?: Achievement }> {
    try {
      // Get achievement
      const { data: achievement, error: achievementError } = await supabase
        .from('achievements')
        .select('*')
        .eq('code', achievementCode)
        .single();

      if (achievementError || !achievement) {
        throw new Error(`Achievement not found: ${achievementCode}`);
      }

      // Get user achievement
      const { data: userAchievement, error: userError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      let wasCompleted = false;
      let isNewlyCompleted = false;

      if (userAchievement) {
        // Update existing progress
        const newProgress = Math.max(parseFloat(userAchievement.progress), progress);
        const shouldComplete = forceComplete || newProgress >= parseFloat(achievement.requirement_value);
        
        wasCompleted = userAchievement.is_completed;
        isNewlyCompleted = shouldComplete && !wasCompleted;

        await supabase
          .from('user_achievements')
          .update({
            progress: newProgress.toString(),
            is_completed: shouldComplete,
            completed_at: shouldComplete ? new Date().toISOString() : userAchievement.completed_at,
            last_progress_update: new Date().toISOString()
          })
          .eq('id', userAchievement.id);
      } else {
        // Create new user achievement
        const shouldComplete = forceComplete || progress >= parseFloat(achievement.requirement_value);
        isNewlyCompleted = shouldComplete;

        await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
            progress: progress.toString(),
            max_progress: achievement.requirement_value,
            is_completed: shouldComplete,
            completed_at: shouldComplete ? new Date().toISOString() : null,
            reward_claimed: false,
            completion_count: 0
          });
      }

      // Create notification if newly completed
      if (isNewlyCompleted) {
        await this.createAchievementNotification(userId, achievement.id, 'unlocked', `🎉 Achievement Unlocked: ${achievement.title}!`);
      }

      return {
        unlocked: isNewlyCompleted,
        achievement: isNewlyCompleted ? achievement : undefined
      };
    } catch (error) {
      logger.error('Error updating achievement progress:', error);
      return { unlocked: false };
    }
  }

  // Claim achievement reward
  async claimAchievementReward(userId: string, achievementId: string): Promise<boolean> {
    try {
      const { data: userAchievement, error: userError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

      if (userError || !userAchievement || !userAchievement.achievement) {
        throw new Error('User achievement not found');
      }

      if (!userAchievement.is_completed || userAchievement.reward_claimed) {
        throw new Error('Achievement not completed or reward already claimed');
      }

      // Process reward
      const reward = userAchievement.achievement;
      if (reward.reward_type === 'virtual_money' && reward.reward_value) {
        // Add virtual money to user balance
        const rewardAmount = parseFloat(reward.reward_value);
        await this.addVirtualMoneyReward(userId, rewardAmount);
      }

      // Mark reward as claimed
      await supabase
        .from('user_achievements')
        .update({
          reward_claimed: true,
          claimed_at: new Date().toISOString()
        })
        .eq('id', userAchievement.id);

      // Create notification
      await this.createAchievementNotification(
        userId,
        achievementId,
        'reward_claimed',
        `🎁 Reward Claimed: ${reward.reward_description || reward.reward_value}!`
      );

      return true;
    } catch (error) {
      logger.error('Error claiming achievement reward:', error);
      return false;
    }
  }

  // Add virtual money reward
  private async addVirtualMoneyReward(userId: string, amount: number): Promise<void> {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('usdt_balance')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      const newBalance = parseFloat(user.usdt_balance) + amount;
      
      await supabase
        .from('users')
        .update({ usdt_balance: newBalance.toString() })
        .eq('id', userId);
    } catch (error) {
      logger.error('Error adding virtual money reward:', error);
      throw error;
    }
  }

  // Create achievement notification
  async createAchievementNotification(
    userId: string,
    achievementId: string,
    type: 'unlocked' | 'progress' | 'reward_claimed',
    message: string
  ): Promise<void> {
    try {
      await supabase
        .from('achievement_notifications')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          notification_type: type,
          message
        });
    } catch (error) {
      logger.error('Error creating achievement notification:', error);
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string, limit: number = 20): Promise<AchievementNotification[]> {
    try {
      const { data, error } = await supabase
        .from('achievement_notifications')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching user notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('achievement_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  }

  // Check and update trading-related achievements
  async checkTradingAchievements(userId: string, tradeData: {
    profit?: number;
    volume?: number;
    winRate?: number;
    totalTrades?: number;
    portfolioValue?: number;
  }): Promise<void> {
    try {
      // Check profit achievements
      if (tradeData.profit !== undefined) {
        await this.updateAchievementProgress(userId, 'first_profit', tradeData.profit);
        await this.updateAchievementProgress(userId, 'first_10k_profit', tradeData.profit);
        await this.updateAchievementProgress(userId, 'first_100k_profit', tradeData.profit);
        await this.updateAchievementProgress(userId, 'first_million_profit', tradeData.profit);
      }

      // Check volume achievements
      if (tradeData.volume !== undefined) {
        await this.updateAchievementProgress(userId, 'volume_100k', tradeData.volume);
        await this.updateAchievementProgress(userId, 'volume_1m', tradeData.volume);
        await this.updateAchievementProgress(userId, 'volume_10m', tradeData.volume);
        await this.updateAchievementProgress(userId, 'volume_100m', tradeData.volume);
      }

      // Check win rate achievements
      if (tradeData.winRate !== undefined) {
        await this.updateAchievementProgress(userId, 'win_rate_60', tradeData.winRate);
        await this.updateAchievementProgress(userId, 'win_rate_70', tradeData.winRate);
        await this.updateAchievementProgress(userId, 'win_rate_80', tradeData.winRate);
      }

      // Check portfolio value achievements
      if (tradeData.portfolioValue !== undefined) {
        await this.updateAchievementProgress(userId, 'portfolio_200k', tradeData.portfolioValue);
        await this.updateAchievementProgress(userId, 'portfolio_500k', tradeData.portfolioValue);
        await this.updateAchievementProgress(userId, 'portfolio_1m', tradeData.portfolioValue);
      }

      // Check trade count achievements
      if (tradeData.totalTrades !== undefined) {
        await this.updateAchievementProgress(userId, 'first_trade', tradeData.totalTrades);
      }
    } catch (error) {
      logger.error('Error checking trading achievements:', error);
    }
  }
}

export default AchievementService;
