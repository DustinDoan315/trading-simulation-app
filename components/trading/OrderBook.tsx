import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import useOrderBook from "@/hooks/useOrderBook";
import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import Typography from "@/styles/typography";
import { formatAmount } from "@/utils/formatters";
import { useUser } from "@/context/UserContext";

const OrderBookItem = ({
  price,
  amount,
  type,
  onPress,
  onLongPress,
  isCurrentPrice = false,
}: any) => {
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

const OrderBook = ({
  symbol = "BTC",
  onSelectPrice,
  maxVisibleOrders = 5,
  onTradeExecuted,
}: any) => {
  const { askOrders, bidOrders, currentPrice } = useOrderBook(symbol);
  const [baseCurrency] = symbol.split("/");
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useUser();

  const handlePriceSelect = (price: any) => {
    if (onSelectPrice) {
      onSelectPrice(price);
    }
  };

  const handleTrade = async (type: "BUY" | "SELL", price: number) => {
    if (!user || !user.uuid) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setIsProcessing(true);
    try {
      Alert.alert("Success", `${type} order executed`);
      if (onTradeExecuted) onTradeExecuted();
    } catch (error: any) {
      Alert.alert("Error", error.message || `Failed to execute ${type} order`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.priceHeaderText}>Price ({"USDT"})</Text>
        <Text style={styles.amountHeaderText}>Amount ({baseCurrency})</Text>
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
        <Text style={styles.processingText}>Processing trade...</Text>
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
