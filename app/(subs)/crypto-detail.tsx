import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CryptoCurrency, getMarketData } from "@/services/CryptoService";
import {
  formatCurrency,
  formatPercentage,
  formatLargeNumber,
} from "@/utils/formatters";
import { router, useLocalSearchParams } from "expo-router";

// Mock price history data - in a real app, this would come from an API
const MOCK_PRICE_HISTORY = [
  48000, 47500, 47800, 48200, 49000, 48500, 48800, 50000, 51000, 50500, 49800,
  50200, 50800, 50200, 49800, 49500, 49200, 49800, 50500, 51200, 52000,
];

const CryptoDetailScreen: React.FC = () => {
  const { id, name } = useLocalSearchParams();
  console.log({ id, name });

  const [cryptoData, setCryptoData] = useState<CryptoCurrency | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<"1d" | "1w" | "1m" | "3m" | "1y">(
    "1d"
  );
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "trade" | "orders"
  >("overview");

  const fetchCryptoData = useCallback(async () => {
    try {
      setLoading(true);
      const marketData = await getMarketData();
      const crypto = marketData.find((c) => c.id === id);

      if (crypto) {
        setCryptoData(crypto);
      } else {
        // Handle not found case
        console.error(`Cryptocurrency with ID ${id} not found`);
      }
    } catch (error) {
      console.error("Error fetching crypto details:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCryptoData();
  }, [fetchCryptoData]);

  // Chart dimensions
  const screenWidth = Dimensions.get("window").width;
  const chartHeight = 200;
  const chartWidth = screenWidth - 32; // Accounting for padding

  // Scaling functions for the chart
  const getX = (index: number) =>
    (index / (MOCK_PRICE_HISTORY.length - 1)) * chartWidth;
  const getY = (price: number) => {
    const maxPrice = Math.max(...MOCK_PRICE_HISTORY);
    const minPrice = Math.min(...MOCK_PRICE_HISTORY);
    const range = maxPrice - minPrice;
    return chartHeight - ((price - minPrice) / range) * chartHeight;
  };

  // Generate SVG path for the price chart
  const generateChartPath = () => {
    return MOCK_PRICE_HISTORY.map((price, index) => {
      const x = getX(index);
      const y = getY(price);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  const handleTimeRangeChange = (range: "1d" | "1w" | "1m" | "3m" | "1y") => {
    setTimeRange(range);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading cryptocurrency data...</Text>
      </SafeAreaView>
    );
  }

  if (!cryptoData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>Cryptocurrency not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isPriceDown = cryptoData.price_change_percentage_24h < 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Image source={{ uri: cryptoData.image }} style={styles.cryptoIcon} />
          <Text style={styles.titleText}>{cryptoData.name}</Text>
        </View>
        <TouchableOpacity style={styles.starButton}>
          <Ionicons name="star-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Price Section */}
        <View style={styles.priceSection}>
          <Text style={styles.priceText}>
            {formatCurrency(cryptoData.current_price)}
          </Text>
          <View
            style={[
              styles.changeContainer,
              isPriceDown ? styles.priceDown : styles.priceUp,
            ]}>
            <Ionicons
              name={isPriceDown ? "arrow-down" : "arrow-up"}
              size={16}
              color="white"
            />
            <Text style={styles.changeText}>
              {formatPercentage(cryptoData.price_change_percentage_24h)}
            </Text>
          </View>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeSelector}>
          {["1d", "1w", "1m", "3m", "1y"].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.selectedTimeRange,
              ]}
              onPress={() => handleTimeRangeChange(range as any)}>
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.selectedTimeRangeText,
                ]}>
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price Chart */}
        <View style={styles.chartContainer}>
          {/* <svg height={chartHeight} width={chartWidth}>
            <path
              d={generateChartPath()}
              stroke={isPriceDown ? "#e74c3c" : "#2ecc71"}
              strokeWidth="2"
              fill="none"
            />
          </svg> */}
        </View>

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          {["overview", "trade", "orders"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                selectedTab === tab && styles.selectedTab,
              ]}
              onPress={() => setSelectedTab(tab as any)}>
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.selectedTabText,
                ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {selectedTab === "overview" && (
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Market Cap</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(cryptoData.market_cap)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Volume (24h)</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(cryptoData.total_volume)}
                </Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Circulating Supply</Text>
                <Text style={styles.statValue}>
                  {formatLargeNumber(cryptoData.circulating_supply)}{" "}
                  {cryptoData.symbol.toUpperCase()}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Max Supply</Text>
                <Text style={styles.statValue}>
                  {cryptoData.max_supply
                    ? `${formatLargeNumber(
                        cryptoData.max_supply
                      )} ${cryptoData.symbol.toUpperCase()}`
                    : "Unlimited"}
                </Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>All-Time High</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(cryptoData.ath)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>ATH Change</Text>
                <Text
                  style={[
                    styles.statValue,
                    cryptoData.ath_change_percentage < 0
                      ? styles.textRed
                      : styles.textGreen,
                  ]}>
                  {formatPercentage(cryptoData.ath_change_percentage)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {selectedTab === "trade" && (
          <View style={styles.tradeContainer}>
            <View style={styles.tradeTabs}>
              <TouchableOpacity
                style={[styles.tradeTab, styles.activeTradeTab]}>
                <Text style={styles.activeTradeTabText}>Buy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tradeTab}>
                <Text style={styles.tradeTabText}>Sell</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tradeForm}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Amount</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputText}>1.0</Text>
                  <Text style={styles.inputCurrency}>
                    {cryptoData.symbol.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Price</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputText}>
                    {formatCurrency(cryptoData.current_price, "")}
                  </Text>
                  <Text style={styles.inputCurrency}>USD</Text>
                </View>
              </View>

              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(cryptoData.current_price)}
                </Text>
              </View>

              <TouchableOpacity style={styles.buyButton}>
                <Text style={styles.buyButtonText}>
                  Buy {cryptoData.symbol.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {selectedTab === "orders" && (
          <View style={styles.ordersContainer}>
            <Text style={styles.noOrdersText}>No active orders</Text>
            <TouchableOpacity style={styles.createOrderButton}>
              <Text style={styles.createOrderButtonText}>Create New Order</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "white",
    fontSize: 16,
    marginTop: 12,
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#3498db",
    fontSize: 14,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cryptoIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  titleText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  starButton: {
    padding: 8,
  },
  priceSection: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  priceText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priceUp: {
    backgroundColor: "#2ecc71",
  },
  priceDown: {
    backgroundColor: "#e74c3c",
  },
  changeText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 4,
  },
  timeRangeSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 20,
    paddingHorizontal: 16,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectedTimeRange: {
    backgroundColor: "#333",
  },
  timeRangeText: {
    color: "#999",
    fontSize: 12,
  },
  selectedTimeRangeText: {
    color: "white",
    fontWeight: "bold",
  },
  chartContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
    height: 200,
    justifyContent: "center",
  },
  tabSelector: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    marginTop: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  selectedTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#3498db",
  },
  tabText: {
    color: "#999",
    fontSize: 14,
  },
  selectedTabText: {
    color: "white",
    fontWeight: "bold",
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  statRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: "#999",
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  textGreen: {
    color: "#2ecc71",
  },
  textRed: {
    color: "#e74c3c",
  },
  tradeContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  tradeTabs: {
    flexDirection: "row",
    backgroundColor: "#222",
    borderRadius: 8,
    marginBottom: 20,
  },
  tradeTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTradeTab: {
    backgroundColor: "#3498db",
    borderRadius: 8,
  },
  tradeTabText: {
    color: "#999",
    fontWeight: "bold",
  },
  activeTradeTabText: {
    color: "white",
    fontWeight: "bold",
  },
  tradeForm: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#999",
    fontSize: 12,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  inputCurrency: {
    color: "#999",
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 16,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  totalLabel: {
    color: "#999",
    fontSize: 16,
  },
  totalValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  buyButton: {
    backgroundColor: "#2ecc71",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  buyButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  ordersContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 40,
  },
  noOrdersText: {
    color: "#999",
    fontSize: 14,
    marginBottom: 20,
  },
  createOrderButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  createOrderButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default CryptoDetailScreen;
