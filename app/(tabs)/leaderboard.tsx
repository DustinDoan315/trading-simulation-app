import colors from "@/styles/colors";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { useLeaderboardRanking } from "@/hooks/useLeaderboardRanking";
import { useNotification } from "@/components/ui/Notification";
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
  const [activeTab, setActiveTab] = useState<
    "global" | "friends" | "collections"
  >("global");
  const [timePeriod, setTimePeriod] = useState<
    "weekly" | "monthly" | "allTime"
  >("weekly");

  const { showNotification } = useNotification();

  // Convert time period to API format
  const getApiTimePeriod = (period: string) => {
    switch (period) {
      case "weekly":
        return "WEEKLY";
      case "monthly":
        return "MONTHLY";
      case "allTime":
        return "ALL_TIME";
      default:
        return "WEEKLY";
    }
  };

  // Initialize leaderboard data with real-time updates
  const {
    data: leaderboardData,
    refresh,
    updateFilters,
    isLoading,
    error,
    lastUpdated,
  } = useLeaderboardData({
    period: getApiTimePeriod(timePeriod),
    limit: 50,
  });

  // Get current user's rank and leaderboard stats
  const {
    currentRank,
    stats,
    isLoading: rankLoading,
    error: rankError,
    refreshRank,
    initializeRankings,
    recalculateAllRanks,
  } = useLeaderboardRanking(
    "BF83BF2B-E330-4A48-B07F-2354E7D364B0",
    getApiTimePeriod(timePeriod)
  ); // TODO: Get actual user ID

  // Update filters when time period changes
  useEffect(() => {
    updateFilters({
      period: getApiTimePeriod(timePeriod),
      limit: 50,
    });
  }, [timePeriod, updateFilters]);

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
          avgPnl: parseFloat(item.avg_pnl_percentage || "0"),
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
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: "#10BA68" }]}>
                  +{item.avgPnl}%
                </Text>
                <Text style={styles.statLabel}>Avg P&L</Text>
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
    return collectionRankings;
  };

  const handleRefresh = async () => {
    await refresh();
    await refreshRank();
  };

  // Header component showing current user's rank and stats
  const LeaderboardHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.userRankSection}>
        <Text style={styles.headerTitle}>Your Ranking</Text>
        <View style={styles.rankDisplay}>
          <Text style={styles.rankNumber}>
            {currentRank ? `#${currentRank}` : "Unranked"}
          </Text>
          <Text style={styles.rankLabel}>
            {currentRank ? "Current Rank" : "Start trading to get ranked"}
          </Text>
        </View>
      </View>

      {stats && (
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Traders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {stats.topPerformer ? `#${stats.topPerformer.rank}` : "N/A"}
            </Text>
            <Text style={styles.statLabel}>Top Performer</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              ${stats.averagePnL.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Avg P&L</Text>
          </View>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={initializeRankings}
          disabled={rankLoading}>
          <Text style={styles.actionButtonText}>
            {rankLoading ? "Initializing..." : "Initialize Rankings"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={recalculateAllRanks}
          disabled={rankLoading}>
          <Text style={styles.actionButtonText}>
            {rankLoading ? "Recalculating..." : "Recalculate All"}
          </Text>
        </TouchableOpacity>
      </View>
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
        <TouchableOpacity
          style={[styles.tab, activeTab === "collections" && styles.activeTab]}
          onPress={() => setActiveTab("collections")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "collections" && styles.activeTabText,
            ]}>
            Collections
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.periodContainer}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            timePeriod === "weekly" && styles.activePeriod,
          ]}
          onPress={() => setTimePeriod("weekly")}>
          <Text
            style={[
              styles.periodText,
              timePeriod === "weekly" && styles.activePeriodText,
            ]}>
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            timePeriod === "monthly" && styles.activePeriod,
          ]}
          onPress={() => setTimePeriod("monthly")}>
          <Text
            style={[
              styles.periodText,
              timePeriod === "monthly" && styles.activePeriodText,
            ]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            timePeriod === "allTime" && styles.activePeriod,
          ]}
          onPress={() => setTimePeriod("allTime")}>
          <Text
            style={[
              styles.periodText,
              timePeriod === "allTime" && styles.activePeriodText,
            ]}>
            All Time
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
    marginBottom: 16,
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#6674CC",
  },
  tabText: {
    color: "#9DA3B4",
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  periodContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#1A1D2F",
  },
  activePeriod: {
    backgroundColor: "#6674CC",
  },
  periodText: {
    color: "#9DA3B4",
    fontSize: 12,
    fontWeight: "500",
  },
  activePeriodText: {
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
    borderRadius: 12,
    padding: 16,
  },
  userRankSection: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  rankDisplay: {
    alignItems: "center",
  },
  rankNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6674CC",
    marginBottom: 4,
  },
  rankLabel: {
    fontSize: 14,
    color: "#9DA3B4",
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#6674CC",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default LeaderboardScreen;
