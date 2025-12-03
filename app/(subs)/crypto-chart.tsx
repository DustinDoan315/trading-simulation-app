import Chart from '@/components/crypto/Chart';
import colors from '@/styles/colors';
import DailyLimitPopup from '@/components/ui/DailyLimitPopup';
import OrderEntry from '@/components/trading/OrderEntry';
import React, { useEffect, useRef, useState } from 'react';
import SymbolHeader from '@/components/crypto/SymbolHeader';
import TimeframeSelector from '@/components/crypto/TimeframeSelector';
import useCryptoAPI from '@/hooks/useCryptoAPI';
import useHistoricalData from '@/hooks/useHistoricalData';
import { ChartType, Order, TimeframeOption } from '../../types/crypto';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '@/utils/logger';
import { RootState, useAppDispatch } from '@/store';
import { router } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import { useLocalSearchParams } from 'expo-router';
import { UserService } from '@/services/UserService';
import { useSelector } from 'react-redux';
import { useUser } from '@/context/UserContext';
import { WebView } from 'react-native-webview';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  OrderDispatchContext,
  OrderValidationContext,
  handleOrderSubmissionWithLimitCheck,
} from "@/utils/helper";
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
  const { user, reinitializeUser } = useUser();
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
  const [showDailyLimitPopup, setShowDailyLimitPopup] = useState(false);
  const [dailyLimitData, setDailyLimitData] = useState({
    usedTransactions: 0,
    dailyLimit: 10,
    remainingTransactions: 0,
  });
  const submissionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    console.log("Popup visibility state changed to:", showDailyLimitPopup);
    console.log("Popup data:", dailyLimitData);
  }, [showDailyLimitPopup, dailyLimitData]);

  // Use regular balance system instead of DualBalance
  const currentHoldings = balance.holdings;
  const currentUsdtBalance = balance.usdtBalance;
  const currentBalance = balance;

  const { loading, error, setError, fetchHistoricalData } = useHistoricalData();

  const { currentPrice, priceChange } = useCryptoAPI(timeframe, id);

  useEffect(() => {
    dispatch(loadBalance());
  }, [dispatch]);

  // Removed collection context switching - using regular balance only

  useEffect(() => {
    return () => {
      setIsSubmitting(false);
      setSubmissionStatus("");
      setSubmissionProgress(0);

      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current);
      }
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

    if (submissionTimeoutRef.current) {
      clearTimeout(submissionTimeoutRef.current);
      submissionTimeoutRef.current = null;
    }
  };

  const submitOrder = async (order: Order): Promise<void> => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const minDisplayTime = 1000;
    const startTime = Date.now();
    setSubmissionStatus(t("chart.validatingOrder"));
    setSubmissionProgress(10);

    submissionTimeoutRef.current = setTimeout(() => {
      console.warn("Order submission timeout - resetting loading state");
      resetLoadingState();
    }, 30000);

    try {
      // First validate the order (balance, amounts, etc.) before checking daily limits
      setSubmissionStatus(t("chart.validatingOrder"));
      setSubmissionProgress(15);

      const validationContext: OrderValidationContext = {
        getHoldings: () => currentHoldings,
        getUsdtBalance: () => currentUsdtBalance,
      };

      // Balance validation is handled in handleOrderSubmissionWithLimitCheck

      // Only check daily limit after order validation passes
      setSubmissionStatus(t("chart.checkingDailyLimit"));
      setSubmissionProgress(25);

      const dailyLimitStatus = await UserService.checkDailyTransactionLimit(
        user?.id || ""
      );

      if (!dailyLimitStatus.canTrade) {
        resetLoadingState();

        setDailyLimitData({
          usedTransactions: dailyLimitStatus.usedTransactions,
          dailyLimit: dailyLimitStatus.dailyLimit,
          remainingTransactions: dailyLimitStatus.remainingTransactions,
        });

        setTimeout(() => {
          setShowDailyLimitPopup(true);
          console.log("Daily limit reached - showing popup with data:", {
            usedTransactions: dailyLimitStatus.usedTransactions,
            dailyLimit: dailyLimitStatus.dailyLimit,
            remainingTransactions: dailyLimitStatus.remainingTransactions,
          });
        }, 100);

        return;
      }

      const dispatchContext: OrderDispatchContext = {
        addTradeHistory: (order) => dispatch(addTradeHistory(order)),
        updateHolding: (payload) => dispatch(updateHolding(payload)),
        updateTrade: (payload) => dispatch(updateTrade(payload)),
        syncTransaction: async (order) => {},
      };

      setSubmissionStatus(t("chart.executingTrade"));
      setSubmissionProgress(40);

      setSubmissionStatus(t("chart.processingTransaction"));
      setSubmissionProgress(70);

      await handleOrderSubmissionWithLimitCheck(
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
      console.error("Order submission error:", error);

      resetLoadingState();

      // Handle insufficient balance errors
      if (
        error.message?.includes("Insufficient USDT balance") ||
        (error.message?.includes("Insufficient") &&
          error.message?.includes("balance"))
      ) {
        // Extract balance information from error message
        const balanceMatch = error.message.match(
          /You have ([\d.]+) USDT, trying to spend ([\d.]+) USDT/
        );
        const cryptoMatch = error.message.match(
          /You have ([\d.]+) (\w+), trying to sell ([\d.]+) \w+/
        );

        let alertMessage = error.message;

        if (balanceMatch) {
          const [, currentBalance, requiredAmount] = balanceMatch;
          const shortfall =
            parseFloat(requiredAmount) - parseFloat(currentBalance);
          alertMessage = t("order.insufficientUsdtMessage", {
            currentBalance: parseFloat(currentBalance).toFixed(2),
            requiredAmount: parseFloat(requiredAmount).toFixed(2),
            shortfall: shortfall.toFixed(2),
          });
        } else if (cryptoMatch) {
          const [, currentAmount, symbol, requiredAmount] = cryptoMatch;
          alertMessage = t("order.insufficientCryptoMessage", {
            symbol,
            currentAmount: parseFloat(currentAmount).toFixed(6),
            requiredAmount: parseFloat(requiredAmount).toFixed(6),
          });
        }

        Alert.alert(t("order.insufficientBalanceTitle"), alertMessage, [
          {
            text: "OK",
            style: "default",
          },
        ]);
        return;
      }

      // Handle validation errors
      if (
        error.message?.includes("Invalid quantity") ||
        error.message?.includes("Invalid total value")
      ) {
        Alert.alert(t("order.orderFailedTitle"), error.message, [
          {
            text: "OK",
            style: "default",
          },
        ]);
        return;
      }

      // Handle transaction creation errors
      if (error.message?.includes("Failed to create transaction")) {
        Alert.alert(t("order.orderFailedTitle"), t("order.transactionFailed"), [
          {
            text: "OK",
            style: "default",
          },
        ]);
        return;
      }

      // Handle token selection errors
      if (error.message?.includes("No token selected")) {
        Alert.alert(t("order.orderFailedTitle"), t("order.selectToken"), [
          {
            text: "OK",
            style: "default",
          },
        ]);
        return;
      }

      // Handle minimum amount errors
      if (error.message?.includes("Minimum order amount")) {
        Alert.alert(t("order.orderFailedTitle"), error.message, [
          {
            text: "OK",
            style: "default",
          },
        ]);
        return;
      }

      // Handle daily transaction limit errors
      if (
        error.message?.includes("Daily transaction limit reached") ||
        error.message?.includes("daily transaction limit")
      ) {
        let usedTransactions = 10;
        let dailyLimit = 10;
        let remainingTransactions = 0;

        const match1 = error.message.match(
          /used (\d+)\/(\d+) transactions today\. You have (\d+) transactions remaining\./
        );

        const match2 = error.message.match(
          /You have used (\d+)\/(\d+) transactions today\. You have (\d+) transactions remaining\./
        );

        if (match1) {
          [, usedTransactions, dailyLimit, remainingTransactions] =
            match1.map(Number);
        } else if (match2) {
          [, usedTransactions, dailyLimit, remainingTransactions] =
            match2.map(Number);
        }

        setDailyLimitData({
          usedTransactions,
          dailyLimit,
          remainingTransactions,
        });

        setTimeout(() => {
          setShowDailyLimitPopup(true);
          console.log("Daily limit error caught - showing popup with data:", {
            usedTransactions,
            dailyLimit,
            remainingTransactions,
          });
        }, 100);

        return;
      }

      // Handle user authentication errors
      if (
        error.message?.includes("User not authenticated") ||
        error.message?.includes("Failed to initialize user authentication") ||
        error.message?.includes("User not found") ||
        error.message?.includes("User creation failed")
      ) {
        try {
          setSubmissionStatus(t("chart.reinitializingUser"));
          await reinitializeUser();
          setSubmissionStatus(t("chart.retryingOrder"));

          await submitOrder(order);
        } catch (reinitError: any) {
          console.error("User reinitialization failed:", reinitError);

          // Provide more specific error message
          if (reinitError.message?.includes("User creation failed")) {
            setSubmissionStatus(
              "Failed to create user account. Please try again."
            );
          } else {
            setSubmissionStatus(t("chart.errorOccurred"));
          }

          await new Promise((resolve) => setTimeout(resolve, 3000));
          resetLoadingState();
        }
      } else {
        // Handle other generic errors with a user-friendly alert
        const errorMessage = error.message || t("order.unexpectedError");

        Alert.alert(t("order.orderFailedTitle"), errorMessage, [
          {
            text: "OK",
            style: "default",
          },
        ]);

        setSubmissionStatus(t("chart.errorOccurred"));
        await new Promise((resolve) => setTimeout(resolve, 2000));
        resetLoadingState();
      }
    }
  };

  const LoadingOverlay = () => {
    if (!isSubmitting) return null;

    return (
      <TouchableOpacity
        style={styles.loadingOverlay}
        activeOpacity={1}
        onPress={() => {
          console.log("User dismissed loading overlay");
          resetLoadingState();
        }}>
        <TouchableOpacity
          style={styles.loadingContainer}
          activeOpacity={1}
          onPress={(e) => {
            e.stopPropagation();
          }}>
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
              {t("chart.individualTrade")}
            </Text>
            <Text style={styles.contextSymbol}>{symbol}</Text>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

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
          onBackPress={() => router.back()}
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

      <LoadingOverlay />

      <DailyLimitPopup
        visible={showDailyLimitPopup}
        onClose={() => {
          console.log("Closing daily limit popup");
          setShowDailyLimitPopup(false);
        }}
        usedTransactions={dailyLimitData.usedTransactions}
        dailyLimit={dailyLimitData.dailyLimit}
        remainingTransactions={dailyLimitData.remainingTransactions}
      />
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
  // Loading Overlay Styles
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
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
