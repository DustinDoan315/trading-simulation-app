import { getColors } from '@/styles/colors';
import { useTheme } from '@/context/ThemeContext';
import LeaderboardService from '@/services/LeaderboardService';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '@/context/LanguageContext';
import { useLeaderboardData } from '@/hooks/useLeaderboardData';
import { useLeaderboardRanking } from '@/hooks/useLeaderboardRanking';
import { useNotification } from '@/components/ui/Notification';
import { UserService } from '@/services/UserService';
import { useUser } from '@/context/UserContext';
import {
  AppState,
  AppStateStatus,
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
import {
  ShimmerLeaderboardHeader,
  ShimmerLeaderboardItem,
} from "@/components/shimmer/ShimmerHeaders";


const LeaderboardScreen = () => {
  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");

  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);

  const { showNotification } = useNotification();
  const { user } = useUser();
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const colors = getColors(theme);

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

  const {
    currentRank,
    stats,
    isLoading: rankLoading,
    error: rankError,
    refreshRank,
  } = useLeaderboardRanking(user?.id || "", "ALL_TIME");

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

  useEffect(() => {
    updateFilters({
      period: "ALL_TIME",
      limit: 50,
    });
  }, [updateFilters]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (error) {
      showNotification({
        type: "error",
        message: `Failed to load leaderboard: ${error}`,
      });
    }
  }, [error, showNotification]);

  const transformLeaderboardData = useCallback(
    (data: any[], type: string) => {
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
          // Check if user is active (active in last 5 minutes)
          const lastActive = item.users?.last_active
            ? new Date(item.users.last_active)
            : null;
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          const isActive = lastActive && lastActive > fiveMinutesAgo;

          // Check if user is very active (active in last 1 minute)
          const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
          const isVeryActive = lastActive && lastActive > oneMinuteAgo;

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
            isActive: isActive,
            isVeryActive: isVeryActive,
            lastActive: lastActive,
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

  const formatTimeSince = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return t("leaderboard.justNow");
    if (diffInMinutes < 60)
      return t("leaderboard.minutesAgo", { minutes: diffInMinutes });
    if (diffInMinutes < 1440)
      return t("leaderboard.hoursAgo", {
        hours: Math.floor(diffInMinutes / 60),
      });
    return t("leaderboard.daysAgo", { days: Math.floor(diffInMinutes / 1440) });
  };

  const RankedItem = ({ item, type }: any) => (
    <View
      style={[
        styles.rankedItem, 
        { backgroundColor: colors.background.card },
        item.isCurrentUser && [
          styles.currentUserItem,
          { backgroundColor: colors.background.cardSecondary, borderColor: colors.action.accent }
        ]
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
              { color: item.rank <= 3 ? "#000" : colors.text.primary },
            ]}>
            {item.rank}
          </Text>
        </View>
        {item.isActive && (
          <View style={styles.activeIndicator}>
            <View
              style={[
                styles.activeDot,
                item.isVeryActive && styles.veryActiveDot,
              ]}
            />
          </View>
        )}
      </View>

      <View style={styles.infoSection}>
        <View style={styles.userInfo}>
          <Text style={styles.avatar}>{item.avatar}</Text>
          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.name,
                  { color: colors.text.primary },
                  item.isCurrentUser && [styles.currentUserName, { color: colors.action.accent }],
                ]}>
                {item.name}
              </Text>
            </View>
            {type === "collections" && (
              <Text style={[styles.members, { color: colors.text.muted }]}>
                {item.members} {t("leaderboard.members")}
              </Text>
            )}
            {!type.includes("collections") && item.lastActive && (
              <Text style={[styles.lastActiveText, { color: colors.text.muted }]}>
                {item.isActive
                  ? t("leaderboard.onlineNow")
                  : formatTimeSince(item.lastActive)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.statsContainer}>
          {type === "collections" ? (
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                ${item.totalValue.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.muted }]}>
                {t("leaderboard.totalValue")}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    { color: item.pnl >= 0 ? colors.action.buy : colors.action.sell },
                  ]}>
                  {item.pnl >= 0 ? "+" : ""}${item.pnl.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.muted }]}>P&L</Text>
              </View>
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    { color: item.percentage >= 0 ? colors.action.buy : colors.action.sell },
                  ]}>
                  {item.percentage >= 0 ? "+" : ""}
                  {item.percentage.toFixed(2)}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.muted }]}>{t("leaderboard.return")}</Text>
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
      return friendsData.map((item: any) => {
        // Check if user is active (active in last 5 minutes)
        const lastActive = item.users?.last_active
          ? new Date(item.users.last_active)
          : null;
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const isActive = lastActive && lastActive > fiveMinutesAgo;

        // Check if user is very active (active in last 1 minute)
        const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
        const isVeryActive = lastActive && lastActive > oneMinuteAgo;

        return {
          id: item.id || `friend-${item.user_id}`,
          rank: item.rank || 0,
          name:
            item.users?.display_name ||
            item.users?.username ||
            t("leaderboard.unknownUser"),
          avatar: item.users?.avatar_emoji || "👤",
          pnl: parseFloat(item.total_pnl || "0"),
          percentage: parseFloat(item.percentage_return || "0"),
          portfolio: parseFloat(item.portfolio_value || "0"),
          isCurrentUser: item.user_id === user?.id,
          isActive: isActive,
          isVeryActive: isVeryActive,
          lastActive: lastActive,
        };
      });
    }
    return globalRankings;
  }, [activeTab, globalRankings, friendsData, user?.id, t]);

  const handleRefresh = async () => {
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;
    try {
      await UserService.fixGlobalRanksIssue();

      await UserService.forceUpdateAllUsersRealTimeData();

      if (user?.id) {
        await UserService.updateLeaderboardRankings(user.id);
      }

      await refresh();
      await refreshRank();

      // Also refresh active users count
      const leaderboardService = LeaderboardService.getInstance();
      await leaderboardService.refreshActiveUsers();

      if (activeTab === "friends") {
        await loadFriendsData();
      }
    } catch (error) {
      console.error("Error refreshing leaderboard:", error);
    } finally {
      isRefreshingRef.current = false;
    }
  };

  const LeaderboardHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: colors.background.card }]}>
      <View style={styles.userRankSection}>
        <View style={styles.rankDisplay}>
          <View style={[styles.rankBadgeContainer, { backgroundColor: colors.action.accent }]}>
            <Text style={[styles.rankNumber, { color: colors.text.primary }]}>
              {currentRank ? `#${currentRank}` : "—"}
            </Text>
          </View>
          <Text style={[styles.rankLabel, { color: colors.text.muted }]}>
            {activeTab === "friends"
              ? currentRank
                ? t("leaderboard.yourGlobalPosition")
                : t("leaderboard.startTradingToGetRanked")
              : currentRank
              ? t("leaderboard.yourCurrentRank")
              : t("leaderboard.startTradingToGetRanked")}
          </Text>
        </View>
      </View>

      {(stats || leaderboardData.activeUsers !== undefined) && (
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>
              {stats?.totalUsers || leaderboardData.global.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.muted }]}>
              {activeTab === "friends"
                ? t("leaderboard.globalTraders")
                : t("leaderboard.totalTraders")}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>
              {leaderboardData.activeUsers || stats?.activeUsers || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.muted }]}>
              {t("leaderboard.activeTraders")}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  useEffect(() => {
    if (!user?.id) return;
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      try {
        if (nextAppState === "active") {
          await UserService.updateUserActivity(user.id, true);
        } else if (
          nextAppState === "background" ||
          nextAppState === "inactive"
        ) {
          await UserService.updateUserActivity(user.id, false);
        }
      } catch (err) {
        console.warn("Failed to update user activity:", err);
      }
    };
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const activityRefreshInterval = setInterval(async () => {
      try {
        await UserService.updateUserActivity(user.id, true);
      } catch (err) {
        console.warn("Failed to update user activity:", err);
      }
    }, 30000);

    return () => {
      clearInterval(activityRefreshInterval);
    };
  }, [user?.id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background.primary} />

      <View style={[styles.tabContainer, { backgroundColor: colors.background.card }]}>
        <TouchableOpacity
          style={[
            styles.tab, 
            activeTab === "global" && [styles.activeTab, { backgroundColor: colors.action.accent }]
          ]}
          onPress={() => setActiveTab("global")}>
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "global" ? colors.text.primary : colors.text.muted },
              activeTab === "global" && styles.activeTabText,
            ]}>
            {t("leaderboard.global")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab, 
            activeTab === "friends" && [styles.activeTab, { backgroundColor: colors.action.accent }]
          ]}
          onPress={() => setActiveTab("friends")}>
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "friends" ? colors.text.primary : colors.text.muted },
              activeTab === "friends" && styles.activeTabText,
            ]}>
            {t("leaderboard.friends")}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={
          isLoading || rankLoading || friendsLoading
            ? Array(6).fill({})
            : getCurrentData
        }
        renderItem={({ item, index }) =>
          isLoading || rankLoading || friendsLoading ? (
            <ShimmerLeaderboardItem key={index} />
          ) : (
            <RankedItem item={item} type={activeTab} />
          )
        }
        keyExtractor={(item, index) =>
          isLoading || rankLoading || friendsLoading
            ? `shimmer-${index}`
            : item.id
        }
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || rankLoading || friendsLoading}
            onRefresh={handleRefresh}
            tintColor={colors.action.accent}
            colors={[colors.action.accent]}
          />
        }
        ListHeaderComponent={
          isLoading || rankLoading || friendsLoading ? (
            <ShimmerLeaderboardHeader />
          ) : (
            <LeaderboardHeader />
          )
        }
        ListEmptyComponent={
          isLoading || rankLoading || friendsLoading ? null : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.text.muted }]}>
                {activeTab === "friends"
                  ? friendsData.length === 0
                    ? t("leaderboard.noFriendsFound")
                    : t("leaderboard.noFriendsWithRankings")
                  : t("leaderboard.noRankingsAvailable")}
              </Text>
            </View>
          )
        }
        key={`${activeTab}-${lastUpdated?.getTime() || Date.now()}`}
        extraData={lastUpdated}
      />

      {/* Last Updated Indicator */}
      {lastUpdated && (
        <View style={[styles.lastUpdatedContainer, { backgroundColor: colors.background.card }]}>
          <Text style={[styles.syncStatusText, { color: colors.action.buy }]}>
            {t("leaderboard.lastUpdated", {
              time: lastUpdated.toLocaleTimeString(),
            })}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 26,
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
    marginHorizontal: 16,
    marginVertical: 16,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  activeTabText: {
    fontWeight: "700",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
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
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  rankNumber: {
    fontSize: 24,
    fontWeight: "bold",
  },
  rankLabel: {
    fontSize: 14,
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  rankedItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentUserItem: {
    borderWidth: 2,
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
    fontSize: 12,
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    maxWidth: "80%",
  },
  name: {
    fontSize: 13,
    marginBottom: 2,
  },
  currentUserName: {
    fontWeight: "700",
  },
  activeBadge: {
    backgroundColor: "#6674CC",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  activeBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  members: {
    fontSize: 12,
  },
  lastActiveText: {
    fontSize: 12,
    marginTop: 4,
  },
  activeIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#131523",
    justifyContent: "center",
    alignItems: "center",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  veryActiveDot: {
    backgroundColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    alignItems: "flex-end",
    marginLeft: 16,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "500",
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
    fontSize: 14,
    textAlign: "center",
    lineHeight: 24,
  },
  lastUpdatedContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  lastUpdatedText: {
    fontSize: 12,
    textAlign: "center",
  },
  syncStatusText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  syncErrorText: {
    fontSize: 12,
    color: "#F9335D",
    textAlign: "center",
    marginTop: 4,
  },
  veryActiveBadge: {
    backgroundColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default LeaderboardScreen;
