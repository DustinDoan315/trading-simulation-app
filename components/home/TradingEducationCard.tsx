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

interface TradingEducationCardProps {
  title: string;
  description: string;
  icon: string;
  gradientColors: [string, string];
  onPress: () => void;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  duration?: string;
}

export const TradingEducationCard: React.FC<TradingEducationCardProps> = ({
  title,
  description,
  icon,
  gradientColors,
  onPress,
  difficulty = "Beginner",
  duration = "5 min",
}) => {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "#4BB543";
      case "Intermediate":
        return "#FFA500";
      case "Advanced":
        return "#FF6B6B";
      default:
        return "#4BB543";
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={24} color="white" />
          </View>
          <View style={styles.metaInfo}>
            <View style={styles.difficultyBadge}>
              <Text
                style={[
                  styles.difficultyText,
                  { color: getDifficultyColor(difficulty) },
                ]}>
                {difficulty}
              </Text>
            </View>
            <Text style={styles.durationText}>{duration}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.startText}>Start Learning</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  gradient: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  metaInfo: {
    alignItems: "flex-end",
  },
  difficultyBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  durationText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  startText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
});
