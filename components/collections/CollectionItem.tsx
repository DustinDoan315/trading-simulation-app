import React from "react";
import { CollectionData } from "@/hooks/useCollectionsData";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface CollectionItemProps {
  collection: CollectionData;
  onPress: (collection: CollectionData) => void;
  onLongPress?: (collection: CollectionData) => void;
}

const CollectionItem: React.FC<CollectionItemProps> = ({
  collection,
  onPress,
  onLongPress,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getStatusColor = () => {
    switch (collection.status) {
      case "ACTIVE":
        return "#10B981";
      case "COMPLETED":
        return "#6674CC";
      case "CANCELLED":
        return "#EF4444";
      default:
        return "#9DA3B4";
    }
  };

  const getStatusIcon = () => {
    switch (collection.status) {
      case "ACTIVE":
        return "play-circle";
      case "COMPLETED":
        return "checkmark-circle";
      case "CANCELLED":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const getRankColor = (rank?: number) => {
    if (!rank) return "#9DA3B4";
    if (rank === 1) return "#FFD700"; // Gold
    if (rank === 2) return "#C0C0C0"; // Silver
    if (rank === 3) return "#CD7F32"; // Bronze
    return "#6674CC";
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.container}
        onPress={() => onPress(collection)}
        onLongPress={() => onLongPress?.(collection)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}>
        <LinearGradient
          colors={["#1A1D2F", "#2A2D3F"]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.nameContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {collection.name}
                </Text>
                {collection.isOwner && (
                  <View style={styles.ownerBadge}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.ownerText}>Owner</Text>
                  </View>
                )}
              </View>

              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Ionicons
                    name={
                      collection.isPublic
                        ? "globe-outline"
                        : "lock-closed-outline"
                    }
                    size={12}
                    color="#9DA3B4"
                  />
                  <Text style={styles.metaText}>
                    {collection.members} members
                  </Text>
                </View>

                <View style={styles.statusContainer}>
                  <Ionicons
                    name={getStatusIcon()}
                    size={12}
                    color={getStatusColor()}
                  />
                  <Text
                    style={[styles.statusText, { color: getStatusColor() }]}>
                    {collection.status}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.headerRight}>
              {collection.rank && (
                <View
                  style={[
                    styles.rankBadge,
                    { backgroundColor: getRankColor(collection.rank) },
                  ]}>
                  <Text style={styles.rankText}>#{collection.rank}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatCurrency(collection.totalValue)}
              </Text>
              <Text style={styles.statLabel}>Total Value</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statValue,
                  { color: collection.avgPnl >= 0 ? "#10B981" : "#EF4444" },
                ]}>
                {formatPercentage(collection.avgPnl)}
              </Text>
              <Text style={styles.statLabel}>Avg P&L</Text>
            </View>

            {!collection.isOwner && collection.owner && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue} numberOfLines={1}>
                    {collection.owner}
                  </Text>
                  <Text style={styles.statLabel}>Owner</Text>
                </View>
              </>
            )}
          </View>

          {/* Progress bar for active collections */}
          {collection.status === "ACTIVE" && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: "75%" }]} />
              </View>
              <Text style={styles.progressText}>75% complete</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  ownerText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFD700",
    marginLeft: 4,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#9DA3B4",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: "center",
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#2A2D3F",
    marginHorizontal: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#9DA3B4",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#2A2D3F",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6674CC",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: "#9DA3B4",
    textAlign: "center",
  },
});

export default CollectionItem;
