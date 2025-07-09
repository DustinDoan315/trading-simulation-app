import colors from "@/styles/colors";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { useLeaderboardRanking } from "@/hooks/useLeaderboardRanking";
import { useNotification } from "@/components/ui/Notification";
import { useUser } from "@/context/UserContext";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const LeaderboardScreen = () => {
  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");

  const { showNotification } = useNotification();
  const { user } = useUser();

  // Initialize leaderboard data with real-time updates
  const {
    data: leaderboardData,
    refresh,
    updateFilters,
    isLoading,
    error,
    lastUpdated,
  } = useLeaderboardData({
    period: "ALL_TIME",
    limit: 50,
  });

  // Get current user's rank and leaderboard stats
  const {
    currentRank,
    stats,
    isLoading: rankLoading,
    error: rankError,
    refreshRank,
  } = useLeaderboardRanking(user?.id || "", "ALL_TIME");

  // Update filters when time period changes
  useEffect(() => {
    updateFilters({
      period: "ALL_TIME",
      limit: 50,
    });
  }, [updateFilters]);

  // Show error notification if there's an error
  useEffect(() => {
    if (error) {
      showNotification({
        type: "error",
        message: `Failed to load leaderboard: ${error}`,
      });
    }
  }, [error, showNotification]);

  // Transform real-time data for display
  const transformLeaderboardData = (data: any[], type: string) => {
    return data.map((item, index) => {
      if (type === "collections") {
        return {
          id: item.id || `collection-${index}`,
          rank: item.rank || index + 1,
          name: item.name || "Unknown Collection",
          members: item.member_count || 0,
          totalValue: parseFloat(item.total_value || "0"),
          isMyCollection: item.is_my_collection || false,
        };
      } else {
        return {
          id: item.id || `user-${index}`,
          rank: item.rank || index + 1,
          name:
            item.users?.display_name || item.users?.username || "Unknown User",
          avatar: item.users?.avatar_emoji || "👤",
          pnl: parseFloat(item.total_pnl || "0"),
          percentage: parseFloat(item.percentage_return || "0"), // Use correct column name
          portfolio: parseFloat(item.portfolio_value || "0"), // Use correct column name
          isCurrentUser: item.is_current_user || false,
        };
      }
    });
  };

  const globalRankings = transformLeaderboardData(
    leaderboardData.global,
    "global"
  );
  const friendsRankings = transformLeaderboardData(
    leaderboardData.friends,
    "friends"
  );
  const collectionRankings = transformLeaderboardData(
    leaderboardData.collections,
    "collections"
  );

  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return colors.text.secondary;
  };

  const RankedItem = ({ item, type }: any) => (
    <View
      style={[styles.rankedItem, item.isCurrentUser && styles.currentUserItem]}>
      <View style={styles.rankSection}>
        <View
          style={[
            styles.rankBadge,
            { backgroundColor: getRankColor(item.rank) },
          ]}>
          <Text
            style={[
              styles.rankText,
              { color: item.rank <= 3 ? "#000" : "#fff" },
            ]}>
            {item.rank}
          </Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.userInfo}>
          <Text style={styles.avatar}>{item.avatar}</Text>
          <View style={styles.nameContainer}>
            <Text
              style={[
                styles.name,
                item.isCurrentUser && styles.currentUserName,
              ]}>
              {item.name}
            </Text>
            {type === "collections" && (
              <Text style={styles.members}>{item.members} members</Text>
            )}
          </View>
        </View>

        <View style={styles.statsContainer}>
          {type === "collections" ? (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  ${item.totalValue.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Total Value</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    { color: item.pnl >= 0 ? "#10BA68" : "#F9335D" },
                  ]}>
                  {item.pnl >= 0 ? "+" : ""}${item.pnl.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>P&L</Text>
              </View>
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    { color: item.percentage >= 0 ? "#10BA68" : "#F9335D" },
                  ]}>
                  {item.percentage >= 0 ? "+" : ""}
                  {item.percentage}%
                </Text>
                <Text style={styles.statLabel}>Return</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );

  const getCurrentData = () => {
    if (activeTab === "global") return globalRankings;
    if (activeTab === "friends") return friendsRankings;
    return globalRankings; // fallback to global
  };

  const handleRefresh = async () => {
    await refresh();
    await refreshRank();
  };

  // Header component showing current user's rank and stats
  const LeaderboardHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.userRankSection}>
        <View style={styles.rankDisplay}>
          <View style={styles.rankBadgeContainer}>
            <Text style={styles.rankNumber}>
              {currentRank ? `#${currentRank}` : "—"}
            </Text>
            <Ionicons
              name="trophy"
              size={24}
              color="#FFD700"
              style={styles.trophyIcon}
            />
          </View>
          <Text style={styles.rankLabel}>
            {currentRank ? "Your Current Rank" : "Start trading to get ranked"}
          </Text>
        </View>
      </View>

      {stats && (
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Ionicons
              name="people"
              size={20}
              color="#6674CC"
              style={styles.statIcon}
            />
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Traders</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="star"
              size={20}
              color="#FFD700"
              style={styles.statIcon}
            />
            <Text style={styles.statNumber}>
              {stats.topPerformer ? `#${stats.topPerformer.rank}` : "—"}
            </Text>
            <Text style={styles.statLabel}>Top Performer</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="trending-up"
              size={20}
              color="#10BA68"
              style={styles.statIcon}
            />
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Active Traders</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.header}>
        <Text style={styles.title}>Leaderboards</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "global" && styles.activeTab]}
          onPress={() => setActiveTab("global")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "global" && styles.activeTabText,
            ]}>
            Global
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "friends" && styles.activeTab]}
          onPress={() => setActiveTab("friends")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "friends" && styles.activeTabText,
            ]}>
            Friends
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={getCurrentData()}
        renderItem={({ item }) => <RankedItem item={item} type={activeTab} />}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || rankLoading}
            onRefresh={handleRefresh}
            tintColor="#6674CC"
            colors={["#6674CC"]}
          />
        }
        ListHeaderComponent={<LeaderboardHeader />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {isLoading
                ? "Loading leaderboard..."
                : "No rankings available yet"}
            </Text>
          </View>
        }
      />

      {/* Last Updated Indicator */}
      {lastUpdated && (
        <View style={styles.lastUpdatedContainer}>
          <Text style={styles.lastUpdatedText}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131523",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1D2F",
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "#6674CC",
    shadowColor: "#6674CC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    color: "#9DA3B4",
    fontSize: 15,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FFFFFF",
  },

  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 15,
  },
  rankedItem: {
    flexDirection: "row",
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  currentUserItem: {
    borderColor: "#6674CC",
    borderWidth: 2,
  },
  rankSection: {
    marginRight: 16,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  infoSection: {
    flex: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    fontSize: 24,
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  currentUserName: {
    color: "#6674CC",
  },
  members: {
    fontSize: 12,
    color: "#9DA3B4",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "flex-start",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 10,
    color: "#9DA3B4",
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9DA3B4",
    textAlign: "center",
  },
  lastUpdatedContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: "center",
  },
  lastUpdatedText: {
    fontSize: 12,
    color: "#9DA3B4",
  },
  // New styles for leaderboard header
  headerContainer: {
    backgroundColor: "#1A1D2F",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  userRankSection: {
    marginBottom: 20,
  },
  rankDisplay: {
    alignItems: "center",
  },
  rankBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rankNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#6674CC",
    marginRight: 8,
  },
  trophyIcon: {
    marginLeft: 4,
  },
  rankLabel: {
    fontSize: 16,
    color: "#9DA3B4",
    textAlign: "center",
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "#252A3D",
    borderRadius: 12,
  },
  statIcon: {
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
});

export default LeaderboardScreen;
