import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

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
      onPress={onPress}>
      <LinearGradient
        colors={isCompleted ? ["#4BB543", "#45A03D"] : ["#1A1D2F", "#2A2D3F"]}
        style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={icon as any}
              size={24}
              color={isCompleted ? "white" : "#6262D9"}
            />
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark" size={12} color="white" />
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
              <Ionicons name="gift" size={14} color="#FFD700" />
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
            <Ionicons name="arrow-forward" size={16} color="#6262D9" />
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  completedContainer: {
    borderWidth: 2,
    borderColor: "#4BB543",
  },
  gradient: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  completedBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4BB543",
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  progressText: {
    fontSize: 12,
    color: "#9DA3B4",
    marginBottom: 4,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  completedTitle: {
    color: "#FFFFFF",
  },
  description: {
    fontSize: 12,
    color: "#9DA3B4",
    lineHeight: 16,
    marginBottom: 6,
  },
  completedDescription: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  rewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rewardText: {
    fontSize: 11,
    color: "#FFD700",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    color: "#6262D9",
    fontWeight: "600",
  },
  completedStatusText: {
    color: "#4BB543",
  },
});
