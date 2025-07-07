import Chart from '@/components/crypto/Chart';
import colors from '@/styles/colors';
import OrderBook from '@/components/trading/OrderBook';
import OrderEntry from '@/components/trading/OrderEntry';
import React, { useRef, useState } from 'react';
import SymbolHeader from '@/components/crypto/SymbolHeader';
import TimeframeSelector from '@/components/crypto/TimeframeSelector';
import useCryptoAPI from '@/hooks/useCryptoAPI';
import useHistoricalData from '@/hooks/useHistoricalData';
import useOrderBook from '@/hooks/useOrderBook';
import UUIDService from '@/services/UUIDService';
import { ChartType, Order, TimeframeOption } from '../../types/crypto';
import { RootState } from '@/store';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '@/context/LanguageContext';
import { useLocalSearchParams } from 'expo-router';
import { useNotification } from '@/components/ui/Notification';
import { UserService } from '@/services/UserService';
import { WebView } from 'react-native-webview';
import {
  OrderDispatchContext,
  OrderValidationContext,
  handleOrderSubmission,
} from "@/utils/helper";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import {
  addTradeHistory,
  updateHolding,
  updateTrade,
} from "@/features/balanceSlice";


const CryptoChartScreen = () => {
  const { t } = useLanguage();
  const { id, symbol, name, image }: any = useLocalSearchParams();
  const { balance } = useSelector((state: RootState) => state.balance);
  const dispatch = useDispatch();
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("3m");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [showIndicators, setShowIndicators] = useState(false);

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
      console.error("Error parsing WebView message:", e);
      setError(t("chart.errorParsingMessage"));
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
  console.log("====================================");
  console.log("Current Price:", currentPrice);
  console.log("Price Change:", priceChange);
  console.log("Symbol:", id);
  console.log("balance:", balance);
  console.log("====================================");

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
          title={`${symbol} ${t("chart.title")}`}
          seriesName={symbol}
          data={[]}
          symbol={symbol}
          timeframe={timeframe}
        />

        {/* Order Book and Entry Components */}
        <View style={styles.orderSection}>
          <OrderEntry
            symbol={symbol?.slice(0, 3)}
            name={name}
            orderType={orderType}
            currentPrice={currentPrice ? Number(currentPrice) : undefined}
            onSubmitOrder={async (order) => {
              const validationContext: OrderValidationContext = {
                getHoldings: () => balance.holdings,
              };

              const dispatchContext: OrderDispatchContext = {
                addTradeHistory: (order) => dispatch(addTradeHistory(order)),
                updateHolding: (payload) => dispatch(updateHolding(payload)),
                updateTrade: (payload) => dispatch(updateTrade(payload)),
                syncTransaction: async (order) => {
                  try {
                    const uuid = await UUIDService.getOrCreateUser();
                    await UserService.createTransaction({
                      user_id: uuid,
                      type: order.type.toUpperCase() as "BUY" | "SELL",
                      symbol: order.symbol,
                      quantity: (order.amount || 0).toString(),
                      price: (order.price || 0).toString(),
                      total_value: (order.total || 0).toString(),
                      fee: (order.fees || 0).toString(),
                      order_type: order.orderType.toUpperCase() as
                        | "MARKET"
                        | "LIMIT",
                      status: order.status.toUpperCase() as
                        | "PENDING"
                        | "COMPLETED"
                        | "FAILED",
                      timestamp: new Date(order.timestamp).toISOString(),
                    });
                    console.log("✅ Transaction synced to cloud successfully");
                  } catch (error) {
                    console.error(
                      "❌ Failed to sync transaction to cloud:",
                      error
                    );
                    // Don't throw - local order succeeded, cloud sync can be retried later
                  }
                },
              };

              return handleOrderSubmission(
                order,
                image,
                validationContext,
                dispatchContext
              );
            }}
            maxAmount={currentPrice ? 100000 / Number(currentPrice) : 0}
            availableBalance={balance.holdings.USDT?.amount || 0}
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
