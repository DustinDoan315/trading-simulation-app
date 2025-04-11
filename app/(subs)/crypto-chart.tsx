import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform,
  ScrollView,
  PanResponder,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { chartHtml } from "@/utils/chartHtml";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";

type TimeframeOption = "15m" | "1h" | "4h" | "1d" | "3m";
interface OrderBookEntry {
  price: string;
  amount: string;
}

const CryptoChartScreen = ({ navigation }: { navigation: any }) => {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("3m");
  const [wsConnected, setWsConnected] = useState(false);
  const [currentPrice, setCurrentPrice] = useState("83,034.1");
  const [priceChange, setPriceChange] = useState("+0.57%");
  const [selectedTab, setSelectedTab] = useState<"buy" | "sell">("sell");
  const [showOrderOptions, setShowOrderOptions] = useState(false);
  const [orderType, setOrderType] = useState("Lệnh thị trường");
  const [chartType, setChartType] = useState<"candlestick" | "line">(
    "candlestick"
  );
  const [orderAmount, setOrderAmount] = useState(30);
  const [sliderPosition, setSliderPosition] = useState(30);
  const [showIndicators, setShowIndicators] = useState(false);

  // Interactive order book that updates every few seconds
  const [askOrders, setAskOrders] = useState<OrderBookEntry[]>([
    { price: "83,051.9", amount: "7,88317" },
    { price: "83,051.5", amount: "0,00500" },
    { price: "83,050.0", amount: "9,30944" },
    { price: "83,049.9", amount: "0,00060" },
    { price: "83,049.8", amount: "7,10912" },
  ]);

  const [bidOrders, setBidOrders] = useState<OrderBookEntry[]>([
    { price: "83,049.7", amount: "8,44064" },
    { price: "83,049.2", amount: "0,02990" },
    { price: "83,049.1", amount: "8,59518" },
    { price: "83,049.0", amount: "0,01232" },
    { price: "83,048.0", amount: "8,93452" },
  ]);

  // More realistic/interactive order book updates
  useEffect(() => {
    const updateInterval = setInterval(() => {
      // Helper function to simulate price changes with preserved formatting
      const simulatePriceChange = (
        currentPrice: string,
        range: number = 0.2
      ) => {
        // Extract the numeric parts and formatting
        const numericPrice = parseFloat(currentPrice.replace(",", "."));
        const variation = (Math.random() * 2 - 1) * range;
        const newPrice = numericPrice + variation;

        // Determine the number of decimal places in the original price
        const decimalPlaces = 2;
        const randomDecimal = Math.floor(Math.random() * 100) / 100;

        // Format to maintain original decimal precision
        const formattedPrice =
          newPrice.toFixed(decimalPlaces).replace(".", ",") + randomDecimal;
        //0.22 make it random

        return formattedPrice;
      };

      // Update Ask Orders
      const newAskOrders = askOrders.map((order) => ({
        price: simulatePriceChange(order.price),
        amount: order.amount,
      }));
      setAskOrders(newAskOrders);

      // Update Bid Orders
      const newBidOrders = bidOrders.map((order) => ({
        price: simulatePriceChange(order.price, 0.1),
        amount: order.amount,
      }));
      setBidOrders(newBidOrders);
    }, 3000);

    return () => clearInterval(updateInterval);
  }, [askOrders, bidOrders]);
  // Fetch historical data from Binance REST API
  const fetchHistoricalData = async (tf: TimeframeOption) => {
    try {
      setLoading(true);
      const apiTimeframe = tf === "15m" ? "15m" : tf; // Map UI timeframes to API timeframes
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${apiTimeframe}&limit=100`
      );
      const data = await response.json();
      const candles = data.map((kline: any) => ({
        timestamp: kline[0], // Open time
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
      }));
      console.log(`Fetched ${tf} historical data:`, candles.length, "candles");
      if (webViewRef.current && isReady) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: "setData",
            candles,
            chartType: chartType,
          })
        );
      }
      setLoading(false);
    } catch (e: any) {
      setError("Failed to fetch historical data: " + e.message);
      setLoading(false);
    }
  };

  // Connect to Binance WebSocket and fetch historical data
  useEffect(() => {
    // Convert UI timeframe to WebSocket timeframe format
    const wsTimeframe =
      timeframe === "15m"
        ? "15m"
        : timeframe === "1h"
        ? "1h"
        : timeframe === "4h"
        ? "4h"
        : timeframe === "1d"
        ? "1d"
        : "3m";

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/btcusdt@kline_${wsTimeframe}`
    );

    ws.onopen = () => {
      console.log(`Connected to Binance WebSocket (${wsTimeframe})`);
      setWsConnected(true);
      if (isReady) {
        fetchHistoricalData(timeframe);
      }
    };

    ws.onmessage = (event) => {
      if (!isReady || !webViewRef.current) {
        return;
      }
      const data = JSON.parse(event.data);
      const kline = data.k;
      if (kline) {
        const candle = {
          timestamp: kline.t,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
          volume: parseFloat(kline.v),
        };

        // Update current price
        setCurrentPrice(
          Number(kline.c).toLocaleString("en-US", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })
        );

        // Calculate price change (mock data for demo)
        const randomChange = (Math.random() * 2 - 1) * 0.5;
        setPriceChange(
          (randomChange > 0 ? "+" : "") + randomChange.toFixed(2) + "%"
        );

        webViewRef.current.postMessage(
          JSON.stringify({
            type: "addCandle",
            ...candle,
            chartType: chartType,
          })
        );
      }
    };

    ws.onerror = (error) => console.error("WebSocket Error:", error);
    ws.onclose = () => {
      console.log("WebSocket Closed");
      setWsConnected(false);
    };

    return () => ws.close();
  }, [isReady, timeframe, chartType]);

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("WebView message:", data);
      if (data.type === "ready") {
        setIsReady(true);
        setLoading(false);
        if (wsConnected) {
          fetchHistoricalData(timeframe);
        }
      } else if (data.type === "error") {
        setError(data.message);
      } else if (data.type === "priceSelected") {
        // Handle price selection from chart
        setCurrentPrice(
          Number(data.price).toLocaleString("en-US", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })
        );
      } else if (data.type === "chartInteraction") {
        // Handle other user interactions with the chart
        console.log("User interacted with chart:", data.action);
      }
    } catch (e: any) {
      setError("Message parsing error: " + e.message);
    }
  };

  const switchTimeframe = (newTimeframe: TimeframeOption) => {
    if (newTimeframe !== timeframe) {
      setTimeframe(newTimeframe);
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({ type: "clear" }));
        webViewRef.current.injectJavaScript(`
          if (typeof chart !== 'undefined') {
            chart.setTitle({ text: 'BTC/USDT ${newTimeframe} Chart' });
          }
          true;
        `);
        fetchHistoricalData(newTimeframe);
      }
    }
  };

  const toggleChartType = () => {
    const newChartType = chartType === "candlestick" ? "line" : "candlestick";
    setChartType(newChartType);
    if (webViewRef.current && isReady) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "changeChartType",
          chartType: newChartType,
        })
      );
    }
  };

  const toggleIndicators = () => {
    setShowIndicators(!showIndicators);
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "toggleIndicators",
          show: !showIndicators,
        })
      );
    }
  };

  const handleOrderTypeSelection = (type: string) => {
    setOrderType(type);
    setShowOrderOptions(false);
  };

  const getTimeframeButtonStyle = (tf: TimeframeOption) => {
    return [
      styles.timeframeButton,
      timeframe === tf ? styles.timeframeButtonActive : null,
    ];
  };

  const getTimeframeTextStyle = (tf: TimeframeOption) => {
    return [
      styles.timeframeText,
      timeframe === tf ? styles.timeframeTextActive : null,
    ];
  };

  const toggleOrderOptions = () => {
    setShowOrderOptions(!showOrderOptions);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Handle slider interactions
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Calculate percentage based on track width
        const trackWidth = Dimensions.get("window").width - 60; // Adjust based on padding
        let newPosition = Math.max(
          0,
          Math.min(100, ((gestureState.moveX - 30) / trackWidth) * 100)
        );
        setSliderPosition(newPosition);
        setOrderAmount(newPosition);
      },
    })
  ).current;

  const executeOrder = () => {
    const orderAction = selectedTab === "buy" ? "Buy" : "Sell";
    Alert.alert(
      "Confirm Order",
      `${orderAction} BTC at price ${currentPrice}\nAmount: ${orderAmount.toFixed(
        2
      )}%`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: () => {
            Alert.alert(
              "Success",
              `Your ${orderAction.toLowerCase()} order has been placed!`
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: "#000",
        }}>
        {/* Symbol and Price Info */}
        <View style={styles.symbolContainer}>
          <View style={styles.symbolLeft}>
            <Text style={styles.symbolText}>BTC/USDT</Text>
            <TouchableOpacity>
              <Ionicons name="chevron-down" size={16} color="white" />
            </TouchableOpacity>
            <Text
              style={[
                styles.priceChangeText,
                { color: priceChange.includes("+") ? "#4ADE80" : "#FF4D4F" },
              ]}>
              {priceChange}
            </Text>
          </View>
          <View style={styles.symbolRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={toggleChartType}>
              <Feather
                name={
                  chartType === "candlestick" ? "bar-chart-2" : "trending-up"
                }
                size={22}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={toggleIndicators}>
              <Feather name="layers" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="more-vertical" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Timeframes */}
        <View style={styles.timeframeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={getTimeframeButtonStyle("15m")}
              onPress={() => switchTimeframe("15m")}>
              <Text style={getTimeframeTextStyle("15m")}>15m</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={getTimeframeButtonStyle("1h")}
              onPress={() => switchTimeframe("1h")}>
              <Text style={getTimeframeTextStyle("1h")}>1h</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={getTimeframeButtonStyle("4h")}
              onPress={() => switchTimeframe("4h")}>
              <Text style={getTimeframeTextStyle("4h")}>4h</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={getTimeframeButtonStyle("1d")}
              onPress={() => switchTimeframe("1d")}>
              <Text style={getTimeframeTextStyle("1d")}>1d</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={getTimeframeButtonStyle("3m")}
              onPress={() => switchTimeframe("3m")}>
              <Text style={getTimeframeTextStyle("3m")}>3m</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            style={styles.indicatorButton}
            onPress={toggleIndicators}>
            <Text style={styles.indicatorText}>
              {showIndicators ? "Ẩn" : "Hiện"}
            </Text>
            <Ionicons
              name={showIndicators ? "chevron-down" : "chevron-up"}
              size={16}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          {loading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#0078FF" />
              <Text style={styles.loaderText}>Loading chart...</Text>
            </View>
          )}
          {error && <Text style={styles.errorText}>Error: {error}</Text>}

          <WebView
            ref={webViewRef}
            source={{ html: chartHtml }}
            style={styles.webView}
            onMessage={onMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={["*"]}
            onLoadStart={() => console.log("WebView loading started")}
            onLoad={() => {
              console.log("WebView loaded");
              // Set initial chart type as candlestick
              if (webViewRef.current) {
                webViewRef.current.postMessage(
                  JSON.stringify({
                    type: "initialize",
                    chartType: "candlestick",
                  })
                );
              }
            }}
            onError={(syntheticEvent) => {
              const desc = syntheticEvent.nativeEvent.description;
              console.log("WebView error:", desc);
              setError(desc);
            }}
          />

          {/* Chart Controls Overlay */}
          <View style={styles.chartControls}>
            <TouchableOpacity
              style={styles.chartControlButton}
              onPress={() => {
                webViewRef.current?.postMessage(
                  JSON.stringify({ type: "zoomIn" })
                );
              }}>
              <Ionicons name="add" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chartControlButton}
              onPress={() => {
                webViewRef.current?.postMessage(
                  JSON.stringify({ type: "zoomOut" })
                );
              }}>
              <Ionicons name="remove" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Price Indicator */}
        <View style={styles.currentPriceContainer}>
          <View style={styles.currentPriceBox}>
            <Text style={styles.currentPriceText}>{currentPrice}</Text>
            <Text style={styles.timestampText}>01:52</Text>
          </View>
        </View>

        {/* Order Entry Section */}
        <View style={styles.orderContainer}>
          {/* Buy/Sell Tabs - Modified to be horizontal */}
          <View style={styles.tabsContainer}>
            <View style={styles.tabButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  selectedTab === "buy" ? styles.buyTabActive : null,
                ]}
                onPress={() => setSelectedTab("buy")}>
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === "buy" ? styles.buyTabTextActive : null,
                  ]}>
                  Mua
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  selectedTab === "sell" ? styles.sellTabActive : null,
                ]}
                onPress={() => setSelectedTab("sell")}>
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === "sell" ? styles.sellTabTextActive : null,
                  ]}>
                  Bán
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.kyQuyContainer}>
              <Text style={styles.kyQuyText}>Ký quỹ</Text>
              <TouchableOpacity style={styles.toggleSwitch}>
                <View style={styles.toggleSwitchHandle} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Order Type Selector */}
          <TouchableOpacity
            style={styles.orderTypeSelector}
            onPress={toggleOrderOptions}>
            <Text style={styles.orderTypeText}>{orderType}</Text>
            <MaterialIcons
              name="info-outline"
              size={16}
              color="#777"
              style={styles.infoIcon}
            />
            <Ionicons name="chevron-down" size={16} color="#777" />
          </TouchableOpacity>

          {/* Order Options Dropdown */}
          {showOrderOptions && (
            <View style={styles.orderOptionsDropdown}>
              <TouchableOpacity
                style={styles.orderOptionItem}
                onPress={() => handleOrderTypeSelection("Lệnh thị trường")}>
                <Text style={styles.orderOptionText}>Lệnh thị trường</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.orderOptionItem}
                onPress={() => handleOrderTypeSelection("Lệnh giới hạn")}>
                <Text style={styles.orderOptionText}>Lệnh giới hạn</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.orderOptionItem}
                onPress={() => handleOrderTypeSelection("Lệnh dừng")}>
                <Text style={styles.orderOptionText}>Lệnh dừng</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Price Info Row */}
          <View style={styles.priceInfoRow}>
            <View style={styles.priceInfoColumn}>
              <Text style={styles.priceInfoLabel}>Giá (USDT)</Text>
            </View>
            <View style={styles.priceInfoColumn}>
              <Text style={styles.priceInfoLabel}>Số lượng (BTC)</Text>
            </View>
          </View>

          {/* Order Book */}
          <View style={styles.orderBookContainer}>
            {/* Ask Orders (Sell side) */}
            <View style={styles.orderBookColumn}>
              {askOrders.map((order, index) => (
                <TouchableOpacity
                  key={`ask-${index}`}
                  style={styles.orderBookRow}
                  onPress={() => {
                    // Set the current price to the selected ask price
                    setCurrentPrice(order.price);
                    // Update chart to reflect the price
                    if (webViewRef.current) {
                      webViewRef.current.postMessage(
                        JSON.stringify({
                          type: "highlightPrice",
                          price: parseFloat(order.price.replace(",", ".")),
                        })
                      );
                    }
                  }}>
                  <Text style={[styles.orderBookPrice, styles.askPrice]}>
                    {order.price}
                  </Text>
                  <Text style={styles.orderBookAmount}>{order.amount}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Current Price Highlight */}
            <TouchableOpacity
              style={styles.currentPriceRow}
              onPress={() => {
                // Selecting current market price
                if (webViewRef.current) {
                  webViewRef.current.postMessage(
                    JSON.stringify({
                      type: "selectMarketPrice",
                    })
                  );
                }
              }}>
              <Text style={styles.currentOrderPrice}>{currentPrice}</Text>
              <Text style={styles.currentOrderValue}>≈ $83.014,17</Text>
            </TouchableOpacity>

            {/* Bid Orders (Buy side) */}
            <View style={styles.orderBookColumn}>
              {bidOrders.map((order, index) => (
                <TouchableOpacity
                  key={`bid-${index}`}
                  style={styles.orderBookRow}
                  onPress={() => {
                    // Set the current price to the selected bid price
                    setCurrentPrice(order.price);
                    // Update chart to reflect the price
                    if (webViewRef.current) {
                      webViewRef.current.postMessage(
                        JSON.stringify({
                          type: "highlightPrice",
                          price: parseFloat(order.price.replace(",", ".")),
                        })
                      );
                    }
                  }}>
                  <Text style={[styles.orderBookPrice, styles.bidPrice]}>
                    {order.price}
                  </Text>
                  <Text style={styles.orderBookAmount}>{order.amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Order Entry Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack}>
              <View
                style={[styles.sliderFill, { width: `${sliderPosition}%` }]}
              />
              <View
                style={[styles.sliderHandle, { left: `${sliderPosition}%` }]}
                {...panResponder.panHandlers}
              />
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Khả dụng</Text>
              <Text style={styles.sliderValue}>0 BTC</Text>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>
                {selectedTab === "buy" ? "Mua" : "Bán"} tối đa
              </Text>
              <Text style={styles.sliderValue}>{`${orderAmount.toFixed(
                2
              )}%`}</Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              selectedTab === "buy" ? styles.buyButton : styles.sellButton,
            ]}
            onPress={executeOrder}>
            <Text style={styles.actionButtonText}>
              {selectedTab === "buy" ? "Mua" : "Bán"} BTC
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.bottomTabBar}>
          <TouchableOpacity style={styles.bottomTab} activeOpacity={0.7}>
            <Text style={styles.tabLabelActive}>Lệnh (0)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomTab} activeOpacity={0.7}>
            <Text style={styles.tabLabel}>Vị thế (0)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomTab} activeOpacity={0.7}>
            <Text style={styles.tabLabel}>Bot (0)</Text>
          </TouchableOpacity>
        </View>

        {/* Current Trading Session */}
        <View style={styles.tradingSessionBox}>
          <View style={styles.checkboxContainer}>
            <TouchableOpacity style={styles.checkbox}>
              <Ionicons name="checkmark" size={16} color="white" />
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Cặp giao dịch hiện tại</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.clearAllButton}>Huỷ tất cả</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  exitButton: {
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  exitButtonText: {
    color: "white",
    fontSize: 14,
  },
  symbolContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  symbolLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  symbolText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 8,
  },
  priceChangeText: {
    color: "#4ADE80",
    fontSize: 14,
    marginLeft: 8,
  },
  symbolRight: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 16,
    padding: 4,
  },
  timeframeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    paddingBottom: 8,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  timeframeButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#0078FF",
  },
  timeframeText: {
    color: "#777",
    fontSize: 14,
  },
  timeframeTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  indicatorButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicatorText: {
    color: "white",
    fontSize: 14,
    marginRight: 4,
  },
  chartContainer: {
    height: 300,
    backgroundColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    position: "relative",
  },
  webView: {
    backgroundColor: "#000",
    height: 300,
  },
  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 1000,
  },
  loaderText: {
    color: "white",
    marginTop: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    padding: 10,
  },
  chartControls: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 100,
  },
  chartControlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  currentPriceContainer: {
    position: "absolute",
    right: 20,
    top: 270,
    zIndex: 50,
  },
  currentPriceBox: {
    backgroundColor: "rgba(0,0,0,0.7)",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
  },
  currentPriceText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  timestampText: {
    color: "#777",
    fontSize: 12,
  },
  orderContainer: {
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    marginTop: 20,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 5,
  },

  tabButtonsContainer: {
    flexDirection: "row",
    flex: 1,
  },

  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 4,
    marginRight: 8,
  },

  buyTabActive: {
    backgroundColor: "rgba(0, 200, 83, 0.1)",
  },

  sellTabActive: {
    backgroundColor: "rgba(255, 72, 72, 0.1)",
  },

  tabText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },

  buyTabTextActive: {
    color: "#00c853",
    fontWeight: "bold",
  },

  sellTabTextActive: {
    color: "#ff4848",
    fontWeight: "bold",
  },

  kyQuyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  kyQuyText: {
    fontSize: 14,
    color: "#888",
    marginRight: 8,
  },

  toggleSwitch: {
    width: 40,
    height: 22,
    backgroundColor: "#333",
    borderRadius: 11,
    padding: 2,
  },

  toggleSwitchHandle: {
    width: 18,
    height: 18,
    backgroundColor: "#666",
    borderRadius: 9,
  },

  orderTypeSelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  orderTypeText: {
    color: "white",
    fontSize: 14,
    flex: 1,
  },
  infoIcon: {
    marginRight: 8,
  },
  orderOptionsDropdown: {
    position: "absolute",
    top: 85,
    left: 16,
    right: 16,
    backgroundColor: "#111",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#333",
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  orderOptionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  orderOptionText: {
    color: "white",
    fontSize: 14,
  },
  priceInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  priceInfoColumn: {
    flex: 1,
  },
  priceInfoLabel: {
    color: "#777",
    fontSize: 12,
  },
  orderBookContainer: {
    marginTop: 8,
  },
  orderBookColumn: {},
  orderBookRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  orderBookPrice: {
    fontSize: 14,
    flex: 1,
    fontWeight: "500",
  },
  askPrice: {
    color: "#F9335D",
  },
  bidPrice: {
    color: "#10BA68",
  },
  orderBookAmount: {
    color: "white",
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  currentPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    backgroundColor: "rgba(249, 51, 93, 0.1)",
    marginVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  currentOrderPrice: {
    color: "#F9335D",
    fontSize: 16,
    fontWeight: "bold",
  },
  currentOrderValue: {
    color: "#777",
    fontSize: 14,
  },
  sliderContainer: {
    marginTop: 24,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: "#333",
    marginBottom: 16,
    position: "relative",
    borderRadius: 2,
  },
  sliderFill: {
    height: 4,
    width: "30%",
    backgroundColor: "white",
    borderRadius: 2,
  },
  sliderHandle: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
    top: -8,
    left: "30%",
    marginLeft: -10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sliderLabel: {
    color: "#777",
    fontSize: 12,
  },
  sliderValue: {
    color: "white",
    fontSize: 12,
  },
  actionButton: {
    borderRadius: 4,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: "center",
  },
  buyButton: {
    backgroundColor: "#10BA68",
  },
  sellButton: {
    backgroundColor: "#F9335D",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomTabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#111",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  bottomTab: {
    marginRight: 24,
  },
  tabLabel: {
    color: "#777",
    fontSize: 14,
  },
  tabLabelActive: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  tradingSessionBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#111",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#0078FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkboxLabel: {
    color: "white",
    fontSize: 14,
  },
  clearAllButton: {
    color: "#777",
    fontSize: 14,
  },
});

export default CryptoChartScreen;
