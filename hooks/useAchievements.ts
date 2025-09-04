import AchievementService, {
  Achievement,
  AchievementNotification,
  DailyChallenge,
  UserAchievement,
  UserDailyChallenge
  } from '@/services/AchievementService';
import { logger } from '@/utils/logger';
import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';


export const useAchievements = () => {
  const { user } = useUser();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [userDailyChallenges, setUserDailyChallenges] = useState<UserDailyChallenge[]>([]);
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const achievementService = AchievementService.getInstance();

  // Load all achievements
  const loadAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await achievementService.getAllAchievements();
      setAchievements(data);
    } catch (error: any) {
      logger.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [achievementService]);

  // Load user achievements
  const loadUserAchievements = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await achievementService.getUserAchievements(user.id);
      setUserAchievements(data);
    } catch (error: any) {
      logger.error('Error loading user achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, achievementService]);

  // Load daily challenges
  const loadDailyChallenges = useCallback(async () => {
    try {
      const data = await achievementService.getDailyChallenges();
      setDailyChallenges(data);
    } catch (error: any) {
      logger.error('Error loading daily challenges:', error);
    }
  }, [achievementService]);

  // Load user daily challenges
  const loadUserDailyChallenges = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await achievementService.getUserDailyChallenges(user.id);
      setUserDailyChallenges(data);
    } catch (error: any) {
      logger.error('Error loading user daily challenges:', error);
    }
  }, [user?.id, achievementService]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await achievementService.getUserNotifications(user.id);
      setNotifications(data);
    } catch (error: any) {
      logger.error('Error loading notifications:', error);
    }
  }, [user?.id, achievementService]);

  // Refresh all data
  const refresh = useCallback(async () => {
    if (!user?.id) return;

    try {
      setRefreshing(true);
      await Promise.all([
        loadAchievements(),
        loadUserAchievements(),
        loadDailyChallenges(),
        loadUserDailyChallenges(),
        loadNotifications()
      ]);
    } catch (error: any) {
      logger.error('Error refreshing achievements:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, loadAchievements, loadUserAchievements, loadDailyChallenges, loadUserDailyChallenges, loadNotifications]);

  // Initialize user achievements
  const initializeUserAchievements = useCallback(async () => {
    if (!user?.id) return;

    try {
      await achievementService.initializeUserAchievements(user.id);
      await loadUserAchievements();
    } catch (error: any) {
      logger.error('Error initializing user achievements:', error);
    }
  }, [user?.id, achievementService, loadUserAchievements]);

  // Claim achievement reward
  const claimReward = useCallback(async (achievementId: string) => {
    if (!user?.id) return false;

    try {
      const success = await achievementService.claimAchievementReward(user.id, achievementId);
      if (success) {
        await loadUserAchievements();
        await loadNotifications();
      }
      return success;
    } catch (error: any) {
      logger.error('Error claiming reward:', error);
      return false;
    }
  }, [user?.id, achievementService, loadUserAchievements, loadNotifications]);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await achievementService.markNotificationAsRead(notificationId);
      await loadNotifications();
    } catch (error: any) {
      logger.error('Error marking notification as read:', error);
    }
  }, [achievementService, loadNotifications]);

  // Get completed achievements
  const getCompletedAchievements = useCallback(() => {
    return userAchievements.filter(ua => ua.is_completed);
  }, [userAchievements]);

  // Get incomplete achievements
  const getIncompleteAchievements = useCallback(() => {
    return userAchievements.filter(ua => !ua.is_completed);
  }, [userAchievements]);

  // Get achievements by category
  const getAchievementsByCategory = useCallback((category: string) => {
    return userAchievements.filter(ua => ua.achievement?.category === category);
  }, [userAchievements]);

  // Get daily challenges progress
  const getDailyChallengesProgress = useCallback(() => {
    return userDailyChallenges.map(udc => ({
      ...udc,
      progressPercentage: udc.challenge ? 
        Math.min((parseFloat(udc.progress) / parseFloat(udc.challenge.target_value)) * 100, 100) : 0
    }));
  }, [userDailyChallenges]);

  // Get unread notifications count
  const getUnreadNotificationsCount = useCallback(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      loadAchievements();
      loadUserAchievements();
      loadDailyChallenges();
      loadUserDailyChallenges();
      loadNotifications();
    }
  }, [user?.id, loadAchievements, loadUserAchievements, loadDailyChallenges, loadUserDailyChallenges, loadNotifications]);

  return {
    // Data
    achievements,
    userAchievements,
    dailyChallenges,
    userDailyChallenges,
    notifications,
    loading,
    refreshing,

    // Actions
    refresh,
    initializeUserAchievements,
    claimReward,
    markNotificationAsRead,

    // Computed values
    completedAchievements: getCompletedAchievements(),
    incompleteAchievements: getIncompleteAchievements(),
    getAchievementsByCategory,
    dailyChallengesProgress: getDailyChallengesProgress(),
    unreadNotificationsCount: getUnreadNotificationsCount(),
  };
};
