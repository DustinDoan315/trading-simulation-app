import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


const { width } = Dimensions.get("window");
const isTablet = width > 768;
const isSmallScreen = width < 375;

interface AchievementCardProps {
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  reward?: string;
  onPress: () => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  title,
  description,
  icon,
  progress,
  maxProgress,
  isCompleted,
  reward,
  onPress,
}) => {
  const progressPercentage = Math.min((progress / maxProgress) * 100, 100);

  return (
    <TouchableOpacity
      style={[styles.container, isCompleted && styles.completedContainer]}
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <LinearGradient
        colors={isCompleted ? ["#4BB543", "#45A03D"] : ["#1A1D2F", "#2A2D3F"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={icon as any}
              size={isTablet ? 28 : 24}
              color={isCompleted ? "white" : "#6262D9"}
            />
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark" size={isTablet ? 14 : 12} color="white" />
              </View>
            )}
          </View>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {progress}/{maxProgress}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: isCompleted ? "#4BB543" : "#6262D9",
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, isCompleted && styles.completedTitle]}>
            {title}
          </Text>
          <Text
            style={[
              styles.description,
              isCompleted && styles.completedDescription,
            ]}>
            {description}
          </Text>
          {reward && (
            <View style={styles.rewardContainer}>
              <Ionicons name="gift" size={isTablet ? 16 : 14} color="#FFD700" />
              <Text style={styles.rewardText}>{reward}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text
            style={[
              styles.statusText,
              isCompleted && styles.completedStatusText,
            ]}>
            {isCompleted
              ? "Completed!"
              : `${Math.round(progressPercentage)}% Complete`}
          </Text>
          {!isCompleted && (
            <View style={styles.actionButton}>
              <Ionicons name="arrow-forward" size={isTablet ? 18 : 16} color="#6262D9" />
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - (isTablet ? 64 : 40),
    height: isTablet ? 70 : 60,
    borderRadius: isTablet ? 20 : 16,
    overflow: "hidden",
    marginBottom: isTablet ? 12 : 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  completedContainer: {
    borderWidth: 2,
    borderColor: "#4BB543",
  },
  gradient: {
    flex: 1,
    padding: isTablet ? 10 : 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: isTablet ? 16 : 12,
  },
  iconContainer: {
    position: "relative",
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  completedBadge: {
    position: "absolute",
    top: isTablet ? -3 : -2,
    right: isTablet ? -3 : -2,
    width: isTablet ? 20 : 16,
    height: isTablet ? 20 : 16,
    borderRadius: isTablet ? 10 : 8,
    backgroundColor: "#4BB543",
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    alignItems: "flex-end",
    minWidth: isTablet ? 100 : 80,
  },
  progressText: {
    fontSize: isTablet ? 14 : 12,
    color: "#9DA3B4",
    marginBottom: isTablet ? 6 : 4,
  },
  progressBar: {
    width: isTablet ? 80 : 60,
    height: isTablet ? 6 : 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: isTablet ? 3 : 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: isTablet ? 3 : 2,
  },
  content: {
    flex: 1,
    marginBottom: isTablet ? 12 : 8,
  },
  title: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: isTablet ? 6 : 4,
    lineHeight: isTablet ? 24 : 20,
  },
  completedTitle: {
    color: "#FFFFFF",
  },
  description: {
    fontSize: isTablet ? 14 : 12,
    color: "#9DA3B4",
    lineHeight: isTablet ? 20 : 16,
    marginBottom: isTablet ? 8 : 6,
  },
  completedDescription: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  rewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: isTablet ? 6 : 4,
  },
  rewardText: {
    fontSize: isTablet ? 13 : 11,
    color: "#FFD700",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: isTablet ? 12 : 8,
  },
  statusText: {
    fontSize: isTablet ? 14 : 12,
    color: "#6262D9",
    fontWeight: "600",
  },
  completedStatusText: {
    color: "#4BB543",
  },
  actionButton: {
    padding: isTablet ? 8 : 6,
  },
});
