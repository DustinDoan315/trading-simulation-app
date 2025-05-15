import Chart from "@/components/crypto/Chart";
import OrderBook from "@/components/trading/OrderBook";
import OrderEntry from "@/components/trading/OrderEntry";
import React, { useRef, useState } from "react";
import SymbolHeader from "@/components/crypto/SymbolHeader";
import TimeframeSelector from "@/components/crypto/TimeframeSelector";
import useHistoricalData from "@/hooks/useHistoricalData";
import useOrderBook from "@/hooks/useOrderBook";
import useCryptoAPI from "@/hooks/useCryptoAPI";
import { ChartType, TimeframeOption, Order } from "../types/crypto";
import { WebView } from "react-native-webview";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import colors from "@/styles/colors";
import { handleOrderSubmission } from "@/utils/helper";
import { useBalanceStore } from "@/stores/balanceStore";

const CryptoChartScreen = () => {
  const token: any = useLocalSearchParams();
  const { balance } = useBalanceStore();
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("3m");
  const [selectedTab, setSelectedTab] = useState<"buy" | "sell">("sell");
  const [showOrderOptions, setShowOrderOptions] = useState(false);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [orderAmount, setOrderAmount] = useState(30);
  const [sliderPosition, setSliderPosition] = useState(30);
  const [showIndicators, setShowIndicators] = useState(false);
  const [symbol, setSymbol] = useState(
    token?.symbol ? `${token?.symbol}/USDT` : "BTC/USDT"
  );

  const { askOrders, bidOrders } = useOrderBook(token?.symbol);
  const { loading, error, setError, fetchHistoricalData } = useHistoricalData();

  const { currentPrice, priceChange } = useCryptoAPI(timeframe, token?.id);
  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("WebView message:", data);
      if (data.type === "ready") {
        setIsReady(true);
        fetchHistoricalData(timeframe, webViewRef, true, chartType, symbol);
      } else if (data.type === "error") {
        setError(data.message);
      } else if (data.type === "priceSelected") {
        console.log("Price Selected", data.price);
      } else if (data.type === "chartInteraction") {
        console.log("Chart Interaction", data.action);
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
        fetchHistoricalData(
          newTimeframe,
          webViewRef,
          isReady,
          chartType,
          symbol
        );
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
    setOrderType(type === "Lệnh thị trường" ? "market" : "limit");
    setShowOrderOptions(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        {/* Symbol Header */}
        <SymbolHeader
          symbol={symbol}
          priceChange={priceChange || ""}
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
          title={`${symbol} Chart`}
          seriesName={symbol}
        />

        {/* Order Book and Entry Components */}
        <View style={styles.orderSection}>
          <OrderEntry
            symbol={token?.symbol}
            orderType={orderType}
            currentPrice={currentPrice ? Number(currentPrice) : undefined}
            onSubmitOrder={(order: Order) =>
              handleOrderSubmission(order, currentPrice || undefined, token)
            }
            maxAmount={currentPrice ? 100000 / Number(currentPrice) : 0}
            availableBalance={balance.holdings.tether.amount}
          />

          <OrderBook
            symbol={token?.symbol}
            askOrders={askOrders}
            bidOrders={bidOrders}
            currentPrice={currentPrice}
            webViewRef={webViewRef}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  orderSection: {
    paddingBottom: 20,
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default CryptoChartScreen;
