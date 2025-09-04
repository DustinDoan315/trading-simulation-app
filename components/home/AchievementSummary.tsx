import colors from '@/styles/colors';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAchievements } from '@/hooks/useAchievements';
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';


const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isSmallScreen = width < 375;

export const AchievementSummary: React.FC = () => {
  const {
    completedAchievements,
    incompleteAchievements,
    unreadNotificationsCount,
  } = useAchievements();

  const totalAchievements = completedAchievements.length + incompleteAchievements.length;
  const completionPercentage = totalAchievements > 0 
    ? Math.round((completedAchievements.length / totalAchievements) * 100) 
    : 0;

  const handlePress = () => {
    router.push('/achievements' as any);
  };

  if (totalAchievements === 0) {
    return null; 
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress} 
      activeOpacity={0.8}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
      <LinearGradient
        colors={['#1A1D2F', '#2A2D3F']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}>
        
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="ribbon" size={isTablet ? 28 : 24} color="#6262D9" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{unreadNotificationsCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.title}>Achievements</Text>
            <Text style={styles.subtitle}>
              {completedAchievements.length} of {totalAchievements} completed
            </Text>
          </View>
          <View style={styles.arrowButton}>
            <Ionicons name="arrow-forward" size={isTablet ? 24 : 20} color="#6262D9" />
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${completionPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{completionPercentage}%</Text>
        </View>

        <View style={styles.recentAchievements}>
          <Text style={styles.recentTitle}>Recent Achievements</Text>
          {completedAchievements.slice(0, 2).map((achievement, index) => (
            <View key={index} style={styles.recentItem}>
              <View style={styles.recentIconContainer}>
                <Ionicons 
                  name={achievement.achievement?.icon as any || "ribbon"} 
                  size={isTablet ? 16 : 14} 
                  color="#4BB543" 
                />
              </View>
              <Text style={styles.recentItemText} numberOfLines={1}>
                {achievement.achievement?.title || 'Achievement'}
              </Text>
            </View>
          ))}
          {completedAchievements.length === 0 && (
            <Text style={styles.noRecentText}>No achievements completed yet</Text>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - (isTablet ? 64 : 40),
    borderRadius: isTablet ? 20 : 16,
    overflow: 'hidden',
    marginBottom: isTablet ? 12 : 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  } as ViewStyle,
  gradient: {
    padding: isTablet ? 10 : 8,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isTablet ? 16 : 12,
  } as ViewStyle,
  iconContainer: {
    position: 'relative',
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isTablet ? 16 : 12,
  } as ViewStyle,
  notificationBadge: {
    position: 'absolute',
    top: isTablet ? -6 : -4,
    right: isTablet ? -6 : -4,
    backgroundColor: '#FF4757',
    borderRadius: isTablet ? 12 : 10,
    minWidth: isTablet ? 24 : 20,
    height: isTablet ? 24 : 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 6 : 4,
  } as ViewStyle,
  notificationText: {
    color: 'white',
    fontSize: isTablet ? 12 : 10,
    fontWeight: 'bold',
  } as TextStyle,
  statsContainer: {
    flex: 1,
  } as ViewStyle,
  title: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: colors.text as any,
    marginBottom: isTablet ? 4 : 2,
  } as TextStyle,
  subtitle: {
    fontSize: isTablet ? 16 : 14,
    color: '#9DA3B4',
  } as TextStyle,
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isTablet ? 16 : 12,
  } as ViewStyle,
  progressBar: {
    flex: 1,
    height: isTablet ? 8 : 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: isTablet ? 4 : 3,
    marginRight: isTablet ? 12 : 8,
    overflow: 'hidden',
  } as ViewStyle,
  progressFill: {
    height: '100%',
    backgroundColor: '#6262D9',
    borderRadius: isTablet ? 4 : 3,
  } as ViewStyle,
  progressText: {
    fontSize: isTablet ? 14 : 12,
    color: '#6262D9',
    fontWeight: '600',
    minWidth: isTablet ? 40 : 30,
    textAlign: 'right',
  } as TextStyle,
  recentAchievements: {
    marginTop: isTablet ? 12 : 8,
  } as ViewStyle,
  recentTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: colors.text as any,
    marginBottom: isTablet ? 12 : 8,
  } as TextStyle,
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isTablet ? 8 : 6,
  } as ViewStyle,
  recentIconContainer: {
    width: isTablet ? 24 : 20,
    height: isTablet ? 24 : 20,
    borderRadius: isTablet ? 12 : 10,
    backgroundColor: 'rgba(75, 181, 67, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isTablet ? 12 : 8,
  } as ViewStyle,
  recentItemText: {
    fontSize: isTablet ? 14 : 12,
    color: '#9DA3B4',
    flex: 1,
  } as TextStyle,
  noRecentText: {
    fontSize: isTablet ? 14 : 12,
    color: '#9DA3B4',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: isTablet ? 12 : 8,
  } as TextStyle,
  arrowButton: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: isTablet ? 16 : 12,
  } as ViewStyle,
});

export default AchievementSummary;
