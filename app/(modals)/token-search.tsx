import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import colors from "@/styles/colors";

const TokenSearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 92556.00, change: -1.07 },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 1772.19, change: -0.29 },
    { id: 'solana', name: 'Solana', symbol: 'SOL', price: 148.52, change: -1.60 },
  ]);

  const popularTokens = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 92556.00, change: -1.07, marketCap: 1.83e12 },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 1772.19, change: -0.29, marketCap: 2.13e11 },
    { id: 'binancecoin', name: 'BNB', symbol: 'BNB', price: 605.84, change: -1.85, marketCap: 8.79e10 },
    { id: 'solana', name: 'Solana', symbol: 'SOL', price: 148.52, change: -1.60, marketCap: 7.04e10 },
    { id: 'xrp', name: 'XRP', symbol: 'XRP', price: 2.17, change: -3.00, marketCap: 1.24e11 },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: 1.08, change: 2.45, marketCap: 3.78e10 },
    { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', price: 0.38, change: 5.2, marketCap: 5.59e10 },
    { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', price: 42.35, change: -2.1, marketCap: 1.64e10 },
  ];

  useEffect(() => {
    if (searchQuery.trim()) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const filtered = popularTokens.filter(token =>
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered);
        setLoading(false);
      }, 500);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleTokenPress = (token: any) => {
    // Add to recent searches
    setRecentSearches(prev => {
      const existing = prev.find(t => t.id === token.id);
      if (!existing) {
        return [token, ...prev.slice(0, 4)];
      }
      return prev;
    });

    // Navigate to token detail or buy screen
    router.push(`/(modals)/token-detail?id=${token.id}`);
  };

  const TokenItem = ({ item, showMarketCap = false }: any) => (
    <TouchableOpacity
      style={styles.tokenItem}
      onPress={() => handleTokenPress(item)}
    >
      <View style={styles.tokenLeft}>
        <View style={styles.tokenIcon}>
          <Text style={styles.tokenSymbol}>{item.symbol.charAt(0)}</Text>
        </View>
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenName}>{item.name}</Text>
          <Text style={styles.tokenSymbolText}>{item.symbol}</Text>
          {showMarketCap && (
            <Text style={styles.marketCap}>
              ${(item.marketCap / 1e9).toFixed(1)}B
            </Text>
          )}
        </View>
      </View>
      <View style={styles.tokenRight}>
        <Text style={styles.tokenPrice}>${item.price.toLocaleString()}</Text>
        <Text style={[
          styles.tokenChange,
          { color: item.change >= 0 ? colors.action.buy : colors.action.sell }
        ]}>
          {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131523" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Search Tokens</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search cryptocurrencies..."
            placeholderTextColor={colors.text.tertiary}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.ui.highlight} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={searchQuery.trim() ? searchResults : popularTokens}
          renderItem={({ item }) => <TokenItem item={item} showMarketCap={!searchQuery.trim()} />}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
              {searchQuery.trim() ? (
                <Text style={styles.sectionTitle}>
                  {searchResults.length} results for "{searchQuery}"
                </Text>
              ) : (
                <>
                  {recentSearches.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Recent Searches</Text>
                      {recentSearches.map((token) => (
                        <TokenItem key={token.id} item={token} />
                      ))}
                    </View>
                  )}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Popular Tokens</Text>
                  </View>
                </>
              )}
            </View>
          )}
          ListEmptyComponent={() => (
            searchQuery.trim() ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>No tokens found</Text>
                <Text style={styles.emptySubtext}>Try searching with different keywords</Text>
              </View>
            ) : null
          )}
        />
      )}
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
  placeholder: {
    width: 24,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  listHeader: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tokenLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ui.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  tokenSymbolText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  marketCap: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  tokenRight: {
    alignItems: 'flex-end',
  },
  tokenPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  tokenChange: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
  },
});

export default TokenSearchScreen;