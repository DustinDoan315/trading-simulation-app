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
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useNotification } from "@/components/ui/Notification";

const CryptoChartScreen = () => {
  const { id, symbol, name, image_url }: any = useLocalSearchParams();
  const { balance } = useSelector((state: RootState) => state.balance);
  const { showNotification } = useNotification();
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("3m");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [showIndicators, setShowIndicators] = useState(false);

  console.log("token:", id, symbol, name, image_url);

  const { askOrders, bidOrders } = useOrderBook(id);
  const { loading, error, setError, fetchHistoricalData } = useHistoricalData();

  const { currentPrice, priceChange } = useCryptoAPI(timeframe, id);
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

  console.log("Current Price:", currentPrice);
  console.log("Price Change:", priceChange);
  console.log("Symbol:", id);

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
            symbol={symbol?.slice(0, 3)}
            name={name}
            orderType={orderType}
            currentPrice={currentPrice ? Number(currentPrice) : undefined}
            onSubmitOrder={(order) =>
              handleOrderSubmission(
                order,
                symbol?.slice(0, 3),
                image_url,
                showNotification
              )
            }
            maxAmount={currentPrice ? 100000 / Number(currentPrice) : 0}
            availableBalance={balance.holdings.USDT.amount}
          />

          <OrderBook
            symbol={symbol?.slice(0, 3)}
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
