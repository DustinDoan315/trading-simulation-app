import React, { useEffect, useState } from 'react';
import { fetchTransactions } from '@/features/userSlice';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '@/utils/logger';
import { router } from 'expo-router';
import { Transaction } from '@/types/database';
import { useAppDispatch } from '@/store';
import { useUser } from '@/context/UserContext';
import {
  ActivityIndicator,
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


const TradingHistoryModal = () => {
  const dispatch = useAppDispatch();
  const { user, transactions, loading, error, refreshUserData } = useUser();

  const [activeFilter, setActiveFilter] = useState<"all" | "buy" | "sell">(
    "all"
  );
  const [timePeriod, setTimePeriod] = useState<
    "1d" | "1w" | "1m" | "3m" | "1y"
  >("1w");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchTransactions({ userId: user.id, limit: 100 }));
    }
  }, [user?.id, dispatch]);

  const handleRefresh = async () => {
    if (!user?.id) return;

    try {
      setRefreshing(true);
      await refreshUserData(user.id);
    } catch (error) {
      logger.error(
        "Failed to refresh trading history",
        "TradingHistory",
        error
      );
    } finally {
      setRefreshing(false);
    }
  };

  const getFilteredHistory = () => {
    if (!transactions) return [];

    let filtered = transactions;

    // Filter by type
    if (activeFilter !== "all") {
      filtered = filtered.filter(
        (trade) => trade.type.toLowerCase() === activeFilter
      );
    }

    // Filter by time period
    const now = new Date();
    const timePeriodMap = {
      "1d": 24 * 60 * 60 * 1000,
      "1w": 7 * 24 * 60 * 60 * 1000,
      "1m": 30 * 24 * 60 * 60 * 1000,
      "3m": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };

    const cutoffTime = now.getTime() - timePeriodMap[timePeriod];
    filtered = filtered.filter((trade) => {
      const tradeTime = new Date(trade.timestamp).getTime();
      return tradeTime >= cutoffTime;
    });

    return filtered;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const formatAmount = (value: string | number, decimals: number = 8) => {
    const num = typeof value === "string" ? parseFloat(value) : value;

    if (num < 0.0001) {
      return num.toExponential(4);
    }

    if (num < 1) {
      return num.toFixed(Math.min(2, decimals));
    }

    // For larger amounts, show fewer decimal
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    } else {
      return num.toFixed(Math.min(2, decimals));
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;

    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "#10BA68";
      case "PENDING":
        return "#FF9500";
      case "CANCELLED":
        return "#F9335D";
      case "FAILED":
        return "#F9335D";
      default:
        return "#9DA3B4";
    }
  };

  const getTypeGradient = (type: string): readonly [string, string] => {
    if (type === "BUY") {
      return ["#10BA68", "#0A8A4A"] as const;
    } else {
      return ["#F9335D", "#D42A4A"] as const;
    }
  };

  const TradeItem = ({ trade }: { trade: Transaction }) => (
    <View style={styles.tradeItem}>
      <LinearGradient
        colors={["#1A1D2F", "#2A2E42"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tradeItemGradient}>
        {/* Header Section */}
        <View style={styles.tradeHeader}>
          <View style={styles.symbolContainer}>
            <View style={styles.symbolIcon}>
              <Text style={styles.symbolIconText}>
                {trade.symbol.charAt(0)}
              </Text>
            </View>
            <View style={styles.symbolInfo}>
              <Text style={styles.symbol}>{trade.symbol}</Text>
              <Text style={styles.symbolName}>{trade.symbol} Token</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <LinearGradient
              colors={getTypeGradient(trade.type)}
              style={styles.typeBadge}>
              <Ionicons
                name={trade.type === "BUY" ? "arrow-down" : "arrow-up"}
                size={12}
                color="#FFFFFF"
              />
              <Text style={styles.typeText}>{trade.type}</Text>
            </LinearGradient>
            <Text style={styles.timestamp}>{formatDate(trade.timestamp)}</Text>
          </View>
        </View>

        {/* Amount and Price Section */}
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>
              {formatAmount(trade.quantity)} {trade.symbol}
            </Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Price</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(trade.price)}
            </Text>
          </View>
        </View>

        {/* Total and Fee Section */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Value</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(trade.total_value)}
            </Text>
          </View>
          {parseFloat(trade.fee) > 0 && (
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Fee</Text>
              <Text style={styles.feeValue}>{formatCurrency(trade.fee)}</Text>
            </View>
          )}
        </View>

        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(trade.status) },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(trade.status) },
              ]}>
              {trade.status}
            </Text>
          </View>
          <View style={styles.orderTypeContainer}>
            <Text style={styles.orderTypeText}>{trade.order_type}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const FilterButton = ({
    title,
    value,
    isActive,
  }: {
    title: string;
    value: "all" | "buy" | "sell";
    isActive: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.activeFilterButton]}
      onPress={() => setActiveFilter(value)}>
      <LinearGradient
        colors={isActive ? ["#6674CC", "#5A6BC0"] : ["#1A1D2F", "#2A2E42"]}
        style={styles.filterButtonGradient}>
        <Text
          style={[
            styles.filterButtonText,
            isActive && styles.activeFilterButtonText,
          ]}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const TimeButton = ({
    title,
    value,
    isActive,
  }: {
    title: string;
    value: "1d" | "1w" | "1m" | "3m" | "1y";
    isActive: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.timeButton, isActive && styles.activeTimeButton]}
      onPress={() => setTimePeriod(value)}>
      <LinearGradient
        colors={isActive ? ["#6674CC", "#5A6BC0"] : ["#1A1D2F", "#2A2E42"]}
        style={styles.timeButtonGradient}>
        <Text
          style={[
            styles.timeButtonText,
            isActive && styles.activeTimeButtonText,
          ]}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const filteredHistory = getFilteredHistory();
  const buyCount = filteredHistory.filter((t) => t.type === "BUY").length;
  const sellCount = filteredHistory.filter((t) => t.type === "SELL").length;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Trading History</Text>
          <View style={styles.exportButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6674CC" />
          <Text style={styles.loadingText}>Loading trading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Trading History</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Time Period Filter */}
      <View style={styles.timeFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TimeButton title="1D" value="1d" isActive={timePeriod === "1d"} />
          <TimeButton title="1W" value="1w" isActive={timePeriod === "1w"} />
          <TimeButton title="1M" value="1m" isActive={timePeriod === "1m"} />
          <TimeButton title="3M" value="3m" isActive={timePeriod === "3m"} />
          <TimeButton title="1Y" value="1y" isActive={timePeriod === "1y"} />
        </ScrollView>
      </View>

      {/* Trade Type Filter */}
      <View style={styles.filterContainer}>
        <FilterButton
          title="All"
          value="all"
          isActive={activeFilter === "all"}
        />
        <FilterButton
          title="Buy"
          value="buy"
          isActive={activeFilter === "buy"}
        />
        <FilterButton
          title="Sell"
          value="sell"
          isActive={activeFilter === "sell"}
        />
      </View>

      {/* Statistics Summary */}
      <View style={styles.statsContainer}>
        <LinearGradient colors={["#1A1D2F", "#2A2E42"]} style={styles.statCard}>
          <Text style={styles.statLabel}>Total Trades</Text>
          <Text style={styles.statValue}>{filteredHistory.length}</Text>
        </LinearGradient>
        <LinearGradient colors={["#1A1D2F", "#2A2E42"]} style={styles.statCard}>
          <Text style={styles.statLabel}>Buy Orders</Text>
          <Text style={styles.statValue}>{buyCount}</Text>
        </LinearGradient>
        <LinearGradient colors={["#1A1D2F", "#2A2E42"]} style={styles.statCard}>
          <Text style={styles.statLabel}>Sell Orders</Text>
          <Text style={styles.statValue}>{sellCount}</Text>
        </LinearGradient>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={24} color="#F9335D" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Trading History List */}
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TradeItem trade={item} />}
        style={styles.historyList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.historyListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6674CC"
            colors={["#6674CC"]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#9DA3B4" />
            <Text style={styles.emptyText}>No trading history found</Text>
            <Text style={styles.emptySubtext}>
              {filteredHistory.length === 0 && transactions.length > 0
                ? "Try adjusting your filters"
                : "Start trading to see your history"}
            </Text>
          </View>
        )}
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
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1D2F",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#9DA3B4",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1D2F",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F9335D",
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#F9335D",
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9DA3B4",
    marginTop: 8,
    textAlign: "center",
  },
  timeFilterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  timeButton: {
    borderRadius: 20,
    marginRight: 8,
    overflow: "hidden",
  },
  timeButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  activeTimeButton: {
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
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  filterButtonGradient: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  activeFilterButton: {
    borderColor: "#6674CC",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9DA3B4",
  },
  activeFilterButtonText: {
    color: "#FFFFFF",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  statLabel: {
    fontSize: 12,
    color: "#9DA3B4",
    marginBottom: 8,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  historyList: {
    flex: 1,
  },
  historyListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tradeItem: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tradeItemGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  tradeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  symbolContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  symbolIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6674CC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  symbolIconText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  symbolInfo: {
    flex: 1,
  },
  symbol: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  symbolName: {
    fontSize: 12,
    color: "#9DA3B4",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 11,
    color: "#9DA3B4",
  },
  amountSection: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 13,
    color: "#9DA3B4",
    fontWeight: "500",
  },
  amountValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  totalSection: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2E42",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: "#9DA3B4",
    fontWeight: "500",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeLabel: {
    fontSize: 13,
    color: "#9DA3B4",
    fontWeight: "500",
  },
  feeValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#F9335D",
  },
  statusSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2E42",
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
    fontWeight: "600",
    textTransform: "uppercase",
  },
  orderTypeContainer: {
    backgroundColor: "#2A2E42",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderTypeText: {
    fontSize: 10,
    color: "#9DA3B4",
    fontWeight: "500",
    textTransform: "uppercase",
  },
});

export default TradingHistoryModal;
