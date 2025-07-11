import colors from '@/styles/colors';
import React, { useEffect, useState } from 'react';
import { fetchTransactions } from '@/features/userSlice';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store';
import { useUser } from '@/context/UserContext';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


const TransactionHistoryScreen = () => {
  const dispatch = useAppDispatch();
  const { user } = useUser();
  const { transactions, loading } = useAppSelector((state) => state.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "buy" | "sell">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "pnl">("date");

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchTransactions({ userId: user.id, limit: 100 }));
    }
  }, [dispatch, user?.id]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      !searchQuery ||
      tx.symbol.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === "all" || tx.type.toLowerCase() === filterType;

    return matchesSearch && matchesType;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const TransactionItem = ({ item }: any) => {
    const price = parseFloat(item.price);
    const quantity = parseFloat(item.quantity);
    const totalValue = parseFloat(item.total_value);
    const fee = parseFloat(item.fee || "0");

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.transactionType,
              {
                backgroundColor:
                  item.type === "BUY"
                    ? colors.action.buyLight
                    : colors.action.sellLight,
              },
            ]}>
            <Ionicons
              name={item.type === "BUY" ? "arrow-down" : "arrow-up"}
              size={16}
              color={
                item.type === "BUY" ? colors.action.buy : colors.action.sell
              }
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>
              {item.type === "BUY" ? "Bought" : "Sold"} {item.symbol}
            </Text>
            <Text style={styles.transactionSubtitle}>
              {quantity.toFixed(8)} {item.symbol} at ${price.toLocaleString()}
            </Text>
            <Text style={styles.transactionDate}>
              {formatDate(item.timestamp)}
            </Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={styles.transactionTotal}>
            ${totalValue.toLocaleString()}
          </Text>
          {fee > 0 && (
            <Text style={styles.feeText}>Fee: ${fee.toFixed(2)}</Text>
          )}
        </View>
      </View>
    );
  };

  const FilterButton = ({ type, label }: any) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterType === type && styles.activeFilterButton,
      ]}
      onPress={() => setFilterType(type)}>
      <Text
        style={[
          styles.filterButtonText,
          filterType === type && styles.activeFilterButtonText,
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const getTotalValue = () => {
    return filteredTransactions.reduce(
      (sum, tx) => sum + parseFloat(tx.total_value),
      0
    );
  };

  const getTotalFees = () => {
    return filteredTransactions.reduce(
      (sum, tx) => sum + parseFloat(tx.fee || "0"),
      0
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#131523" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.ui.highlight} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131523" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction History</Text>
        <TouchableOpacity>
          <Ionicons name="filter" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search transactions..."
            placeholderTextColor={colors.text.tertiary}
          />
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FilterButton type="all" label="All" />
        <FilterButton type="buy" label="Buy" />
        <FilterButton type="sell" label="Sell" />
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={styles.summaryValue}>
            ${getTotalValue().toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Fees</Text>
          <Text style={styles.summaryValue}>${getTotalFees().toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={styles.summaryValue}>{filteredTransactions.length}</Text>
        </View>
      </View>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        renderItem={TransactionItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="receipt-outline"
              size={48}
              color={colors.text.tertiary}
            />
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try different search terms"
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
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  activeFilterButton: {
    backgroundColor: colors.ui.highlight,
    borderColor: colors.ui.highlight,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  activeFilterButtonText: {
    color: colors.text.primary,
  },
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  transactionType: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  transactionSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  pnlContainer: {
    alignItems: "flex-end",
    marginTop: 2,
  },
  pnlText: {
    fontSize: 12,
    fontWeight: "500",
  },
  pnlPercent: {
    fontSize: 10,
    fontWeight: "400",
  },
  feeText: {
    fontSize: 10,
    color: colors.text.secondary,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.primary,
    marginTop: 16,
  },
});

export default TransactionHistoryScreen;
