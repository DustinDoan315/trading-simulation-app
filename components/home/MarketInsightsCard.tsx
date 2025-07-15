import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface MarketInsightsCardProps {
  title: string;
  insight: string;
  trend: "bullish" | "bearish" | "neutral";
  confidence: number;
  onPress: () => void;
}

export const MarketInsightsCard: React.FC<MarketInsightsCardProps> = ({
  title,
  insight,
  trend,
  confidence,
  onPress,
}) => {
  const getTrendColors = (
    trendType: string
  ): readonly [string, string, string, string] => {
    switch (trendType) {
      case "bullish":
        return ["#00FF88", "#00CC6A", "#00994C", "#00662E"] as const;
      case "bearish":
        return ["#FF4757", "#FF3742", "#FF2E3A", "#FF1F2A"] as const;
      case "neutral":
        return ["#A4B0BE", "#747D8C", "#57606F", "#2F3542"] as const;
      default:
        return ["#A4B0BE", "#747D8C", "#57606F", "#2F3542"] as const;
    }
  };

  const getTrendIcon = (trendType: string) => {
    switch (trendType) {
      case "bullish":
        return "trending-up";
      case "bearish":
        return "trending-down";
      case "neutral":
        return "remove";
      default:
        return "remove";
    }
  };

  const getTrendText = (trendType: string) => {
    switch (trendType) {
      case "bullish":
        return "Bullish";
      case "bearish":
        return "Bearish";
      case "neutral":
        return "Neutral";
      default:
        return "Neutral";
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <LinearGradient
        colors={getTrendColors(trend)}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.trendBadge}>
              <Ionicons
                name={getTrendIcon(trend) as any}
                size={14}
                color="white"
              />
              <Text style={styles.trendText}>{getTrendText(trend)}</Text>
            </View>
          </View>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <Text style={styles.confidenceValue}>{confidence}%</Text>
            <View style={styles.confidenceBar}>
              <View
                style={[styles.confidenceFill, { width: `${confidence}%` }]}
              />
            </View>
          </View>
        </View>

        <View style={styles.insightContainer}>
          <Text style={styles.insightText}>{insight}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.learnMoreText}>Learn More</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    height: 140,
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
  },
  confidenceContainer: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  confidenceLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 2,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  confidenceBar: {
    width: 60,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 2,
  },
  insightContainer: {
    flex: 1,
    justifyContent: "center",
  },
  insightText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 18,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  learnMoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
});
