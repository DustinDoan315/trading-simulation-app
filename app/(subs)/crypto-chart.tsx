import Chart from '@/components/crypto/Chart';
import colors from '@/styles/colors';
import OrderBook from '@/components/trading/OrderBook';
import OrderEntry from '@/components/trading/OrderEntry';
import React, { useEffect, useRef, useState } from 'react';
import SymbolHeader from '@/components/crypto/SymbolHeader';
import TimeframeSelector from '@/components/crypto/TimeframeSelector';
import TradingContextIndicator from '@/components/trading/TradingContextIndicator';
import useCryptoAPI from '@/hooks/useCryptoAPI';
import useHistoricalData from '@/hooks/useHistoricalData';
import useOrderBook from '@/hooks/useOrderBook';
import UUIDService from '@/services/UUIDService';
import { ChartType, Order, TimeframeOption } from '../../types/crypto';
import { handleOrderSubmission } from '@/utils/helper';
import { OrderDispatchContext, OrderValidationContext } from '@/utils/helper';
import { RootState } from '@/store';
import { updateCollectionHolding } from '@/features/dualBalanceSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useDualBalance } from '@/hooks/useDualBalance';
import { useLanguage } from '@/context/LanguageContext';
import { useLocalSearchParams } from 'expo-router';
import { useNotification } from '@/components/ui/Notification';
import { UserService } from '@/services/UserService';
import { WebView } from 'react-native-webview';
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
  const { id, symbol, name, image, collectionId, collectionName }: any =
    useLocalSearchParams();
  const { balance } = useSelector((state: RootState) => state.balance);
  const dispatch = useDispatch();
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("3m");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [showIndicators, setShowIndicators] = useState(false);

  // Dual balance hook
  const {
    activeContext,
    currentBalance,
    currentHoldings,
    currentUsdtBalance,
    executeTradeInContext,
    switchContext,
    loadCollection,
  } = useDualBalance();

  const { askOrders, bidOrders } = useOrderBook(id);
  const { loading, error, setError, fetchHistoricalData } = useHistoricalData();

  const { currentPrice, priceChange } = useCryptoAPI(timeframe, id);

  // Set collection context if collectionId is provided
  useEffect(() => {
    if (collectionId) {
      switchContext({ type: "collection", collectionId });
      loadCollection(collectionId);
    } else {
      switchContext({ type: "individual" });
    }
  }, [collectionId, switchContext, loadCollection]);

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

  // Enhanced order submission with dual balance support
  const submitOrder = async (order: Order) => {
    try {
      const validationContext: OrderValidationContext = {
        getHoldings: () => currentHoldings, // Use current context holdings
      };

      const dispatchContext: OrderDispatchContext = {
        addTradeHistory: (order) => dispatch(addTradeHistory(order)),
        updateHolding: (payload) => {
          // Use dual balance update instead of regular balance
          if (activeContext.type === "individual") {
            dispatch(updateHolding(payload));
          } else if (activeContext.collectionId) {
            dispatch(
              updateCollectionHolding({
                collectionId: activeContext.collectionId,
                holding: payload,
              })
            );
          }
        },
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
              order_type: order.orderType.toUpperCase() as "MARKET" | "LIMIT",
              status: order.status.toUpperCase() as
                | "PENDING"
                | "COMPLETED"
                | "FAILED",
              collection_id:
                activeContext.type === "collection"
                  ? activeContext.collectionId
                  : undefined,
              timestamp: new Date(order.timestamp).toISOString(),
            });
            console.log("✅ Transaction synced to cloud successfully");
          } catch (error) {
            console.error("❌ Failed to sync transaction to cloud:", error);
          }
        },
      };

      // Execute trade using dual balance system
      await executeTradeInContext(order);

      // Handle order submission with dual balance context
      await handleOrderSubmission(
        order,
        image || "",
        validationContext,
        dispatchContext
      );
    } catch (error) {
      console.error("Failed to submit order:", error);
      throw error;
    }
  };

  console.log("====================================");
  console.log("Current Price:", currentPrice);
  console.log("Price Change:", priceChange);
  console.log("Symbol:", id);
  console.log("Active Context:", activeContext);
  console.log("Current Balance:", currentBalance);
  console.log("Current Holdings:", currentHoldings);
  console.log("====================================");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        {/* Trading Context Indicator */}
        <TradingContextIndicator
          collectionName={collectionName}
          showSwitchButton={true}
        />

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
            availableBalance={currentUsdtBalance} // Use current context balance
            onSubmitOrder={submitOrder}
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
