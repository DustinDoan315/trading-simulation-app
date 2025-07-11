import colors from '@/styles/colors';
import LeaderboardService from '@/services/LeaderboardService';
import React, {
    useEffect,
    useMemo,
    useRef,
    useState
    } from 'react';
import { useLeaderboardData } from '@/hooks/useLeaderboardData';
import { useLeaderboardRanking } from '@/hooks/useLeaderboardRanking';
import { useNotification } from '@/components/ui/Notification';
import { UserService } from '@/services/UserService';
import { useUser } from '@/context/UserContext';
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
  const hasInitialized = useRef(false);

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

  // Initialize leaderboard rankings if needed (only once)
  useEffect(() => {
    const initializeRankings = async () => {
      try {
        console.log("🔄 Initializing leaderboard rankings...");
        await UserService.initializeLeaderboardRankings();
        console.log("✅ Leaderboard rankings initialized");
      } catch (error) {
        console.error("❌ Error initializing leaderboard rankings:", error);
      }
    };

    // Only initialize if we have a user and no data yet, and only once per session
    if (
      user?.id &&
      leaderboardData.global.length === 0 &&
      !hasInitialized.current
    ) {
      hasInitialized.current = true;
      initializeRankings();
    }
  }, [user?.id, leaderboardData.global.length]);

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
        // Get P&L data from user's actual data, not from leaderboard rankings
        const pnl = parseFloat(item.users?.total_pnl || "0");
        const percentage = parseFloat(item.users?.total_pnl_percentage || "0");
        const portfolio = parseFloat(item.users?.total_portfolio_value || "0");

        console.log(
          `📊 User ${
            item.users?.display_name || item.users?.username
          }: P&L=${pnl}, Return=${percentage}%, Portfolio=${portfolio}`
        );

        return {
          id: item.id || `user-${index}`,
          rank: item.rank || index + 1,
          name:
            item.users?.display_name || item.users?.username || "Unknown User",
          avatar: item.users?.avatar_emoji || "👤",
          pnl: pnl,
          percentage: percentage,
          portfolio: portfolio,
          isCurrentUser: item.is_current_user || false,
        };
      }
    });
  };

  // Use useMemo to recalculate rankings when data changes
  const globalRankings = React.useMemo(
    () => transformLeaderboardData(leaderboardData.global, "global"),
    [leaderboardData.global]
  );

  const friendsRankings = React.useMemo(
    () => transformLeaderboardData(leaderboardData.friends, "friends"),
    [leaderboardData.friends]
  );

  const collectionRankings = React.useMemo(
    () => transformLeaderboardData(leaderboardData.collections, "collections"),
    [leaderboardData.collections]
  );

  // Debug: Log when data changes
  useEffect(() => {
    console.log("🔄 Leaderboard data updated:", {
      global: leaderboardData.global.length,
      friends: leaderboardData.friends.length,
      collections: leaderboardData.collections.length,
      lastUpdated: lastUpdated?.toISOString(),
    });
  }, [leaderboardData, lastUpdated]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return colors.text.secondary;
  };

  const RankedItem = React.memo(({ item, type }: any) => {
    console.log(
      `📊 Rendering RankedItem:`,
      item.name,
      "Rank:",
      item.rank,
      "P&L:",
      item.pnl
    );

    return (
      <View
        style={[
          styles.rankedItem,
          item.isCurrentUser && styles.currentUserItem,
        ]}>
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
  });

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
    await refresh();
    await refreshRank();
    if (activeTab === "friends") {
      await loadFriendsData();
    }
  };

  const handleCleanupAndRefresh = async () => {
    try {
      showNotification({
        type: "info",
        message: "Cleaning up leaderboard data...",
      });

      const leaderboardService = LeaderboardService.getInstance();
      await leaderboardService.cleanupAndRefresh({
        period: "ALL_TIME",
        limit: 50,
      });
      await refreshRank();

      showNotification({
        type: "success",
        message: "Leaderboard cleaned up and refreshed successfully!",
      });
    } catch (error) {
      console.error("Error during cleanup and refresh:", error);
      showNotification({
        type: "error",
        message: "Failed to cleanup and refresh leaderboard",
      });
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
        <TouchableOpacity
          style={styles.cleanupButton}
          onPress={handleCleanupAndRefresh}>
          <Text style={styles.cleanupButtonText}>🧹</Text>
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
  cleanupButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#6674CC",
    marginLeft: 10,
  },
  cleanupButtonText: {
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
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  friendsInfoContainer: {
    backgroundColor: "#252A3D",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  friendsInfoText: {
    fontSize: 14,
    color: "#9DA3B4",
    textAlign: "center",
  },
});

export default LeaderboardScreen;
