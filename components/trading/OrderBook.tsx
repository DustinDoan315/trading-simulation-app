import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import RealTimeDataService from "@/services/RealTimeDataService";
import Typography from "@/styles/typography";
import useOrderBook from "@/hooks/useOrderBook";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatAmount } from "@/utils/formatters";
import { OrderBookItemProps, OrderBookProps } from "../../types/components";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";

const OrderBookItem = React.memo<OrderBookItemProps>(
  ({ price, amount, type, onPress, onLongPress, isCurrentPrice = false }) => {
    const priceStyle = type === "bid" ? styles.bidPrice : styles.askPrice;

    if (isCurrentPrice) {
      return (
        <TouchableOpacity
          style={styles.currentPriceRow}
          onPress={onPress}
          activeOpacity={0.7}>
          <Text style={styles.currentOrderPrice}>
            {formatAmount(Number(price), 1)}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.orderRow}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={1}>
        <Text style={[styles.orderPrice, priceStyle]}>
          {formatAmount(Number(price), 1)}
        </Text>
        <Text style={styles.orderAmount}>
          {formatAmount(Number(amount), 2)}
        </Text>
      </TouchableOpacity>
    );
  }
);

OrderBookItem.displayName = "OrderBookItem";

const OrderBook = React.memo<OrderBookProps>(
  ({
    symbol = "BTC",
    askOrders: propAskOrders,
    bidOrders: propBidOrders,
    currentPrice: propCurrentPrice,
    webViewRef,
    onSelectPrice,
    maxVisibleOrders = 5,
    onTradeExecuted,
  }) => {
    const { t } = useLanguage();

    // Extract base symbol from full symbol format (e.g., "SOL/USDT" -> "SOL")
    const baseSymbol = useMemo(() => symbol?.split("/")[0] || symbol, [symbol]);

    const {
      askOrders: hookAskOrders,
      bidOrders: hookBidOrders,
      currentPrice: hookCurrentPrice,
    } = useOrderBook(symbol);

    const baseCurrency = useMemo(() => baseSymbol.split("/")[0], [baseSymbol]);
    const [isProcessing, setIsProcessing] = useState(false);
    const { user } = useUser();

    // Initialize real-time data service when component mounts
    useEffect(() => {
      const realTimeService = RealTimeDataService.getInstance();
      if (!realTimeService.isActive()) {
        realTimeService.startUpdates();
      }
    }, []);

    // Use props if provided, otherwise use hook data
    const askOrders = useMemo(
      () => propAskOrders || hookAskOrders,
      [propAskOrders, hookAskOrders]
    );
    const bidOrders = useMemo(
      () => propBidOrders || hookBidOrders,
      [propBidOrders, hookBidOrders]
    );
    const currentPrice = useMemo(
      () => propCurrentPrice || hookCurrentPrice,
      [propCurrentPrice, hookCurrentPrice]
    );

    const handlePriceSelect = useCallback(
      (price: any) => {
        if (onSelectPrice) {
          onSelectPrice(Number(price));
        }
      },
      [onSelectPrice]
    );

    const handleTrade = useCallback(
      async (type: "BUY" | "SELL", price: number) => {
        if (!user || !user.id) {
          Alert.alert(t("error.title"), t("error.notAuthenticated"));
          return;
        }

        setIsProcessing(true);
        try {
          Alert.alert(
            t("success.title"),
            type === "BUY" ? t("order.buyExecuted") : t("order.sellExecuted")
          );
          if (onTradeExecuted) onTradeExecuted();
        } catch (error: any) {
          Alert.alert(
            t("error.title"),
            error.message ||
              (type === "BUY" ? t("order.buyFailed") : t("order.sellFailed"))
          );
        } finally {
          setIsProcessing(false);
        }
      },
      [user, t, onTradeExecuted]
    );

    // Memoize the order items to prevent unnecessary re-renders
    const askOrderItems = useMemo(
      () =>
        askOrders
          .slice(0, maxVisibleOrders)
          .map((order: any, index: any) => (
            <OrderBookItem
              key={`ask-${index}`}
              price={order.price}
              amount={order.amount}
              type="ask"
              onPress={() => handlePriceSelect(order.price)}
              onLongPress={() => handleTrade("SELL", Number(order.price))}
            />
          )),
      [askOrders, maxVisibleOrders, handlePriceSelect, handleTrade]
    );

    const bidOrderItems = useMemo(
      () =>
        bidOrders
          .slice(0, maxVisibleOrders)
          .map((order: any, index: any) => (
            <OrderBookItem
              key={`bid-${index}`}
              price={order.price}
              amount={order.amount}
              type="bid"
              onPress={() => handlePriceSelect(order.price)}
              onLongPress={() => handleTrade("BUY", Number(order.price))}
            />
          )),
      [bidOrders, maxVisibleOrders, handlePriceSelect, handleTrade]
    );

    const currentPriceItem = useMemo(
      () => (
        <OrderBookItem
          price={currentPrice}
          amount=""
          type="ask"
          isCurrentPrice={true}
          onPress={() => handlePriceSelect(currentPrice)}
        />
      ),
      [currentPrice, handlePriceSelect]
    );

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.priceHeaderText}>
            {t("order.price")} ({"USDT"})
          </Text>
          <Text style={styles.amountHeaderText}>
            {t("order.amount")} ({baseCurrency})
          </Text>
        </View>

        <View style={styles.ordersSection}>{askOrderItems}</View>

        {currentPriceItem}

        <View style={styles.ordersSection}>{bidOrderItems}</View>
        {isProcessing && (
          <Text style={styles.processingText}>{t("order.processing")}</Text>
        )}
      </View>
    );
  }
);

OrderBook.displayName = "OrderBook";

const styles = StyleSheet.create({
  container: {
    borderRadius: Dimensions.radius.md,
    width: "45%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Dimensions.spacing.md,
    paddingVertical: Dimensions.spacing.sm,
  },
  priceHeaderText: {
    ...Typography.label,
    textAlign: "left",
    flex: 1,
  },
  amountHeaderText: {
    ...Typography.label,
    textAlign: "right",
    flex: 1,
  },
  ordersSection: {},
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Dimensions.spacing.sm,
    paddingHorizontal: Dimensions.spacing.md,
  },
  processingText: {
    color: Colors.text.tertiary,
    textAlign: "center",
    padding: Dimensions.spacing.sm,
  },
  orderPrice: {
    fontSize: Dimensions.fontSize.sm,
    fontWeight: "bold",
    flex: 1,
  },
  bidPrice: {
    color: Colors.action.buy,
  },
  askPrice: {
    color: Colors.action.sell,
  },
  orderAmount: {
    color: Colors.text.primary,
    fontSize: Dimensions.fontSize.sm,
    flex: 1,
    textAlign: "right",
  },
  currentPriceRow: {
    flexDirection: "column",
    marginVertical: Dimensions.spacing.md,
    paddingHorizontal: Dimensions.spacing.md,
  },
  currentOrderPrice: {
    color: Colors.action.sell,
    fontSize: Dimensions.fontSize.xl,
    fontWeight: "bold",
  },
  currentOrderValue: {
    color: Colors.text.tertiary,
    fontSize: Dimensions.fontSize.sm,
  },
});

export default OrderBook;
