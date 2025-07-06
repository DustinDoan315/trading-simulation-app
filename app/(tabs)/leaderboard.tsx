import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/styles/colors";

const LeaderboardScreen = () => {
  const [activeTab, setActiveTab] = useState<'global' | 'friends' | 'collections'>('global');
  const [timePeriod, setTimePeriod] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');

  const globalRankings = [
    {
      id: '1',
      rank: 1,
      name: 'CryptoKing',
      avatar: '👑',
      pnl: 45000,
      percentage: 23.5,
      portfolio: 236000,
    },
    {
      id: '2',
      rank: 2,
      name: 'TradeQueen',
      avatar: '⭐',
      pnl: 38000,
      percentage: 19.2,
      portfolio: 198000,
    },
    {
      id: '3',
      rank: 3,
      name: 'DeFiWizard',
      avatar: '🔮',
      pnl: 32000,
      percentage: 16.8,
      portfolio: 190000,
    },
    {
      id: '4',
      rank: 4,
      name: 'You',
      avatar: '🚀',
      pnl: 28000,
      percentage: 15.2,
      portfolio: 184000,
      isCurrentUser: true,
    },
  ];

  const friendsRankings = [
    {
      id: '1',
      rank: 1,
      name: 'You',
      avatar: '🚀',
      pnl: 28000,
      percentage: 15.2,
      portfolio: 184000,
      isCurrentUser: true,
    },
    {
      id: '2',
      rank: 2,
      name: 'Alex',
      avatar: '💎',
      pnl: 22000,
      percentage: 12.8,
      portfolio: 172000,
    },
    {
      id: '3',
      rank: 3,
      name: 'Sarah',
      avatar: '🌟',
      pnl: 18000,
      percentage: 10.5,
      portfolio: 171000,
    },
  ];

  const collectionRankings = [
    {
      id: '1',
      rank: 1,
      name: 'Crypto Masters',
      members: 12,
      totalValue: 2400000,
      avgPnl: 15.8,
      isMyCollection: true,
    },
    {
      id: '2',
      rank: 2,
      name: 'DeFi Legends',
      members: 8,
      totalValue: 1900000,
      avgPnl: 14.2,
      isMyCollection: false,
    },
    {
      id: '3',
      rank: 3,
      name: 'Moonshot Hunters',
      members: 45,
      totalValue: 8900000,
      avgPnl: 12.9,
      isMyCollection: false,
    },
  ];

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return colors.text.secondary;
  };

  const RankedItem = ({ item, type }: any) => (
    <View style={[styles.rankedItem, item.isCurrentUser && styles.currentUserItem]}>
      <View style={styles.rankSection}>
        <View style={[styles.rankBadge, { backgroundColor: getRankColor(item.rank) }]}>
          <Text style={[styles.rankText, { color: item.rank <= 3 ? '#000' : '#fff' }]}>
            {item.rank}
          </Text>
        </View>
      </View>
      
      <View style={styles.infoSection}>
        <View style={styles.userInfo}>
          <Text style={styles.avatar}>{item.avatar}</Text>
          <View style={styles.nameContainer}>
            <Text style={[styles.name, item.isCurrentUser && styles.currentUserName]}>
              {item.name}
            </Text>
            {type === 'collections' && (
              <Text style={styles.members}>{item.members} members</Text>
            )}
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          {type === 'collections' ? (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>${item.totalValue.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Value</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.action.buy }]}>
                  +{item.avgPnl}%
                </Text>
                <Text style={styles.statLabel}>Avg P&L</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: item.pnl >= 0 ? colors.action.buy : colors.action.sell }]}>
                  {item.pnl >= 0 ? '+' : ''}${item.pnl.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>P&L</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: item.percentage >= 0 ? colors.action.buy : colors.action.sell }]}>
                  {item.percentage >= 0 ? '+' : ''}{item.percentage}%
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
    if (activeTab === 'global') return globalRankings;
    if (activeTab === 'friends') return friendsRankings;
    return collectionRankings;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131523" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboards</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'global' && styles.activeTab]}
          onPress={() => setActiveTab('global')}
        >
          <Text style={[styles.tabText, activeTab === 'global' && styles.activeTabText]}>
            Global
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'collections' && styles.activeTab]}
          onPress={() => setActiveTab('collections')}
        >
          <Text style={[styles.tabText, activeTab === 'collections' && styles.activeTabText]}>
            Collections
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.periodContainer}>
        <TouchableOpacity
          style={[styles.periodButton, timePeriod === 'weekly' && styles.activePeriod]}
          onPress={() => setTimePeriod('weekly')}
        >
          <Text style={[styles.periodText, timePeriod === 'weekly' && styles.activePeriodText]}>
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, timePeriod === 'monthly' && styles.activePeriod]}
          onPress={() => setTimePeriod('monthly')}
        >
          <Text style={[styles.periodText, timePeriod === 'monthly' && styles.activePeriodText]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, timePeriod === 'allTime' && styles.activePeriod]}
          onPress={() => setTimePeriod('allTime')}
        >
          <Text style={[styles.periodText, timePeriod === 'allTime' && styles.activePeriodText]}>
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
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.ui.highlight,
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.text.primary,
  },
  periodContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
  },
  activePeriod: {
    backgroundColor: colors.ui.highlight,
  },
  periodText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  activePeriodText: {
    color: colors.text.primary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  rankedItem: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  currentUserItem: {
    borderColor: colors.ui.highlight,
    borderWidth: 2,
  },
  rankSection: {
    marginRight: 16,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoSection: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '600',
    color: colors.text.primary,
  },
  currentUserName: {
    color: colors.ui.highlight,
  },
  members: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.text.secondary,
    marginTop: 2,
  },
});

export default LeaderboardScreen;