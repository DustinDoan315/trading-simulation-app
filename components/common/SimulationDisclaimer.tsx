import colors from "@/styles/colors";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

interface SimulationDisclaimerProps {
  variant?: "compact" | "full" | "banner";
  showIcon?: boolean;
}

export const SimulationDisclaimer: React.FC<SimulationDisclaimerProps> = ({
  variant = "compact",
  showIcon = true,
}) => {
  const getDisclaimerText = () => {
    switch (variant) {
      case "full":
        return {
          title: "⚠️ SIMULATION ONLY",
          subtitle:
            "This is a virtual trading simulator for educational purposes only.",
          details: [
            "• No real money is involved in any transactions",
            "• All trades are simulated with virtual currency",
            "• This app is for learning and practice only",
            "• Real market prices are used for educational realism",
            "• No actual cryptocurrency is bought or sold",
          ],
        };
      case "banner":
        return {
          title: "VIRTUAL TRADING SIMULATOR",
          subtitle: "Educational purposes only - No real money involved",
          details: [],
        };
      default: // compact
        return {
          title: "SIMULATION ONLY",
          subtitle: "Virtual money for educational purposes",
          details: [],
        };
    }
  };

  const disclaimer = getDisclaimerText();

  if (variant === "compact") {
    return (
      <View style={styles.compactContainer}>
        {showIcon && <Ionicons name="warning" size={16} color="#FF6B35" />}
        <Text style={styles.compactText}>
          {disclaimer.title} - {disclaimer.subtitle}
        </Text>
      </View>
    );
  }

  if (variant === "banner") {
    return (
      <LinearGradient
        colors={["#FF6B35", "#F7931E"]}
        style={styles.bannerContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}>
        <View style={styles.bannerContent}>
          {showIcon && <Ionicons name="warning" size={20} color="white" />}
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>{disclaimer.title}</Text>
            <Text style={styles.bannerSubtitle}>{disclaimer.subtitle}</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <LinearGradient
        colors={["rgba(255, 107, 53, 0.1)", "rgba(247, 147, 30, 0.05)"]}
        style={styles.fullGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.fullContent}>
          <View style={styles.fullHeader}>
            {showIcon && <Ionicons name="warning" size={24} color="#FF6B35" />}
            <Text style={styles.fullTitle}>{disclaimer.title}</Text>
          </View>
          <Text style={styles.fullSubtitle}>{disclaimer.subtitle}</Text>
          {disclaimer.details.map((detail, index) => (
            <Text key={index} style={styles.fullDetail}>
              {detail}
            </Text>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    borderRadius: 8,
    marginVertical: 4,
  },
  compactText: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "600",
    marginLeft: 4,
  },
  bannerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 20,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  fullContainer: {
    marginVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  fullGradient: {
    padding: 16,
  },
  fullContent: {
    gap: 8,
  },
  fullHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fullTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B35",
  },
  fullSubtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginLeft: 32,
  },
  fullDetail: {
    fontSize: 13,
    color: "#666",
    marginLeft: 32,
    lineHeight: 18,
  },
});

export default SimulationDisclaimer;
