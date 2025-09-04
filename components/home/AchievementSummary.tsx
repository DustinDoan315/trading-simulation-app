import colors from '@/styles/colors';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAchievements } from '@/hooks/useAchievements';
import {
  Dimensions,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';


const { width } = Dimensions.get('window');

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
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <LinearGradient
        colors={['#1A1D2F', '#2A2D3F']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}>
        
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="trophy" size={24} color="#6262D9" />
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
          <Ionicons name="arrow-forward" size={20} color="#6262D9" />
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
          <Text style={styles.recentTitle}>Recent Unlocks</Text>
          {completedAchievements.slice(0, 2).map((achievement, index) => (
            <View key={achievement.id} style={styles.recentItem}>
              <Ionicons
                name={achievement.achievement?.icon as any}
                size={16}
                color="#4BB543"
              />
              <Text style={styles.recentText} numberOfLines={1}>
                {achievement.achievement?.title}
              </Text>
            </View>
          ))}
          {completedAchievements.length === 0 && (
            <Text style={styles.noAchievementsText}>
              Complete your first trade to earn achievements!
            </Text>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  } as ViewStyle,
  gradient: {
    padding: 16,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,
  iconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  } as ViewStyle,
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  } as ViewStyle,
  notificationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  } as TextStyle,
  statsContainer: {
    flex: 1,
  } as ViewStyle,
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text as any,
    marginBottom: 2,
  } as TextStyle,
  subtitle: {
    fontSize: 14,
    color: '#9DA3B4',
  } as TextStyle,
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  } as ViewStyle,
  progressFill: {
    height: '100%',
    backgroundColor: '#6262D9',
    borderRadius: 3,
  } as ViewStyle,
  progressText: {
    fontSize: 12,
    color: '#6262D9',
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
  } as TextStyle,
  recentAchievements: {
    marginTop: 8,
  } as ViewStyle,
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text as any,
    marginBottom: 8,
  } as TextStyle,
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  } as ViewStyle,
  recentText: {
    fontSize: 12,
    color: '#9DA3B4',
    marginLeft: 8,
    flex: 1,
  } as TextStyle,
  noAchievementsText: {
    fontSize: 12,
    color: '#9DA3B4',
    fontStyle: 'italic',
  } as TextStyle,
});

export default AchievementSummary;
