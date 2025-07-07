import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DiscoveredCollection } from "@/hooks/useCollectionDiscovery";
import { formatCurrency } from "@/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface DiscoverCollectionItemProps {
  collection: DiscoveredCollection;
  onJoin: (collectionId: string) => Promise<boolean>;
  joining?: boolean;
}

const DiscoverCollectionItem: React.FC<DiscoverCollectionItemProps> = ({
  collection,
  onJoin,
  joining = false,
}) => {
  const handleJoin = async () => {
    Alert.alert(
      "Join Collection",
      `Are you sure you want to join "${
        collection.name
      }"?\n\nStarting Balance: ${formatCurrency(
        parseFloat(collection.startingBalance)
      )}\nDuration: ${collection.durationDays} days`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Join",
          onPress: async () => {
            const success = await onJoin(collection.id);
            if (success) {
              Alert.alert(
                "Success",
                "You have successfully joined the collection!"
              );
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "#10B981";
      case "COMPLETED":
        return "#6B7280";
      case "CANCELLED":
        return "#EF4444";
      default:
        return "#9DA3B4";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Active";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1A1D2F", "#1E2335"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.name}>{collection.name}</Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(collection.status) },
                ]}
              />
              <Text style={styles.statusText}>
                {getStatusText(collection.status)}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.memberCount}>
              <Ionicons name="people" size={16} color="#9DA3B4" />
              <Text style={styles.memberCountText}>
                {collection.memberCount}/{collection.maxMembers}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {collection.description && (
          <Text style={styles.description} numberOfLines={2}>
            {collection.description}
          </Text>
        )}

        {/* Owner */}
        <View style={styles.ownerContainer}>
          <Ionicons name="person-circle-outline" size={16} color="#9DA3B4" />
          <Text style={styles.ownerText}>Created by {collection.owner}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Starting Balance</Text>
            <Text style={styles.statValue}>
              {formatCurrency(parseFloat(collection.startingBalance))}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{collection.durationDays} days</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Total Volume</Text>
            <Text style={styles.statValue}>
              {formatCurrency(parseFloat(collection.totalVolume))}
            </Text>
          </View>
        </View>

        {/* Join Button */}
        <TouchableOpacity
          style={[styles.joinButton, joining && styles.joinButtonDisabled]}
          onPress={handleJoin}
          disabled={joining}>
          <LinearGradient
            colors={joining ? ["#4A5568", "#4A5568"] : ["#6674CC", "#5A67D8"]}
            style={styles.joinButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Ionicons
              name="add-circle"
              size={20}
              color="#FFFFFF"
              style={styles.joinButtonIcon}
            />
            <Text style={styles.joinButtonText}>
              {joining ? "Joining..." : "Join Collection"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#9DA3B4",
    fontWeight: "500",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  memberCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(102, 116, 204, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  memberCountText: {
    fontSize: 12,
    color: "#6674CC",
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    color: "#9DA3B4",
    lineHeight: 20,
    marginBottom: 12,
  },
  ownerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
  },
  ownerText: {
    fontSize: 12,
    color: "#9DA3B4",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: "#9DA3B4",
    marginBottom: 4,
    textAlign: "center",
  },
  statValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
  },
  joinButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  joinButtonIcon: {
    marginRight: 8,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default DiscoverCollectionItem;
