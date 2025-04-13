import Chart from "@/components/crypto/Chart";
import OrderBook from "@/components/trading/OrderBook";
import OrderEntry from "@/components/trading/OrderEntry";
import PriceIndicator from "@/components/trading/PriceIndicator";
import React, { useCallback, useRef, useState } from "react";
import SymbolHeader from "../../components/crypto/SymbolHeader";
import TimeframeSelector from "../../components/crypto/TimeframeSelector";
import useCryptoWebSocket from "../hooks/useCryptoWebSocket";
import useHistoricalData from "../hooks/useHistoricalData";
import useOrderBook from "../hooks/useOrderBook";
import { ChartType, TimeframeOption } from "../types/crypto";
import { WebView } from "react-native-webview";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

// Components
// Custom hooks

const CryptoChartScreen = ({ navigation }: { navigation: any }) => {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("3m");
  const [selectedTab, setSelectedTab] = useState<"buy" | "sell">("sell");
  const [showOrderOptions, setShowOrderOptions] = useState(false);
  const [orderType, setOrderType] = useState("Lệnh thị trường");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [orderAmount, setOrderAmount] = useState(30);
  const [sliderPosition, setSliderPosition] = useState(30);
  const [showIndicators, setShowIndicators] = useState(false);

  // Use custom hooks
  const { askOrders, bidOrders } = useOrderBook();
  const { loading, error, setError, fetchHistoricalData } = useHistoricalData();

  // Prepare the fetchData callback for the WebSocket hook
  const fetchData = useCallback(
    (tf: TimeframeOption) => {
      fetchHistoricalData(tf, webViewRef, isReady, chartType);
    },
    [fetchHistoricalData, webViewRef, isReady, chartType]
  );

  const { wsConnected, currentPrice, priceChange } = useCryptoWebSocket(
    timeframe,
    isReady,
    webViewRef,
    chartType,
    fetchData
  );

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("WebView message:", data);
      if (data.type === "ready") {
        setIsReady(true);
        if (wsConnected) {
          fetchHistoricalData(timeframe, webViewRef, true, chartType);
        }
      } else if (data.type === "error") {
        setError(data.message);
      } else if (data.type === "priceSelected") {
        // Handle price selection from chart
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
        fetchHistoricalData(newTimeframe, webViewRef, isReady, chartType);
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

  const toggleOrderOptions = () => {
    setShowOrderOptions(!showOrderOptions);
  };

  const handleOrderTypeSelection = (type: string) => {
    setOrderType(type);
    setShowOrderOptions(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView style={styles.scrollView}>
        {/* Symbol Header */}
        <SymbolHeader
          priceChange={priceChange}
          chartType={chartType}
          toggleChartType={toggleChartType}
          toggleIndicators={toggleIndicators}
        />

        {/* Timeframe Selector */}
        <TimeframeSelector
          timeframe={timeframe}
          switchTimeframe={switchTimeframe}
          showIndicators={showIndicators}
          toggleIndicators={toggleIndicators}
        />

        {/* Chart */}
        <Chart
          webViewRef={webViewRef}
          loading={loading}
          error={error}
          onMessage={onMessage}
          chartType={chartType}
        />

        {/* Current Price Indicator */}
        <PriceIndicator currentPrice={currentPrice} />

        {/* Order Book and Entry Components */}
        <View style={styles.orderSection}>
          <OrderBook
            askOrders={askOrders}
            bidOrders={bidOrders}
            currentPrice={currentPrice}
            webViewRef={webViewRef}
          />

          <OrderEntry
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            orderType={orderType}
            showOrderOptions={showOrderOptions}
            toggleOrderOptions={toggleOrderOptions}
            handleOrderTypeSelection={handleOrderTypeSelection}
            sliderPosition={sliderPosition}
            setSliderPosition={setSliderPosition}
            orderAmount={orderAmount}
            setOrderAmount={setOrderAmount}
            currentPrice={currentPrice}
          />
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
  scrollView: {
    flex: 1,
    backgroundColor: "#000",
  },
  orderSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    marginTop: 20,
  },
});

export default CryptoChartScreen;
