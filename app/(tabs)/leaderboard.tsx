import colors from "@/styles/colors";
import LeaderboardService from "@/services/LeaderboardService";
import { useBackgroundSync } from "@/hooks/useBackgroundSync";
import { useFocusEffect } from "@react-navigation/native";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { useLeaderboardRanking } from "@/hooks/useLeaderboardRanking";
import { useNotification } from "@/components/ui/Notification";
import { UserService } from "@/services/UserService";
import { useUser } from "@/context/UserContext";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const LeaderboardScreen = () => {
  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");
  const hasInitialized = useRef(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);

  const { showNotification } = useNotification();
  const { user } = useUser();
  const { syncStatus, isEnabled, toggleSync } = useBackgroundSync();

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

  // Get friends leaderboard data when on friends tab
  const [friendsData, setFriendsData] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  const loadFriendsData = async () => {
    if (!user?.id || activeTab !== "friends") return;

    try {
      setFriendsLoading(true);
      const leaderboardService = LeaderboardService.getInstance();
      const data = await leaderboardService.fetchFriendsLeaderboardWithUser(
        user.id,
        {
          period: "ALL_TIME",
          limit: 50,
        }
      );
      setFriendsData(data);
    } catch (error) {
      console.error("Error loading friends data:", error);
    } finally {
      setFriendsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "friends") {
      loadFriendsData();
    }
  }, [activeTab, user?.id]);

  // Update filters when time period changes
  useEffect(() => {
    updateFilters({
      period: "ALL_TIME",
      limit: 50,
    });
  }, [updateFilters]);

  // DISABLED: Automatic initialization for manual-only refresh
  // useEffect(() => {
  //   const initializeRankings = async () => {
  //     try {
  //       console.log("🔄 Initializing leaderboard rankings...");

  //       // Force update current user's leaderboard rankings first
  //       if (user?.id) {
  //         console.log(
  //           "🔄 Force updating current user's leaderboard rankings..."
  //         );
  //         await UserService.updateLeaderboardRankings(user.id);
  //       }

  //       await UserService.initializeLeaderboardRankings();
  //       console.log("✅ Leaderboard rankings initialized");
  //     } catch (error) {
  //       console.error("❌ Error initializing leaderboard rankings:", error);
  //     }
  //   };

  //   // Only initialize if we have a user and no data yet, and only once per session
  //   if (
  //     user?.id &&
  //     leaderboardData.global.length === 0 &&
  //     !hasInitialized.current
  //   ) {
  //     hasInitialized.current = true;
  //     initializeRankings();
  //   }
  // }, [user?.id, leaderboardData.global.length]);

  // DISABLED: Automatic leaderboard updates for manual-only refresh
  // useEffect(() => {
  //   const updateCurrentUserRankings = async () => {
  //     if (user?.id) {
  //       try {
  //       await UserService.updateLeaderboardRankings(user.id);
  //       } catch (error) {
  //       console.error("Error updating current user rankings:", error);
  //       }
  //     }
  //   };

  //   // Only update when user changes, not on every mount
  //   if (user?.id) {
  //     updateCurrentUserRankings();
  //   }
  // }, [user?.id]);

  // Debounced refresh function
  const debouncedRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      console.log("🔄 Refresh already in progress, skipping...");
      return;
    }

    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Set debounced refresh
    refreshTimeoutRef.current = setTimeout(async () => {
      if (isRefreshingRef.current) return;

      isRefreshingRef.current = true;
      try {
        console.log("🔄 Starting debounced refresh...");

        // Refresh the leaderboard data (this will trigger leaderboard updates automatically)
        await refresh();
        await refreshRank();

        if (activeTab === "friends") {
          await loadFriendsData();
        }

        console.log("✅ Debounced refresh completed");
      } catch (error) {
        console.error("Error during debounced refresh:", error);
      } finally {
        isRefreshingRef.current = false;
      }
    }, 1000); // 1 second debounce
  }, [user?.id, activeTab, refresh, refreshRank, loadFriendsData]);

  // DISABLED: Automatic refresh on focus for manual-only refresh
  // useFocusEffect(
  //   useCallback(() => {
  //     debouncedRefresh();
  //   }, [debouncedRefresh])
  // );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Show error notification if there's an error
  useEffect(() => {
    if (error) {
      showNotification({
        type: "error",
        message: `Failed to load leaderboard: ${error}`,
      });
    }
  }, [error, showNotification]);

  // Transform real-time data for display (memoized to prevent unnecessary re-renders)
  const transformLeaderboardData = useCallback(
    (data: any[], type: string) => {
      console.log(`🔄 Transforming ${type} data:`, data.length, "items");

      // Debug: Log the first item to see the actual data structure
      if (data.length > 0) {
        console.log(
          `🔍 Sample ${type} data item:`,
          JSON.stringify(data[0], null, 2)
        );
      }

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
              item.users?.display_name ||
              item.users?.username ||
              "Unknown User",
            avatar: item.users?.avatar_emoji || "👤",
            pnl: parseFloat(item.total_pnl || "0"),
            percentage: parseFloat(item.percentage_return || "0"),
            portfolio: parseFloat(item.portfolio_value || "0"),
            isCurrentUser: item.user_id === user?.id,
          };
        }
      });
    },
    [user?.id]
  );

  const globalRankings = useMemo(
    () => transformLeaderboardData(leaderboardData.global, "global"),
    [transformLeaderboardData, leaderboardData.global]
  );

  const friendsRankings = useMemo(
    () => transformLeaderboardData(leaderboardData.friends, "friends"),
    [transformLeaderboardData, leaderboardData.friends]
  );

  const collectionRankings = useMemo(
    () => transformLeaderboardData(leaderboardData.collections, "collections"),
    [transformLeaderboardData, leaderboardData.collections]
  );

  // Debug: Log when data changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log("🔄 Leaderboard data updated:", {
        global: leaderboardData.global.length,
        friends: leaderboardData.friends.length,
        collections: leaderboardData.collections.length,
        lastUpdated: lastUpdated?.toISOString(),
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [leaderboardData, lastUpdated]);

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
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                ${item.totalValue.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total Value</Text>
            </View>
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
                  {item.percentage.toFixed(2)}%
                </Text>
                <Text style={styles.statLabel}>Return</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );

  const getCurrentData = useMemo(() => {
    if (activeTab === "global") return globalRankings;
    if (activeTab === "friends") {
      // Transform friends data for display
      return friendsData.map((item: any) => ({
        id: item.id || `friend-${item.user_id}`,
        rank: item.rank || 0,
        name:
          item.users?.display_name || item.users?.username || "Unknown User",
        avatar: item.users?.avatar_emoji || "👤",
        pnl: parseFloat(item.total_pnl || "0"),
        percentage: parseFloat(item.percentage_return || "0"),
        portfolio: parseFloat(item.portfolio_value || "0"),
        isCurrentUser: item.user_id === user?.id,
      }));
    }
    return globalRankings; // fallback to global
  }, [activeTab, globalRankings, friendsData, user?.id]);

  const handleRefresh = async () => {
    if (isRefreshingRef.current) {
      console.log("🔄 Refresh already in progress, skipping...");
      return;
    }

    isRefreshingRef.current = true;
    try {
      console.log("🔄 Starting manual refresh...");

      // Force update all users' real-time PnL data first
      console.log("🔄 Updating all users' real-time PnL data...");
      await UserService.forceUpdateAllUsersRealTimeData();

      // Force update current user's leaderboard rankings
      if (user?.id) {
        console.log("🔄 Updating current user's leaderboard rankings...");
        await UserService.updateLeaderboardRankings(user.id);
      }

      // Then refresh the leaderboard data
      await refresh();
      await refreshRank();
      if (activeTab === "friends") {
        await loadFriendsData();
      }

      console.log("✅ Manual refresh completed");
    } catch (error) {
      console.error("Error refreshing leaderboard:", error);
    } finally {
      isRefreshingRef.current = false;
    }
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
          </View>
          <Text style={styles.rankLabel}>
            {activeTab === "friends"
              ? currentRank
                ? "Your Global Position"
                : "Start trading to get ranked"
              : currentRank
              ? "Your Current Rank"
              : "Start trading to get ranked"}
          </Text>
        </View>
      </View>

      {stats && (
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>
              {activeTab === "friends" ? "Global Traders" : "Total Traders"}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {stats.topPerformer ? `#${stats.topPerformer.rank}` : "—"}
            </Text>
            <Text style={styles.statLabel}>Top Performer</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>
              {activeTab === "friends" ? "Active Global" : "Active Traders"}
            </Text>
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
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.syncButton, styles.syncButtonDisabled]}
            onPress={() =>
              console.log("🔄 Background sync disabled - manual refresh only")
            }>
            <Text style={styles.syncButtonText}>⏸️</Text>
          </TouchableOpacity>
        </View>
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
        data={getCurrentData}
        renderItem={({ item }) => <RankedItem item={item} type={activeTab} />}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || rankLoading || friendsLoading}
            onRefresh={handleRefresh}
            tintColor="#6674CC"
            colors={["#6674CC"]}
          />
        }
        ListHeaderComponent={<LeaderboardHeader />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {isLoading || friendsLoading
                ? "Loading leaderboard..."
                : activeTab === "friends"
                ? friendsData.length === 0
                  ? "No friends found. Add some friends to see them on the leaderboard!"
                  : "No friends with rankings yet. Start trading to appear on the leaderboard!"
                : "No rankings available yet"}
            </Text>
          </View>
        }
        key={`${activeTab}-${lastUpdated?.getTime() || Date.now()}`}
        extraData={lastUpdated}
      />

      {/* Last Updated Indicator */}
      {lastUpdated && (
        <View style={styles.lastUpdatedContainer}>
          <Text style={styles.syncStatusText}>
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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  syncButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    marginRight: 8,
  },
  syncButtonDisabled: {
    backgroundColor: "#9E9E9E",
  },
  syncButtonText: {
    fontSize: 20,
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
    fontSize: 16,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1A1D2F",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  userRankSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  rankDisplay: {
    alignItems: "center",
  },
  rankBadgeContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6674CC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#6674CC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  rankNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  rankLabel: {
    fontSize: 14,
    color: "#9DA3B4",
    textAlign: "center",
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statCard: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9DA3B4",
    textAlign: "center",
  },
  rankedItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1A1D2F",
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentUserItem: {
    backgroundColor: "#2A2F45",
    borderWidth: 2,
    borderColor: "#6674CC",
  },
  rankSection: {
    marginRight: 16,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  rankText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  infoSection: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
    marginBottom: 2,
  },
  currentUserName: {
    color: "#6674CC",
    fontWeight: "700",
  },
  members: {
    fontSize: 12,
    color: "#9DA3B4",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    marginLeft: 16,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9DA3B4",
    textAlign: "center",
    lineHeight: 24,
  },
  lastUpdatedContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#1A1D2F",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: "#9DA3B4",
    textAlign: "center",
  },
  syncStatusText: {
    fontSize: 12,
    color: "#4CAF50",
    textAlign: "center",
    marginTop: 4,
  },
  syncErrorText: {
    fontSize: 12,
    color: "#F9335D",
    textAlign: "center",
    marginTop: 4,
  },
});

export default LeaderboardScreen;
