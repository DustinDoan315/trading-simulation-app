import colors from '@/styles/colors';
import React, { useState } from 'react';
import { AchievementCard } from '@/components/home/AchievementCard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAchievements } from '@/hooks/useAchievements';
import { useLanguage } from '@/context/LanguageContext';
import { useNotification } from '@/components/ui/Notification';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';


const AchievementsScreen = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'milestone' | 'badge' | 'daily' | 'special'>('all');
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  
  const {
    userAchievements,
    dailyChallenges,
    userDailyChallenges,
    loading,
    refreshing,
    refresh,
    claimReward,
    completedAchievements,
    incompleteAchievements,
    getAchievementsByCategory,
    dailyChallengesProgress,
    unreadNotificationsCount,
  } = useAchievements();

  const handleClaimReward = async (achievementId: string) => {
    const success = await claimReward(achievementId);
    if (success) {
      showNotification({
        type: 'success',
        message: 'Reward claimed successfully!'
      });
    } else {
      showNotification({
        type: 'error',
        message: 'Failed to claim reward'
      });
    }
  };

  const getFilteredAchievements = () => {
    if (activeTab === 'all') {
      return userAchievements;
    }
    return getAchievementsByCategory(activeTab);
  };

  const renderAchievementCard = (userAchievement: any) => {
    const achievement = userAchievement.achievement;
    if (!achievement) return null;

    return (
      <AchievementCard
        key={userAchievement.id}
        title={achievement.title}
        description={achievement.description}
        icon={achievement.icon}
        progress={parseFloat(userAchievement.progress)}
        maxProgress={parseFloat(userAchievement.max_progress)}
        isCompleted={userAchievement.is_completed}
        reward={userAchievement.is_completed && !userAchievement.reward_claimed ? 
          achievement.reward_description || achievement.reward_value : undefined}
        onPress={() => {
          if (userAchievement.is_completed && !userAchievement.reward_claimed) {
            handleClaimReward(userAchievement.achievement_id);
          }
        }}
      />
    );
  };

  const renderDailyChallengeCard = (userDailyChallenge: any) => {
    const challenge = userDailyChallenge.challenge;
    if (!challenge) return null;

    const progress = parseFloat(userDailyChallenge.progress);
    const target = parseFloat(challenge.target_value);
    const progressPercentage = Math.min((progress / target) * 100, 100);

    return (
      <TouchableOpacity
        key={userDailyChallenge.id}
        style={[styles.challengeCard, userDailyChallenge.is_completed && styles.completedChallengeCard]}
        onPress={() => {
          if (userDailyChallenge.is_completed && !userDailyChallenge.reward_claimed) {
            // Handle claim reward
          }
        }}>
        <LinearGradient
          colors={userDailyChallenge.is_completed ? ['#4BB543', '#45A03D'] : ['#1A1D2F', '#2A2D3F']}
          style={styles.challengeGradient}>
          <View style={styles.challengeHeader}>
            <View style={styles.challengeIconContainer}>
              <Ionicons
                name={challenge.icon as any}
                size={24}
                color={userDailyChallenge.is_completed ? 'white' : '#6262D9'}
              />
              {userDailyChallenge.is_completed && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark" size={12} color="white" />
                </View>
              )}
            </View>
            <View style={styles.challengeProgressContainer}>
              <Text style={styles.challengeProgressText}>
                {progress.toFixed(0)}/{target.toFixed(0)}
              </Text>
              <View style={styles.challengeProgressBar}>
                <View
                  style={[
                    styles.challengeProgressFill,
                    {
                      width: `${progressPercentage}%`,
                      backgroundColor: userDailyChallenge.is_completed ? '#4BB543' : '#6262D9',
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.challengeContent}>
            <Text style={[styles.challengeTitle, userDailyChallenge.is_completed && styles.completedTitle]}>
              {challenge.title}
            </Text>
            <Text style={[styles.challengeDescription, userDailyChallenge.is_completed && styles.completedDescription]}>
              {challenge.description}
            </Text>
            {userDailyChallenge.is_completed && !userDailyChallenge.reward_claimed && (
              <View style={styles.rewardContainer}>
                <Ionicons name="gift" size={14} color="#FFD700" />
                <Text style={styles.rewardText}>{challenge.reward_value}</Text>
              </View>
            )}
          </View>

          <View style={styles.challengeFooter}>
            <Text style={[styles.challengeStatusText, userDailyChallenge.is_completed && styles.completedStatusText]}>
              {userDailyChallenge.is_completed
                ? 'Completed!'
                : `${Math.round(progressPercentage)}% Complete`}
            </Text>
            {!userDailyChallenge.is_completed && (
              <Ionicons name="arrow-forward" size={16} color="#6262D9" />
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedAchievements.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{incompleteAchievements.length}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{unreadNotificationsCount}</Text>
            <Text style={styles.statLabel}>New</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'all', label: 'All', icon: 'trophy' },
          { key: 'milestone', label: 'Milestones', icon: 'star' },
          { key: 'badge', label: 'Badges', icon: 'medal' },
          { key: 'daily', label: 'Daily', icon: 'calendar' },
          { key: 'special', label: 'Special', icon: 'diamond' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}>
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? '#6262D9' : '#9DA3B4'}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}>
        
        {/* Daily Challenges Section */}
        {activeTab === 'daily' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Challenges</Text>
            {dailyChallengesProgress.length > 0 ? (
              dailyChallengesProgress.map(renderDailyChallengeCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#9DA3B4" />
                <Text style={styles.emptyStateText}>No daily challenges available</Text>
              </View>
            )}
          </View>
        )}

        {/* Achievements Section */}
        {activeTab !== 'daily' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'all' ? 'All Achievements' : 
               activeTab === 'milestone' ? 'Milestone Achievements' :
               activeTab === 'badge' ? 'Badge Achievements' :
               'Special Achievements'}
            </Text>
            {getFilteredAchievements().length > 0 ? (
              getFilteredAchievements().map(renderAchievementCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={48} color="#9DA3B4" />
                <Text style={styles.emptyStateText}>No achievements found</Text>
              </View>
            )}
          </View>
        )}

        {/* Progress Summary */}
        <View style={styles.progressSummary}>
          <Text style={styles.progressTitle}>Your Progress</Text>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressNumber}>
                {Math.round((completedAchievements.length / userAchievements.length) * 100) || 0}%
              </Text>
              <Text style={styles.progressLabel}>Overall</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressNumber}>
                {completedAchievements.filter(ua => ua.achievement?.difficulty === 'legendary').length}
              </Text>
              <Text style={styles.progressLabel}>Legendary</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressNumber}>
                {userAchievements.filter(ua => ua.reward_claimed).length}
              </Text>
              <Text style={styles.progressLabel}>Rewards</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background as any,
  } as ViewStyle,
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  } as ViewStyle,
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text as any,
    marginBottom: 16,
  } as TextStyle,
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  } as ViewStyle,
  statItem: {
    alignItems: 'center',
  } as ViewStyle,
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6262D9',
  } as TextStyle,
  statLabel: {
    fontSize: 12,
    color: '#9DA3B4',
    marginTop: 4,
  } as TextStyle,
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  } as ViewStyle,
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  } as ViewStyle,
  activeTab: {
    backgroundColor: 'rgba(98, 98, 217, 0.2)',
  } as ViewStyle,
  tabText: {
    fontSize: 12,
    color: '#9DA3B4',
    marginLeft: 4,
  } as TextStyle,
  activeTabText: {
    color: '#6262D9',
    fontWeight: '600',
  } as TextStyle,
  content: {
    flex: 1,
    paddingHorizontal: 20,
  } as ViewStyle,
  section: {
    marginBottom: 24,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  } as any,
  challengeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  } as ViewStyle,
  completedChallengeCard: {
    borderWidth: 2,
    borderColor: '#4BB543',
  } as ViewStyle,
  challengeGradient: {
    padding: 16,
  } as ViewStyle,
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,
  challengeIconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  completedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4BB543',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  challengeProgressContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  } as ViewStyle,
  challengeProgressText: {
    fontSize: 12,
    color: '#9DA3B4',
    marginBottom: 4,
  } as TextStyle,
  challengeProgressBar: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  } as ViewStyle,
  challengeProgressFill: {
    height: '100%',
    borderRadius: 2,
  } as ViewStyle,
  challengeContent: {
    flex: 1,
  } as ViewStyle,
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  } as TextStyle,
  completedTitle: {
    color: '#FFFFFF',
  } as TextStyle,
  challengeDescription: {
    fontSize: 12,
    color: '#9DA3B4',
    lineHeight: 16,
    marginBottom: 6,
  } as TextStyle,
  completedDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  } as TextStyle,
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  rewardText: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
  } as TextStyle,
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  } as ViewStyle,
  challengeStatusText: {
    fontSize: 12,
    color: '#6262D9',
    fontWeight: '600',
  } as TextStyle,
  completedStatusText: {
    color: '#4BB543',
  } as TextStyle,
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  } as ViewStyle,
  emptyStateText: {
    fontSize: 16,
    color: '#9DA3B4',
    marginTop: 12,
  } as TextStyle,
  progressSummary: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  } as ViewStyle,
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  } as any,
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  } as ViewStyle,
  progressStat: {
    alignItems: 'center',
  } as ViewStyle,
  progressNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6262D9',
  } as TextStyle,
  progressLabel: {
    fontSize: 12,
    color: '#9DA3B4',
    marginTop: 4,
  } as TextStyle,
});

export default AchievementsScreen;
