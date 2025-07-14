import Chart from "@/components/crypto/Chart";
import colors from "@/styles/colors";
import OrderBook from "@/components/trading/OrderBook";
import OrderEntry from "@/components/trading/OrderEntry";
import React, { useEffect, useRef, useState } from "react";
import SymbolHeader from "@/components/crypto/SymbolHeader";
import TimeframeSelector from "@/components/crypto/TimeframeSelector";
import TradingContextIndicator from "@/components/trading/TradingContextIndicator";
import useCryptoAPI from "@/hooks/useCryptoAPI";
import useHistoricalData from "@/hooks/useHistoricalData";
import useOrderBook from "@/hooks/useOrderBook";
import UUIDService from "@/services/UUIDService";
import { ChartType, Order, TimeframeOption } from "../../types/crypto";
import { logger } from "@/utils/logger";
import { OrderDispatchContext, OrderValidationContext } from "@/utils/helper";
import { RootState, useAppDispatch } from "@/store";
import { updateCollectionHolding } from "@/features/dualBalanceSlice";
import { useDualBalance } from "@/hooks/useDualBalance";
import { useLanguage } from "@/context/LanguageContext";
import { useLocalSearchParams } from "expo-router";
import { useNotification } from "@/components/ui/Notification";
import { UserService } from "@/services/UserService";
import { useSelector } from "react-redux";
import { useUser } from "@/context/UserContext";
import { WebView } from "react-native-webview";
import {
  ActivityIndicator,
  Animated,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  addTradeHistory,
  loadBalance,
  updateHolding,
  updateTrade,
} from "@/features/balanceSlice";
import {
  handleOrderSubmission,
  handleUserReinitialization,
} from "@/utils/helper";

const CryptoChartScreen = () => {
  const { t } = useLanguage();
  const { reinitializeUser } = useUser();
  const { id, symbol, name, image, collectionId, collectionName }: any =
    useLocalSearchParams();
  const { balance } = useSelector((state: RootState) => state.balance);
  const dispatch = useAppDispatch();
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("3m");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [showIndicators, setShowIndicators] = useState(false);

  // Order submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string>("");
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Dual balance hook
  const {
    activeContext,
    currentBalance,
    currentHoldings,
    currentUsdtBalance,
    executeTradeInContext,
    switchContext,
    loadCollection,
    loadIndividual,
  } = useDualBalance();

  console.log("currentUsdtBalance", currentUsdtBalance);
  console.log("currentHoldings", currentHoldings);
  console.log("activeContext", activeContext);

  const { askOrders, bidOrders } = useOrderBook(id);
  const { loading, error, setError, fetchHistoricalData } = useHistoricalData();

  const { currentPrice, priceChange } = useCryptoAPI(timeframe, id);

  // Load balance data when component mounts
  useEffect(() => {
    dispatch(loadBalance());
  }, [dispatch]);

  // Set collection context if collectionId is provided
  useEffect(() => {
    if (collectionId) {
      switchContext({ type: "collection", collectionId });
      loadCollection(collectionId);
    } else {
      switchContext({ type: "individual" });
    }
  }, [collectionId, switchContext, loadCollection]);

  // Animate loading modal
  useEffect(() => {
    if (isSubmitting) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSubmitting, fadeAnim]);

  // Simulate submission progress
  useEffect(() => {
    if (isSubmitting) {
      const progressInterval = setInterval(() => {
        setSubmissionProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      return () => clearInterval(progressInterval);
    } else {
      setSubmissionProgress(0);
    }
  }, [isSubmitting]);

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "ready") {
        setIsReady(true);
        fetchHistoricalData(timeframe, webViewRef, true, chartType, symbol);
      } else if (data.type === "error") {
        setError(data.message);
      } else if (data.type === "priceSelected") {
        // Price selection handled silently
      } else if (data.type === "chartInteraction") {
        // Chart interaction handled silently
      }
    } catch (e: any) {
      logger.error("Error parsing WebView message", "CryptoChart", e);
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

  // Enhanced order submission with dual balance support and loading states
  const submitOrder = async (order: Order): Promise<void> => {
    setIsSubmitting(true);
    setSubmissionStatus("Validating order...");
    setSubmissionProgress(10);

    try {
      const validationContext: OrderValidationContext = {
        getHoldings: () => currentHoldings, // Use current context holdings
        getUsdtBalance: () => currentUsdtBalance, // Provide USDT balance from context
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
          // Transaction is already created in DualBalanceService.executeTrade()
          // No need to create another transaction here
        },
      };

      setSubmissionStatus("Executing trade...");
      setSubmissionProgress(30);

      // Execute trade using dual balance system
      await executeTradeInContext(order);

      setSubmissionStatus("Processing transaction...");
      setSubmissionProgress(60);

      // Balance should be automatically updated in Redux state
      console.log("✅ Trade executed, balance should be updated automatically");

      // Handle order submission with dual balance context
      await handleOrderSubmission(
        order,
        image || "",
        validationContext,
        dispatchContext
      );

      setSubmissionStatus("Finalizing...");
      setSubmissionProgress(90);

      // Simulate final processing
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSubmissionStatus("Order completed successfully!");
      setSubmissionProgress(100);

      // Show success for a moment before hiding
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error: any) {
      logger.error("Failed to submit order", "CryptoChart", error);
      setSubmissionStatus("Error occurred. Retrying...");

      // Handle authentication errors using utility function
      await handleUserReinitialization(error, reinitializeUser, () =>
        submitOrder(order)
      );
    } finally {
      setIsSubmitting(false);
      setSubmissionStatus("");
      setSubmissionProgress(0);
    }
  };

  // Loading Modal Component
  const LoadingModal = () => (
    <Modal
      visible={isSubmitting}
      transparent={true}
      animationType="none"
      onRequestClose={() => {}}>
      <Animated.View
        style={[
          styles.loadingOverlay,
          {
            opacity: fadeAnim,
          },
        ]}>
        <Animated.View style={[styles.loadingContainer]}>
          {/* Loading Icon */}
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color="#6674CC" />
            <View style={styles.loadingIconGlow} />
          </View>

          {/* Status Text */}
          <Text style={styles.loadingTitle}>Processing Order</Text>
          <Text style={styles.loadingStatus}>{submissionStatus}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${submissionProgress}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(submissionProgress)}%
            </Text>
          </View>

          {/* Context Info */}
          <View style={styles.contextInfo}>
            <Text style={styles.contextLabel}>
              {activeContext.type === "collection"
                ? "Collection Trade"
                : "Individual Trade"}
            </Text>
            <Text style={styles.contextSymbol}>{symbol}</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );

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
            key={`${symbol}-${currentUsdtBalance}`} // Force re-render when balance changes
            symbol={symbol}
            name={name}
            orderType={orderType}
            currentPrice={currentPrice ? Number(currentPrice) : undefined}
            availableBalance={currentUsdtBalance} // Use current context balance
            onSubmitOrder={submitOrder}
            disabled={isSubmitting}
          />

          <OrderBook
            symbol={symbol}
            askOrders={askOrders}
            bidOrders={bidOrders}
            currentPrice={currentPrice}
            webViewRef={webViewRef}
          />
        </View>
      </ScrollView>

      {/* Loading Modal */}
      <LoadingModal />
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
  // Loading Modal Styles
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "#1A1D2F",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    minWidth: 280,
    shadowColor: "#6674CC",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  loadingIconContainer: {
    position: "relative",
    marginBottom: 20,
  },
  loadingIconGlow: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    backgroundColor: "#6674CC",
    opacity: 0.2,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  loadingStatus: {
    fontSize: 14,
    color: "#9DA3B4",
    textAlign: "center",
    marginBottom: 20,
    minHeight: 20,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#2A2D3E",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6674CC",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#9DA3B4",
    textAlign: "center",
  },
  contextInfo: {
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#2A2D3E",
    width: "100%",
  },
  contextLabel: {
    fontSize: 12,
    color: "#9DA3B4",
    marginBottom: 4,
  },
  contextSymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6674CC",
  },
});

export default CryptoChartScreen;
