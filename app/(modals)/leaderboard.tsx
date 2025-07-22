import colors from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { useNotification } from "@/components/ui/Notification";
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

const LeaderboardModal = () => {
  const [activeTab, setActiveTab] = useState<
    "global" | "friends" | "collections"
  >("global");

  const { showNotification } = useNotification();

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

  useEffect(() => {
    updateFilters({
      period: "ALL_TIME",
      limit: 50,
    });
  }, [updateFilters]);

  useEffect(() => {
    if (error) {
      showNotification({
        type: "error",
        message: `Failed to load leaderboard: ${error}`,
      });
    }
  }, [error, showNotification]);

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
          percentage: parseFloat(item.percentage_return || "0"),
          portfolio: parseFloat(item.portfolio_value || "0"),
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

  const getCurrentDataTyped = () => {
    if (activeTab === "global") return globalRankings;
    if (activeTab === "friends") return friendsRankings;
    return collectionRankings as any[];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Leaderboards</Text>
        <View style={styles.placeholder} />
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

      <FlatList
        data={getCurrentDataTyped()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RankedItem item={item} type={activeTab} />}
        style={styles.rankingsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.rankingsListContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor="#6674CC"
            colors={["#6674CC"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {isLoading ? "Loading leaderboard..." : "No data available"}
            </Text>
          </View>
        }
      />

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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "#6674CC",
  },
  tabText: {
    color: "#9DA3B4",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  rankingsList: {
    flex: 1,
  },
  rankingsListContent: {
    paddingBottom: 20,
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
  statLabel: {
    fontSize: 10,
    color: "#9DA3B4",
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
});

export default LeaderboardModal;
