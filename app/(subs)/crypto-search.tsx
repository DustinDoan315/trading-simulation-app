import colors from '@/styles/colors';
import CryptoListItem from '@/components/crypto/CryptoListItem';
import React, { useEffect, useRef, useState } from 'react';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getCryptoIdFromSymbol } from '@/utils/cryptoMapping';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '@/utils/logger';
import { navigateToCryptoChart } from '@/utils/navigation';
import { NON_TRADEABLE_TOKENS } from '@/utils/constant';
import { RootState, useAppDispatch, useAppSelector } from '../../store';
import { router } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import {
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CryptoCurrency,
  searchCryptocurrencies,
} from "@/services/CryptoService";
// If you need shared shimmer headers, import from '@/components/shimmer/ShimmerHeaders'
import {
  addSearchHistory,
  clearSearchHistory,
  removeSearchHistoryItem,
} from "@/features/searchHistorySlice";


const { width } = Dimensions.get("window");

interface SearchHistoryItem {
  id: string;
  text: string;
}

export default function CryptoSearch() {
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<CryptoCurrency[]>([]);
  const [suggestions, setSuggestions] = useState<CryptoCurrency[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const dispatch = useAppDispatch();
  const searchHistory = useAppSelector(
    (state: RootState) => state.searchHistory.items
  );
  const inputRef = useRef<TextInput>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const searchBarScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    setRecentSearches(searchHistory.slice(0, 5));
  }, [searchHistory]);

  const handleClearHistory = () => {
    dispatch(clearSearchHistory());
  };

  const { t } = useLanguage();

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      setIsSearching(true);
      setSearchError("");
      setShowSuggestions(false);

      Animated.sequence([
        Animated.timing(searchBarScale, {
          toValue: 0.98,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(searchBarScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      const normalizedQuery = query.toUpperCase().trim();
      const cryptoId = getCryptoIdFromSymbol(normalizedQuery);

      const searchQuery = cryptoId || query;
      const results = await searchCryptocurrencies(searchQuery);
      setSearchResults(results);

      if (results.length > 0) {
        const newItem = {
          id: Date.now().toString(),
          text: query,
          timestamp: Date.now(),
        };
        dispatch(addSearchHistory(newItem));
      } else {
        setSearchError(t("cryptoSearch.noResults"));
      }
    } catch (error) {
      logger.error("Search failed", "CryptoSearch", error);
      setSearchResults([]);
      setSearchError(t("cryptoSearch.searchFailed"));
    } finally {
      setIsSearching(false);
    }
  };

  const handleHistoryItemPress = (item: SearchHistoryItem) => {
    setSearchText(item.text);
    handleSearch(item.text);
  };

  const handleCancel = () => {
    setSearchText("");
    inputRef.current?.blur();
  };

  const handleGoBack = () => {
    router.back();
  };

  const goToChart = (crypto: any) => {
    const cryptoSymbol = crypto.symbol?.toUpperCase();
    if (cryptoSymbol && NON_TRADEABLE_TOKENS.includes(cryptoSymbol as any)) {
      return;
    }

    navigateToCryptoChart(crypto);
  };

  const renderPopularCryptos = () => {
    const popularCryptos = [
      {
        symbol: "BTC",
        name: "Bitcoin",
        icon: "🟡",
        gradient: ["#F7931A", "#FFD700"] as const,
      },
      {
        symbol: "ETH",
        name: "Ethereum",
        icon: "🔷",
        gradient: ["#627EEA", "#4ECDC4"] as const,
      },
      {
        symbol: "BNB",
        name: "BNB",
        icon: "🟠",
        gradient: ["#F3BA2F", "#FF6B6B"] as const,
      },
      {
        symbol: "AVAX",
        name: "Avalanche",
        icon: "🔴",
        gradient: ["#E84142", "#FF8E53"] as const,
      },
    ];

    return (
      <View style={styles.popularContainer}>
        <Text style={styles.sectionTitle}>
          {t("cryptoSearch.popularCryptos")}
        </Text>
        <View style={styles.popularGrid}>
          {popularCryptos.map((crypto) => (
            <TouchableOpacity
              key={crypto.symbol}
              style={styles.popularChipContainer}
              onPress={() => handleSearch(crypto.symbol)}>
              <LinearGradient
                colors={crypto.gradient}
                style={styles.popularChip}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <Text style={styles.popularIcon}>{crypto.icon}</Text>
                <Text style={styles.popularSymbol}>{crypto.symbol}</Text>
                <Text style={styles.popularName}>{crypto.name}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSearchTips = () => (
    <LinearGradient
      colors={["rgba(255, 215, 0, 0.1)", "rgba(255, 215, 0, 0.05)"]}
      style={styles.tipsContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}>
      <View style={styles.tipsHeader}>
        <MaterialIcons name="lightbulb-outline" size={20} color="#FFD700" />
        <Text style={styles.tipsTitle}>{t("cryptoSearch.searchTips")}</Text>
      </View>
      <View style={styles.tipsList}>
        <Text style={styles.tipText}>• {t("cryptoSearch.tip1")}</Text>
        <Text style={styles.tipText}>• {t("cryptoSearch.tip2")}</Text>
        <Text style={styles.tipText}>• {t("cryptoSearch.tip3")}</Text>
      </View>
    </LinearGradient>
  );

  // Shimmer for search bar, chips, and list items
  const ShimmerSearchBar = (
    <Animated.View
      style={[
        styles.searchContainer,
        {
          transform: [{ scale: searchBarScale }],
        },
      ]}>
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
        style={styles.searchBar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}>
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={{ width: 22, height: 22, borderRadius: 11, marginRight: 10 }}
        />
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={{ flex: 1, height: 20, borderRadius: 8 }}
        />
      </LinearGradient>
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={{ width: 60, height: 32, borderRadius: 8, marginLeft: 10 }}
      />
    </Animated.View>
  );

  const ShimmerChip = () => (
    <ShimmerPlaceHolder
      LinearGradient={LinearGradient}
      style={{
        width: width / 2.25,
        height: 48,
        borderRadius: 10,
        marginBottom: 8,
      }}
    />
  );

  const ShimmerListItem = () => (
    <View
      style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }}
      />
      <View style={{ flex: 1 }}>
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={{ width: 100, height: 16, borderRadius: 8, marginBottom: 4 }}
        />
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={{ width: 60, height: 12, borderRadius: 6 }}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with Back Button */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("cryptoSearch.title")}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </Animated.View>

      {/* Search Bar */}
      {isSearching ? (
        ShimmerSearchBar
      ) : (
        <Animated.View
          style={[
            styles.searchContainer,
            {
              transform: [{ scale: searchBarScale }],
            },
          ]}>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
            style={styles.searchBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}>
            <Ionicons
              name="search"
              size={22}
              color="#777"
              style={styles.searchIcon}
            />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text.toUpperCase());
                if (text.length >= 3) {
                  searchCryptocurrencies(text, 10).then((results) => {
                    setSuggestions(results);
                    setShowSuggestions(true);
                  });
                } else {
                  setShowSuggestions(false);
                }
              }}
              placeholder={t("cryptoSearch.searchPlaceholder")}
              placeholderTextColor="#777"
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={() => handleSearch(searchText)}
            />
            {isSearching && (
              <View style={styles.loadingIndicator}>
                <Text style={styles.loadingText}>...</Text>
              </View>
            )}
          </LinearGradient>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>{t("cryptoSearch.cancel")}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {isSearching ? (
          <>
            <View style={styles.popularContainer}>
              <ShimmerChip />
              <ShimmerChip />
            </View>
            <View style={{ marginTop: 20 }}>
              {[1, 2, 3, 4].map((_, idx) => (
                <ShimmerListItem key={idx} />
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Popular Cryptocurrencies */}
            {!searchText &&
              searchResults.length === 0 &&
              renderPopularCryptos()}

            {/* Search History Section */}
            {searchHistory.length > 0 &&
              !searchText &&
              searchResults.length === 0 && (
                <View style={styles.historyContainer}>
                  <View style={styles.historyHeader}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="time-outline" size={20} color="#FFD700" />
                      <Text style={styles.sectionTitle}>
                        {t("cryptoSearch.searchHistory")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleClearHistory}
                      style={styles.clearButton}>
                      <Feather name="trash-2" size={18} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipsContainer}>
                    {recentSearches.map((item) => (
                      <View key={item.id} style={styles.historyChipContainer}>
                        <TouchableOpacity
                          style={styles.historyChip}
                          onPress={() => handleHistoryItemPress(item)}>
                          <Text style={styles.chipText}>{item.text}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteChipButton}
                          onPress={() =>
                            dispatch(removeSearchHistoryItem(item.id))
                          }>
                          <Ionicons name="close" size={14} color="#777" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

            {/* Search Tips */}
            {!searchText && searchResults.length === 0 && renderSearchTips()}

            {/* Suggestions Section */}
            {showSuggestions &&
              searchResults.length == 0 &&
              suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="flash-outline" size={20} color="#4ECDC4" />
                    <Text style={styles.sectionTitle}>
                      {t("cryptoSearch.suggestions")}
                    </Text>
                  </View>
                  <View style={styles.suggestionsList}>
                    {suggestions.map((crypto) => {
                      // Check if the crypto is a non-tradeable token (like USDT)
                      const cryptoSymbol = crypto.symbol?.toUpperCase();
                      const isNonTradeable =
                        cryptoSymbol &&
                        NON_TRADEABLE_TOKENS.includes(cryptoSymbol as any);

                      return (
                        <CryptoListItem
                          key={crypto.id}
                          crypto={crypto}
                          onPress={() => {
                            if (!isNonTradeable) {
                              setSearchText(crypto.symbol);
                              handleSearch(crypto.symbol);
                            }
                            // Do nothing for non-tradeable tokens
                          }}
                        />
                      );
                    })}
                  </View>
                </View>
              )}

            {/* Search Results Section */}
            {searchResults.length > 0 && (
              <View style={styles.resultsContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#4ECDC4"
                  />
                  <Text style={styles.sectionTitle}>
                    {t("cryptoSearch.results")}
                  </Text>
                  <Text style={styles.resultsCount}>
                    ({searchResults.length})
                  </Text>
                </View>
                <View style={styles.resultsList}>
                  {searchResults.map((crypto) => (
                    <CryptoListItem
                      key={crypto.id}
                      crypto={crypto}
                      onPress={() => {
                        goToChart(crypto);
                      }}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Error Message */}
            {searchError && (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={24}
                  color="#FF6B6B"
                />
                <Text style={styles.errorText}>{searchError}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.background.primary,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSpacer: {
    width: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: colors.background.primary,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 16,
    paddingVertical: 8,
  },
  loadingIndicator: {
    marginLeft: 10,
  },
  loadingText: {
    color: "#4ECDC4",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginLeft: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  popularContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
    marginVertical: 10,
  },
  popularGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  popularChipContainer: {
    width: width / 2.25,
    marginBottom: 8,
    borderRadius: 10,
    overflow: "hidden",
  },
  popularChip: {
    padding: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  popularIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  popularSymbol: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  popularName: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
  },
  historyContainer: {
    marginBottom: 25,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  clearButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  chipsContainer: {
    flexDirection: "row",
  },
  historyChipContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  historyChip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  deleteChipButton: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  chipText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  tipsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipsTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  tipsList: {
    gap: 6,
  },
  tipText: {
    color: "#CCC",
    fontSize: 14,
    lineHeight: 20,
  },
  resultsContainer: {
    marginBottom: 25,
  },
  resultsCount: {
    color: "#4ECDC4",
    fontSize: 14,
    marginLeft: 8,
  },
  resultsList: {
    gap: 8,
  },
  suggestionsContainer: {
    marginBottom: 25,
  },
  suggestionsList: {
    gap: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    marginLeft: 8,
    textAlign: "center",
  },
});
