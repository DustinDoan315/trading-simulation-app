import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import React, { useState } from "react";
import Typography from "@/styles/typography";
import useOrderBook from "@/hooks/useOrderBook";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatAmount } from "@/utils/formatters";
import { OrderBookItemProps, OrderBookProps } from "../../types/components";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";

const OrderBookItem: React.FC<OrderBookItemProps> = ({
  price,
  amount,
  type,
  onPress,
  onLongPress,
  isCurrentPrice = false,
}) => {
  const priceStyle = type === "bid" ? styles.bidPrice : styles.askPrice;

  if (isCurrentPrice) {
    return (
      <TouchableOpacity
        style={styles.currentPriceRow}
        onPress={onPress}
        activeOpacity={0.7}>
        <Text style={styles.currentOrderPrice}>{formatAmount(price, 1)}</Text>
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
        {formatAmount(price, 1)}
      </Text>
      <Text style={styles.orderAmount}>{formatAmount(amount, 2)}</Text>
    </TouchableOpacity>
  );
};

const OrderBook: React.FC<OrderBookProps> = ({
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
  const {
    askOrders: hookAskOrders,
    bidOrders: hookBidOrders,
    currentPrice: hookCurrentPrice,
  } = useOrderBook(symbol);
  const [baseCurrency] = symbol.split("/");
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useUser();

  // Use props if provided, otherwise use hook data
  const askOrders = propAskOrders || hookAskOrders;
  const bidOrders = propBidOrders || hookBidOrders;
  const currentPrice = propCurrentPrice || hookCurrentPrice;

  const handlePriceSelect = (price: any) => {
    if (onSelectPrice) {
      onSelectPrice(price);
    }
  };

  const handleTrade = async (type: "BUY" | "SELL", price: number) => {
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
  };

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

      <View style={styles.ordersSection}>
        {askOrders.slice(0, maxVisibleOrders).map((order: any, index: any) => (
          <OrderBookItem
            key={`ask-${index}`}
            price={order.price}
            amount={order.amount}
            type="ask"
            onPress={() => handlePriceSelect(order.price)}
            onLongPress={() => handleTrade("SELL", order.price)}
          />
        ))}
      </View>

      <OrderBookItem
        price={currentPrice}
        amount=""
        type="ask"
        isCurrentPrice={true}
        onPress={() => handlePriceSelect(currentPrice)}
      />

      <View style={styles.ordersSection}>
        {bidOrders.slice(0, maxVisibleOrders).map((order: any, index: any) => (
          <OrderBookItem
            key={`bid-${index}`}
            price={order.price}
            amount={order.amount}
            type="bid"
            onPress={() => handlePriceSelect(order.price)}
            onLongPress={() => handleTrade("BUY", order.price)}
          />
        ))}
      </View>
      {isProcessing && (
        <Text style={styles.processingText}>{t("order.processing")}</Text>
      )}
    </View>
  );
};

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
