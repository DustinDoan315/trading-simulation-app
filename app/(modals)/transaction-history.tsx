import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  FlatList,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import colors from "@/styles/colors";

const TransactionHistoryScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'pnl'>('date');

  const transactions = [
    {
      id: '1',
      type: 'buy',
      symbol: 'BTC',
      name: 'Bitcoin',
      amount: 0.5,
      price: 91200,
      total: 45600,
      date: '2024-01-15T10:30:00Z',
      pnl: 1356,
      pnlPercent: 2.97,
    },
    {
      id: '2',
      type: 'sell',
      symbol: 'ETH',
      name: 'Ethereum',
      amount: 10,
      price: 1850,
      total: 18500,
      date: '2024-01-14T14:45:00Z',
      pnl: -250,
      pnlPercent: -1.35,
    },
    {
      id: '3',
      type: 'buy',
      symbol: 'SOL',
      name: 'Solana',
      amount: 100,
      price: 145,
      total: 14500,
      date: '2024-01-13T09:15:00Z',
      pnl: 352,
      pnlPercent: 2.43,
    },
    {
      id: '4',
      type: 'sell',
      symbol: 'BNB',
      name: 'BNB',
      amount: 25,
      price: 620,
      total: 15500,
      date: '2024-01-12T16:20:00Z',
      pnl: -1150,
      pnlPercent: -7.42,
    },
    {
      id: '5',
      type: 'buy',
      symbol: 'ADA',
      name: 'Cardano',
      amount: 1000,
      price: 1.05,
      total: 1050,
      date: '2024-01-11T11:30:00Z',
      pnl: 30,
      pnlPercent: 2.86,
    },
  ];

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = !searchQuery || 
      tx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || tx.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const TransactionItem = ({ item }: any) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[
          styles.transactionType,
          { backgroundColor: item.type === 'buy' ? colors.action.buyLight : colors.action.sellLight }
        ]}>
          <Ionicons 
            name={item.type === 'buy' ? 'arrow-down' : 'arrow-up'}
            size={16}
            color={item.type === 'buy' ? colors.action.buy : colors.action.sell}
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>
            {item.type === 'buy' ? 'Bought' : 'Sold'} {item.symbol}
          </Text>
          <Text style={styles.transactionSubtitle}>
            {item.amount} {item.symbol} at ${item.price.toLocaleString()}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.date)}
          </Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={styles.transactionTotal}>
          ${item.total.toLocaleString()}
        </Text>
        <View style={styles.pnlContainer}>
          <Text style={[
            styles.pnlText,
            { color: item.pnl >= 0 ? colors.action.buy : colors.action.sell }
          ]}>
            {item.pnl >= 0 ? '+' : ''}${Math.abs(item.pnl).toFixed(0)}
          </Text>
          <Text style={[
            styles.pnlPercent,
            { color: item.pnl >= 0 ? colors.action.buy : colors.action.sell }
          ]}>
            ({item.pnl >= 0 ? '+' : ''}{item.pnlPercent.toFixed(1)}%)
          </Text>
        </View>
      </View>
    </View>
  );

  const FilterButton = ({ type, label }: any) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterType === type && styles.activeFilterButton
      ]}
      onPress={() => setFilterType(type)}
    >
      <Text style={[
        styles.filterButtonText,
        filterType === type && styles.activeFilterButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const getTotalPnL = () => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.pnl, 0);
  };

  const getTotalValue = () => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
  };

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
          <Text style={styles.summaryLabel}>Total P&L</Text>
          <Text style={[
            styles.summaryValue,
            { color: getTotalPnL() >= 0 ? colors.action.buy : colors.action.sell }
          ]}>
            {getTotalPnL() >= 0 ? '+' : ''}${getTotalPnL().toFixed(0)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={styles.summaryValue}>
            {filteredTransactions.length}
          </Text>
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
            <Ionicons name="receipt-outline" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try different search terms' : 'Start trading to see your history'}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
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
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: colors.text.primary,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
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
    fontWeight: '600',
    color: colors.text.primary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionType: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
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
    alignItems: 'flex-end',
  },
  transactionTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  pnlContainer: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  pnlText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pnlPercent: {
    fontSize: 10,
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default TransactionHistoryScreen;