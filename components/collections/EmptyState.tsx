import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

interface EmptyStateProps {
  type: "my" | "joined";
  onAction: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction }) => {
  const getContent = () => {
    if (type === "my") {
      return {
        icon: "people-outline",
        title: "No Collections Yet",
        subtitle: "Create your first trading collection to compete with others",
        actionText: "Create Collection",
        actionIcon: "add-circle-outline",
        tips: null,
      };
    } else {
      return {
        icon: "people-circle-outline",
        title: "Not Joined Any Collections",
        subtitle: "Join existing collections to start competing",
        actionText: "Discover Collections",
        actionIcon: "search-outline",
        tips: [
          "Use the QR scanner to join with invite codes",
          "Browse public collections in Discover",
          "Ask friends for their collection invite codes",
        ],
      };
    }
  };

  const content = getContent();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1A1D2F", "#2A2D3F"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.iconContainer}>
          <Ionicons name={content.icon as any} size={64} color="#6674CC" />
        </View>

        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.subtitle}</Text>

        {content.tips && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>How to join collections:</Text>
            {content.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionContainer}>
          <Ionicons
            name={content.actionIcon as any}
            size={20}
            color="#6674CC"
          />
          <Text style={styles.actionText}>{content.actionText}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradient: {
    padding: 32,
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(102, 116, 204, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#9DA3B4",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  tipsContainer: {
    width: "100%",
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  tipText: {
    fontSize: 14,
    color: "#9DA3B4",
    marginLeft: 8,
    flex: 1,
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6674CC",
  },
});

export default EmptyState;
