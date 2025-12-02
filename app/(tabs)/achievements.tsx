import colors from '@/styles/colors';
import React, { useState } from 'react';
import { AchievementCard } from '@/components/home/AchievementCard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAchievements } from '@/hooks/useAchievements';
import { useLanguage } from '@/context/LanguageContext';
import { useNotification } from '@/components/ui/Notification';
import {
  Dimensions,
  Platform,
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


const { width, height } = Dimensions.get('window');
const isTablet = width > 768;
const isSmallScreen = width < 375;

const AchievementsScreen = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'milestone' | 'badge' | 'daily' | 'special'>('all');
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  
  const {
    userAchievements,
    refreshing,
    refresh,
    claimReward,
    completedAchievements,
    incompleteAchievements,
    getAchievementsByCategory,
    dailyChallengesProgress,
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

  const renderAchievementCard = (userAchievement: any) => (
    <AchievementCard
      key={userAchievement.id}
      title={userAchievement.title}
      description={userAchievement.description}
      icon={userAchievement.icon}
      progress={userAchievement.progress}
      maxProgress={userAchievement.maxProgress}
      isCompleted={userAchievement.isCompleted}
      reward={userAchievement.reward}
      onPress={() => handleClaimReward(userAchievement.id)}
    />
  );

  const renderDailyChallengeCard = (challenge: any) => (
    <View key={challenge.id} style={[styles.challengeCard, challenge.isCompleted && styles.completedChallengeCard]}>
      <LinearGradient
        colors={challenge.isCompleted 
          ? ['#4BB543', '#45A03D', '#3A8A33'] 
          : ['#2A2D3F', '#1A1D2F', '#0F1118']}
        style={styles.challengeGradient}>
        <View style={styles.challengeHeader}>
          <View style={styles.challengeIconContainer}>
            <LinearGradient
              colors={challenge.isCompleted 
                ? ['#4BB543', '#45A03D'] 
                : ['#6262D9', '#4A4AC8']}
              style={styles.challengeIconGradient}>
              <Ionicons
                name={challenge.icon as any}
                size={isTablet ? 32 : 28}
                color="white"
              />
            </LinearGradient>
            {challenge.isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark" size={isTablet ? 16 : 14} color="white" />
              </View>
            )}
          </View>
          <View style={styles.challengeProgressContainer}>
            <Text style={styles.challengeProgressText}>
              {challenge.progress}/{challenge.maxProgress}
            </Text>
            <View style={styles.challengeProgressBar}>
              <LinearGradient
                colors={challenge.isCompleted 
                  ? ['#4BB543', '#45A03D'] 
                  : ['#6262D9', '#4A4AC8']}
                style={[
                  styles.challengeProgressFill,
                  {
                    width: `${Math.min((challenge.progress / challenge.maxProgress) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.challengeContent}>
          <Text style={[styles.challengeTitle, challenge.isCompleted && styles.completedChallengeTitle]}>
            {challenge.title}
          </Text>
          <Text style={[styles.challengeDescription, challenge.isCompleted && styles.completedChallengeDescription]}>
            {challenge.description}
          </Text>
          {challenge.reward && (
            <View style={styles.challengeRewardContainer}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.rewardIconContainer}>
                <Ionicons name="gift" size={isTablet ? 18 : 16} color="white" />
              </LinearGradient>
              <Text style={styles.challengeRewardText}>{challenge.reward}</Text>
            </View>
          )}
        </View>

        <View style={styles.challengeFooter}>
          <Text style={[styles.challengeStatusText, challenge.isCompleted && styles.completedChallengeStatusText]}>
            {challenge.isCompleted
              ? '🎉 Completed!'
              : `${Math.round((challenge.progress / challenge.maxProgress) * 100)}% Complete`}
          </Text>
          {!challenge.isCompleted && (
            <Ionicons name="arrow-forward" size={isTablet ? 20 : 18} color="#6262D9" />
          )}
        </View>
      </LinearGradient>
    </View>
  );

  const totalAchievements = completedAchievements.length + incompleteAchievements.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#1A1D2F', '#2A2D3F', '#1A1D2F']}
        style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏆 Achievements</Text>
          
          {/* Stats Row */}
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <LinearGradient
                colors={['#4BB543', '#45A03D']}
                style={styles.statGradient}>
                <Text style={styles.statNumber}>{completedAchievements.length}</Text>
              </LinearGradient>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <LinearGradient
                colors={['#6262D9', '#4A4AC8']}
                style={styles.statGradient}>
                <Text style={styles.statNumber}>{incompleteAchievements.length}</Text>
              </LinearGradient>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statItem}>
              <LinearGradient
                colors={['#FF6B6B', '#FF5252']}
                style={styles.statGradient}>
                <Text style={styles.statNumber}>
                  {totalAchievements > 0 
                    ? Math.round((completedAchievements.length / totalAchievements) * 100) 
                    : 0}%
                </Text>
              </LinearGradient>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContainer}
        style={styles.tabScrollView}>
        {[
          { key: 'all', label: 'All', icon: 'ribbon', color: '#6262D9' },
          { key: 'milestone', label: 'Milestones', icon: 'star', color: '#FFD700' },
          { key: 'badge', label: 'Badges', icon: 'medal', color: '#FF6B6B' },
          { key: 'daily', label: 'Daily', icon: 'calendar', color: '#4BB543' },
          { key: 'special', label: 'Special', icon: 'diamond', color: '#9C27B0' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
            activeOpacity={0.7}>
            <LinearGradient
              colors={activeTab === tab.key 
                ? [tab.color, tab.color + 'CC'] 
                : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.tabGradient}>
              <Ionicons
                name={tab.icon as any}
                size={isTablet ? 14 : 12}
                color={activeTab === tab.key ? 'white' : '#9DA3B4'}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        
        {/* Daily Challenges Section */}
        {activeTab === 'daily' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#4BB543', '#45A03D']}
                style={styles.sectionIconContainer}>
                <Ionicons name="calendar" size={isTablet ? 24 : 20} color="white" />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Today's Challenges</Text>
            </View>
            {dailyChallengesProgress.length > 0 ? (
              dailyChallengesProgress.map(renderDailyChallengeCard)
            ) : (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.emptyStateIconContainer}>
                  <Ionicons name="calendar-outline" size={isTablet ? 72 : 56} color="#9DA3B4" />
                </LinearGradient>
                <Text style={styles.emptyStateText}>No daily challenges available</Text>
                <Text style={styles.emptyStateSubtext}>Check back tomorrow for new challenges!</Text>
              </View>
            )}
          </View>
        )}

        {/* Achievements Section */}
        {activeTab !== 'daily' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={activeTab === 'all' ? ['#6262D9', '#4A4AC8'] :
                       activeTab === 'milestone' ? ['#FFD700', '#FFA500'] :
                       activeTab === 'badge' ? ['#FF6B6B', '#FF5252'] :
                       ['#9C27B0', '#7B1FA2']}
                style={styles.sectionIconContainer}>
                <Ionicons 
                  name={activeTab === 'all' ? 'ribbon' :
                       activeTab === 'milestone' ? 'star' :
                       activeTab === 'badge' ? 'medal' : 'diamond'} 
                  size={isTablet ? 24 : 20} 
                  color="white" 
                />
              </LinearGradient>
              <Text style={styles.sectionTitle}>
                {activeTab === 'all' ? 'All Achievements' : 
                 activeTab === 'milestone' ? 'Milestone Achievements' :
                 activeTab === 'badge' ? 'Badge Achievements' :
                 'Special Achievements'}
              </Text>
            </View>
            {getFilteredAchievements().length > 0 ? (
              getFilteredAchievements().map(renderAchievementCard)
            ) : (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.emptyStateIconContainer}>
                  <Ionicons name="ribbon-outline" size={isTablet ? 72 : 56} color="#9DA3B4" />
                </LinearGradient>
                <Text style={styles.emptyStateText}>No achievements found</Text>
                <Text style={styles.emptyStateSubtext}>Keep playing to unlock achievements!</Text>
              </View>
            )}
          </View>
        )}

        {/* Progress Summary */}
        <View style={styles.progressSummary}>
          <LinearGradient
            colors={['#2A2D3F', '#1A1D2F', '#0F1118']}
            style={styles.progressSummaryGradient}>
            <View style={styles.progressSummaryHeader}>
              <LinearGradient
                colors={['#6262D9', '#4A4AC8']}
                style={styles.progressSummaryIconContainer}>
                <Ionicons name="trophy" size={isTablet ? 24 : 20} color="white" />
              </LinearGradient>
              <Text style={styles.progressSummaryTitle}>Overall Progress</Text>
            </View>
            <View style={styles.progressSummaryBar}>
              <LinearGradient
                colors={['#6262D9', '#4A4AC8', '#3A3AB8']}
                style={[
                  styles.progressSummaryFill,
                  {
                    width: `${totalAchievements > 0 
                      ? Math.round((completedAchievements.length / totalAchievements) * 100) 
                      : 0}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressSummaryText}>
              {completedAchievements.length} of {totalAchievements} achievements completed
            </Text>
            <Text style={styles.progressSummarySubtext}>
              {totalAchievements > 0 
                ? Math.round((completedAchievements.length / totalAchievements) * 100) 
                : 0}% of your journey complete!
            </Text>
          </LinearGradient>
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
  headerGradient: {
    paddingTop: isTablet ? 16 : 8,
    paddingBottom: isTablet ? 24 : 20,
  } as ViewStyle,
  header: {
    paddingHorizontal: isTablet ? 32 : 20,
  } as ViewStyle,
  headerTitle: {
    fontSize: isTablet ? 36 : 32,
    fontWeight: 'bold',
    color: colors.text as any,
    marginBottom: isTablet ? 24 : 20,
    textAlign: isTablet ? 'center' : 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  } as TextStyle,
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: isTablet ? 40 : 0,
    gap: isTablet ? 16 : 12,
  } as ViewStyle,
  statItem: {
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  statGradient: {
    width: isTablet ? 80 : 64,
    height: isTablet ? 80 : 64,
    borderRadius: isTablet ? 40 : 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isTablet ? 12 : 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  } as ViewStyle,
  statNumber: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,
  statLabel: {
    fontSize: isTablet ? 16 : 14,
    color: '#9DA3B4',
    textAlign: 'center',
    fontWeight: '600',
  } as TextStyle,
  tabScrollView: {
    marginBottom: isTablet ? 12 : 0,
    maxHeight: 75,
    marginVertical: isTablet ? 12 : 10,
  } as ViewStyle,
  tabScrollContainer: {
    paddingHorizontal: isTablet ? 16 : 12,
    gap: isTablet ? 8 : 6,
  } as ViewStyle,
  tab: {
    borderRadius: isTablet ? 12 : 10,
    overflow: 'hidden',
    minWidth: isTablet ? 80 : 70,
  } as ViewStyle,
  activeTab: {
    ...Platform.select({
      ios: {
        shadowColor: '#6262D9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  } as ViewStyle,
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 12 : 10,
    paddingHorizontal: isTablet ? 16 : 12,
    gap: isTablet ? 6 : 4,
  } as ViewStyle,
  tabText: {
    fontSize: isTablet ? 12 : 11,
    color: '#9DA3B4',
    fontWeight: '600',
  } as TextStyle,
  activeTabText: {
    color: 'white',
    fontWeight: '700',
  } as TextStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: isTablet ? 32 : 20,
    paddingBottom: isTablet ? 40 : 32,
  } as ViewStyle,
  section: {
    marginBottom: isTablet ? 40 : 32,
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isTablet ? 24 : 20,
    gap: isTablet ? 12 : 10,
  } as ViewStyle,
  sectionIconContainer: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  } as ViewStyle,
  sectionTitle: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  } as any,
  challengeCard: {
    borderRadius: isTablet ? 24 : 20,
    overflow: 'hidden',
    marginBottom: isTablet ? 20 : 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  } as ViewStyle,
  completedChallengeCard: {
    borderWidth: 3,
    borderColor: '#4BB543',
  } as ViewStyle,
  challengeGradient: {
    padding: isTablet ? 24 : 20,
  } as ViewStyle,
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isTablet ? 20 : 16,
  } as ViewStyle,
  challengeIconContainer: {
    position: 'relative',
  } as ViewStyle,
  challengeIconGradient: {
    width: isTablet ? 56 : 48,
    height: isTablet ? 56 : 48,
    borderRadius: isTablet ? 28 : 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  } as ViewStyle,
  completedBadge: {
    position: 'absolute',
    top: isTablet ? -4 : -3,
    right: isTablet ? -4 : -3,
    width: isTablet ? 24 : 20,
    height: isTablet ? 24 : 20,
    borderRadius: isTablet ? 12 : 10,
    backgroundColor: '#4BB543',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  } as ViewStyle,
  challengeProgressContainer: {
    alignItems: 'flex-end',
    minWidth: isTablet ? 120 : 100,
  } as ViewStyle,
  challengeProgressText: {
    fontSize: isTablet ? 16 : 14,
    color: '#9DA3B4',
    marginBottom: isTablet ? 8 : 6,
    fontWeight: '600',
  } as TextStyle,
  challengeProgressBar: {
    width: isTablet ? 100 : 80,
    height: isTablet ? 8 : 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: isTablet ? 4 : 3,
    overflow: 'hidden',
  } as ViewStyle,
  challengeProgressFill: {
    height: '100%',
    borderRadius: isTablet ? 4 : 3,
  } as ViewStyle,
  challengeContent: {
    flex: 1,
    marginBottom: isTablet ? 16 : 12,
  } as ViewStyle,
  challengeTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: isTablet ? 8 : 6,
    lineHeight: isTablet ? 26 : 22,
  } as TextStyle,
  completedChallengeTitle: {
    color: '#FFFFFF',
  } as TextStyle,
  challengeDescription: {
    fontSize: isTablet ? 16 : 14,
    color: '#9DA3B4',
    lineHeight: isTablet ? 22 : 18,
    marginBottom: isTablet ? 12 : 8,
  } as TextStyle,
  completedChallengeDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  } as TextStyle,
  challengeRewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 8 : 6,
  } as ViewStyle,
  rewardIconContainer: {
    width: isTablet ? 32 : 28,
    height: isTablet ? 32 : 28,
    borderRadius: isTablet ? 16 : 14,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  challengeRewardText: {
    fontSize: isTablet ? 15 : 13,
    color: '#FFD700',
    fontWeight: '700',
  } as TextStyle,
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: isTablet ? 16 : 12,
  } as ViewStyle,
  challengeStatusText: {
    fontSize: isTablet ? 16 : 14,
    color: '#6262D9',
    fontWeight: '700',
  } as TextStyle,
  completedChallengeStatusText: {
    color: '#4BB543',
  } as TextStyle,
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 80 : 60,
    paddingHorizontal: isTablet ? 40 : 20,
  } as ViewStyle,
  emptyStateIconContainer: {
    width: isTablet ? 120 : 100,
    height: isTablet ? 120 : 100,
    borderRadius: isTablet ? 60 : 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isTablet ? 24 : 20,
  } as ViewStyle,
  emptyStateText: {
    fontSize: isTablet ? 20 : 18,
    color: '#9DA3B4',
    textAlign: 'center',
    marginBottom: isTablet ? 8 : 6,
    fontWeight: '600',
  } as TextStyle,
  emptyStateSubtext: {
    fontSize: isTablet ? 16 : 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: isTablet ? 22 : 18,
  } as TextStyle,
  progressSummary: {
    marginTop: isTablet ? 40 : 32,
  } as ViewStyle,
  progressSummaryGradient: {
    padding: isTablet ? 32 : 24,
    borderRadius: isTablet ? 24 : 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  } as ViewStyle,
  progressSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isTablet ? 20 : 16,
    gap: isTablet ? 12 : 10,
  } as ViewStyle,
  progressSummaryIconContainer: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  progressSummaryTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: colors.text as any,
    flex: 1,
  } as TextStyle,
  progressSummaryBar: {
    height: isTablet ? 12 : 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: isTablet ? 6 : 4,
    marginBottom: isTablet ? 16 : 12,
    overflow: 'hidden',
  } as ViewStyle,
  progressSummaryFill: {
    height: '100%',
    borderRadius: isTablet ? 6 : 4,
  } as ViewStyle,
  progressSummaryText: {
    fontSize: isTablet ? 16 : 14,
    color: '#9DA3B4',
    textAlign: 'center',
    lineHeight: isTablet ? 20 : 18,
    marginBottom: isTablet ? 8 : 6,
    fontWeight: '600',
  } as TextStyle,
  progressSummarySubtext: {
    fontSize: isTablet ? 14 : 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: isTablet ? 18 : 16,
  } as TextStyle,
});

export default AchievementsScreen;
