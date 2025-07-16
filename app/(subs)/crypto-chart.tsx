import Chart from '@/components/crypto/Chart';
import colors from '@/styles/colors';
import OrderEntry from '@/components/trading/OrderEntry';
import React, { useEffect, useRef, useState } from 'react';
import SymbolHeader from '@/components/crypto/SymbolHeader';
import TimeframeSelector from '@/components/crypto/TimeframeSelector';
import TradingContextIndicator from '@/components/trading/TradingContextIndicator';
import useCryptoAPI from '@/hooks/useCryptoAPI';
import useHistoricalData from '@/hooks/useHistoricalData';
import UUIDService from '@/services/UUIDService';
import { ChartType, Order, TimeframeOption } from '../../types/crypto';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '@/utils/logger';
import { OrderDispatchContext, OrderValidationContext } from '@/utils/helper';
import { RootState, useAppDispatch } from '@/store';
import { updateCollectionHolding } from '@/features/dualBalanceSlice';
import { useDualBalance } from '@/hooks/useDualBalance';
import { useLanguage } from '@/context/LanguageContext';
import { useLocalSearchParams } from 'expo-router';
import { useNotification } from '@/components/ui/Notification';
import { UserService } from '@/services/UserService';
import { useSelector } from 'react-redux';
import { useUser } from '@/context/UserContext';
import { WebView } from 'react-native-webview';
import {
  ActivityIndicator,
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string>("");
  const [submissionProgress, setSubmissionProgress] = useState(0);

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

  const { loading, error, setError, fetchHistoricalData } = useHistoricalData();

  const { currentPrice, priceChange } = useCryptoAPI(timeframe, id);

  useEffect(() => {
    dispatch(loadBalance());
  }, [dispatch]);

  useEffect(() => {
    if (collectionId) {
      switchContext({ type: "collection", collectionId });
      loadCollection(collectionId);
    } else {
      switchContext({ type: "individual" });
    }
  }, [collectionId, switchContext, loadCollection]);

  useEffect(() => {
    return () => {
      setIsSubmitting(false);
      setSubmissionStatus("");
      setSubmissionProgress(0);
    };
  }, []);

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

  const resetLoadingState = () => {
    setIsSubmitting(false);
    setSubmissionStatus("");
    setSubmissionProgress(0);
  };

  const submitOrder = async (order: Order): Promise<void> => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const minDisplayTime = 1000;
    const startTime = Date.now();
    setSubmissionStatus(t("chart.validatingOrder"));
    setSubmissionProgress(10);

    try {
      const validationContext: OrderValidationContext = {
        getHoldings: () => currentHoldings,
        getUsdtBalance: () => currentUsdtBalance,
      };

      const dispatchContext: OrderDispatchContext = {
        addTradeHistory: (order) => dispatch(addTradeHistory(order)),
        updateHolding: (payload) => {
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
        syncTransaction: async (order) => {},
      };

      setSubmissionStatus(t("chart.executingTrade"));
      setSubmissionProgress(30);

      await executeTradeInContext(order);

      setSubmissionStatus(t("chart.processingTransaction"));
      setSubmissionProgress(60);

      await handleOrderSubmission(
        order,
        image || "",
        validationContext,
        dispatchContext
      );

      setSubmissionStatus(t("chart.finalizing"));
      setSubmissionProgress(90);

      await new Promise((resolve) => setTimeout(resolve, 500));

      setSubmissionStatus(t("chart.orderCompleted"));
      setSubmissionProgress(100);

      const elapsed = Date.now() - startTime;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, minDisplayTime - elapsed, 1000))
      );
      resetLoadingState();
    } catch (error: any) {
      setSubmissionStatus(t("chart.errorOccurred"));
      await new Promise((resolve) => setTimeout(resolve, 2000));
      resetLoadingState();
      await handleUserReinitialization(error, reinitializeUser, () =>
        submitOrder(order)
      );
    }
  };

  const LoadingModal = () => (
    <Modal
      visible={isSubmitting}
      transparent={true}
      onRequestClose={() => {
        if (isSubmitting) {
          resetLoadingState();
        }
      }}
      statusBarTranslucent={true}>
      <View
        style={styles.loadingOverlay}
        pointerEvents={isSubmitting ? "auto" : "none"}>
        <View
          style={styles.loadingContainer}
          pointerEvents={isSubmitting ? "auto" : "none"}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color="#6674CC" />
            <View style={styles.loadingIconGlow} />
          </View>

          <Text style={styles.loadingTitle}>{t("chart.processingOrder")}</Text>
          <Text style={styles.loadingStatus}>{submissionStatus}</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
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

          <View style={styles.contextInfo}>
            <Text style={styles.contextLabel}>
              {activeContext.type === "collection"
                ? t("chart.collectionTrade")
                : t("chart.individualTrade")}
            </Text>
            <Text style={styles.contextSymbol}>{symbol}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <SymbolHeader
          symbol={symbol}
          priceChange={priceChange || ""}
          chartType={chartType}
          toggleChartType={toggleChartType}
          toggleIndicators={toggleIndicators}
        />

        <TimeframeSelector
          timeframe={timeframe}
          switchTimeframe={switchTimeframe}
          showIndicators={showIndicators}
          toggleIndicators={toggleIndicators}
        />

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

        <View style={styles.bottomSection}>
          <View style={styles.orderSection}>
            <LinearGradient
              colors={[
                "rgba(102, 116, 204, 0.15)",
                "rgba(102, 116, 204, 0.08)",
              ]}
              style={styles.orderEntryCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <View style={styles.orderEntryHeader}>
                <Text style={styles.orderEntryTitle}>{symbol}</Text>
              </View>
              <OrderEntry
                key={`${symbol}-${currentUsdtBalance}`}
                symbol={symbol}
                name={name}
                orderType={orderType}
                currentPrice={currentPrice ? Number(currentPrice) : undefined}
                availableBalance={currentUsdtBalance}
                onSubmitOrder={submitOrder}
                disabled={isSubmitting}
              />
            </LinearGradient>
          </View>
        </View>
      </ScrollView>

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
  bottomSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  contextSection: {
    marginBottom: 16,
  },
  orderSection: {
    marginBottom: 20,
  },
  orderEntryCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#6674CC",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  orderEntryHeader: {
    alignItems: "center",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  orderEntryTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  orderEntrySubtitle: {
    fontSize: 16,
    color: "#9DA3B4",
    fontWeight: "500",
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
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    minWidth: 300,
    borderWidth: 1,
    borderColor: "rgba(102, 116, 204, 0.3)",
    shadowColor: "#6674CC",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
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
    height: 8,
    backgroundColor: "#2A2D3E",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(102, 116, 204, 0.2)",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6674CC",
    borderRadius: 4,
    shadowColor: "#6674CC",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
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
