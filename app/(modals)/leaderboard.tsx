import colors from '@/styles/colors';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
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
  const [timePeriod, setTimePeriod] = useState<
    "weekly" | "monthly" | "allTime"
  >("weekly");

  const globalRankings = [
    {
      id: "1",
      rank: 1,
      name: "CryptoKing",
      avatar: "👑",
      pnl: 45000,
      percentage: 23.5,
      portfolio: 236000,
    },
    {
      id: "2",
      rank: 2,
      name: "TradeQueen",
      avatar: "⭐",
      pnl: 38000,
      percentage: 19.2,
      portfolio: 198000,
    },
    {
      id: "3",
      rank: 3,
      name: "DeFiWizard",
      avatar: "🔮",
      pnl: 32000,
      percentage: 16.8,
      portfolio: 190000,
    },
    {
      id: "4",
      rank: 4,
      name: "You",
      avatar: "🚀",
      pnl: 28000,
      percentage: 15.2,
      portfolio: 184000,
      isCurrentUser: true,
    },
  ];

  const friendsRankings = [
    {
      id: "1",
      rank: 1,
      name: "You",
      avatar: "🚀",
      pnl: 28000,
      percentage: 15.2,
      portfolio: 184000,
      isCurrentUser: true,
    },
    {
      id: "2",
      rank: 2,
      name: "Alex",
      avatar: "💎",
      pnl: 22000,
      percentage: 12.8,
      portfolio: 172000,
    },
    {
      id: "3",
      rank: 3,
      name: "Sarah",
      avatar: "🌟",
      pnl: 18000,
      percentage: 10.5,
      portfolio: 171000,
    },
  ];

  const collectionRankings = [
    {
      id: "1",
      rank: 1,
      name: "Crypto Masters",
      members: 12,
      totalValue: 2400000,
      avgPnl: 15.8,
      isMyCollection: true,
    },
    {
      id: "2",
      rank: 2,
      name: "DeFi Legends",
      members: 8,
      totalValue: 1900000,
      avgPnl: 14.2,
      isMyCollection: false,
    },
    {
      id: "3",
      rank: 3,
      name: "Moonshot Hunters",
      members: 45,
      totalValue: 8900000,
      avgPnl: 12.9,
      isMyCollection: false,
    },
  ];

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
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Time Period Filter */}
      <View style={styles.timeFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.timeButton,
              timePeriod === "weekly" && styles.activeTimeButton,
            ]}
            onPress={() => setTimePeriod("weekly")}>
            <Text
              style={[
                styles.timeButtonText,
                timePeriod === "weekly" && styles.activeTimeButtonText,
              ]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeButton,
              timePeriod === "monthly" && styles.activeTimeButton,
            ]}
            onPress={() => setTimePeriod("monthly")}>
            <Text
              style={[
                styles.timeButtonText,
                timePeriod === "monthly" && styles.activeTimeButtonText,
              ]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeButton,
              timePeriod === "allTime" && styles.activeTimeButton,
            ]}
            onPress={() => setTimePeriod("allTime")}>
            <Text
              style={[
                styles.timeButtonText,
                timePeriod === "allTime" && styles.activeTimeButtonText,
              ]}>
              All Time
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Tab Navigation */}
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

      {/* Rankings List */}
      <FlatList
        data={getCurrentDataTyped()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RankedItem item={item} type={activeTab} />}
        style={styles.rankingsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.rankingsListContent}
      />
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1D2F",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
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
  timeFilterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1A1D2F",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  activeTimeButton: {
    backgroundColor: "#6674CC",
    borderColor: "#6674CC",
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9DA3B4",
  },
  activeTimeButtonText: {
    color: "#FFFFFF",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1A1D2F",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  activeTab: {
    backgroundColor: "#6674CC",
    borderColor: "#6674CC",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9DA3B4",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  rankingsList: {
    flex: 1,
  },
  rankingsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  rankedItem: {
    flexDirection: "row",
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  currentUserItem: {
    borderColor: "#6674CC",
    borderWidth: 2,
  },
  rankSection: {
    marginRight: 16,
    justifyContent: "center",
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
  },
  members: {
    fontSize: 12,
    color: "#9DA3B4",
  },
  statsContainer: {
    alignItems: "flex-end",
  },
  statItem: {
    alignItems: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 10,
    color: "#9DA3B4",
    textTransform: "uppercase",
  },
});

export default LeaderboardModal;
