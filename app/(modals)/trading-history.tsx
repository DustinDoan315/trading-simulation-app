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


const TradingHistoryModal = () => {
  const [activeFilter, setActiveFilter] = useState<"all" | "buy" | "sell">(
    "all"
  );
  const [timePeriod, setTimePeriod] = useState<
    "1d" | "1w" | "1m" | "3m" | "1y"
  >("1w");

  const tradingHistory = [
    {
      id: "1",
      symbol: "BTC",
      type: "buy",
      amount: 0.5,
      price: 45000,
      total: 22500,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: "completed",
    },
    {
      id: "2",
      symbol: "ETH",
      type: "sell",
      amount: 2.5,
      price: 3200,
      total: 8000,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      status: "completed",
    },
    {
      id: "3",
      symbol: "SOL",
      type: "buy",
      amount: 50,
      price: 120,
      total: 6000,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: "completed",
    },
    {
      id: "4",
      symbol: "ADA",
      type: "sell",
      amount: 1000,
      price: 0.45,
      total: 450,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: "completed",
    },
    {
      id: "5",
      symbol: "DOT",
      type: "buy",
      amount: 100,
      price: 8.5,
      total: 850,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: "completed",
    },
  ];

  const getFilteredHistory = () => {
    if (activeFilter === "all") return tradingHistory;
    return tradingHistory.filter((trade) => trade.type === activeFilter);
  };

  const formatDate = (date: Date) => {
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

  const TradeItem = ({ trade }: any) => (
    <View style={styles.tradeItem}>
      <View style={styles.tradeHeader}>
        <View style={styles.symbolContainer}>
          <Text style={styles.symbol}>{trade.symbol}</Text>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: trade.type === "buy" ? "#10BA68" : "#F9335D" },
            ]}>
            <Text style={styles.typeText}>{trade.type.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.timestamp}>{formatDate(trade.timestamp)}</Text>
      </View>

      <View style={styles.tradeDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={styles.detailValue}>{trade.amount}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price:</Text>
          <Text style={styles.detailValue}>
            ${trade.price.toLocaleString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={styles.detailValue}>
            ${trade.total.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                trade.status === "completed" ? "#10BA68" : "#FF9500",
            },
          ]}>
          <Text style={styles.statusText}>{trade.status}</Text>
        </View>
      </View>
    </View>
  );

  const FilterButton = ({ title, value, isActive }: any) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.activeFilterButton]}
      onPress={() => setActiveFilter(value)}>
      <Text
        style={[
          styles.filterButtonText,
          isActive && styles.activeFilterButtonText,
        ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const TimeButton = ({ title, value, isActive }: any) => (
    <TouchableOpacity
      style={[styles.timeButton, isActive && styles.activeTimeButton]}
      onPress={() => setTimePeriod(value)}>
      <Text
        style={[
          styles.timeButtonText,
          isActive && styles.activeTimeButtonText,
        ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

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
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Trades</Text>
          <Text style={styles.statValue}>{getFilteredHistory().length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Buy Orders</Text>
          <Text style={styles.statValue}>
            {getFilteredHistory().filter((t) => t.type === "buy").length}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Sell Orders</Text>
          <Text style={styles.statValue}>
            {getFilteredHistory().filter((t) => t.type === "sell").length}
          </Text>
        </View>
      </View>

      {/* Trading History List */}
      <FlatList
        data={getFilteredHistory()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TradeItem trade={item} />}
        style={styles.historyList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.historyListContent}
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
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1A1D2F",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  activeFilterButton: {
    backgroundColor: "#6674CC",
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
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  statLabel: {
    fontSize: 12,
    color: "#9DA3B4",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
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
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  tradeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  symbolContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  symbol: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  timestamp: {
    fontSize: 12,
    color: "#9DA3B4",
  },
  tradeDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: "#9DA3B4",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
});

export default TradingHistoryModal;
