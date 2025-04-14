import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import Typography from "@/styles/typography";
import { formatCurrency } from "@/utils/formatters";

const OrderBookItem = ({
  price,
  amount,
  type,
  onPress,
  isCurrentPrice = false,
  usdValue = null,
}: any) => {
  // Determine styles based on order type (bid/ask)
  const priceStyle = type === "bid" ? styles.bidPrice : styles.askPrice;

  // For current price row (highlighted)
  if (isCurrentPrice) {
    return (
      <TouchableOpacity
        style={styles.currentPriceRow}
        onPress={onPress}
        activeOpacity={0.7}>
        <Text style={styles.currentOrderPrice}>{price}</Text>
        <Text style={styles.currentOrderValue}>
          {usdValue ??
            (price
              ? formatCurrency(parseFloat(price.replace(",", ".")) * 83000)
              : formatCurrency(0))}
        </Text>
      </TouchableOpacity>
    );
  }

  // Regular order book row
  return (
    <TouchableOpacity
      style={styles.orderRow}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text style={[styles.orderPrice, priceStyle]}>{price}</Text>
      <Text style={styles.orderAmount}>{amount}</Text>
    </TouchableOpacity>
  );
};

const OrderBook = ({
  askOrders = [],
  bidOrders = [],
  currentPrice,
  onSelectPrice,
  maxVisibleOrders = 5,
}: any) => {
  // Handle price selection
  const handlePriceSelect = (price: any) => {
    if (onSelectPrice) {
      onSelectPrice(price);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Giá (USDT)</Text>
        <Text style={styles.headerText}>Số lượng (BTC)</Text>
      </View>

      {/* Ask Orders (Sell side) */}
      <View style={styles.ordersSection}>
        {askOrders.slice(0, maxVisibleOrders).map((order: any, index: any) => (
          <OrderBookItem
            key={`ask-${index}`}
            price={order.price}
            amount={order.amount}
            type="ask"
            onPress={() => handlePriceSelect(order.price)}
          />
        ))}
      </View>

      {/* Current Price */}
      <OrderBookItem
        price={currentPrice}
        amount=""
        isCurrentPrice={true}
        onPress={() => handlePriceSelect(currentPrice)}
      />

      {/* Bid Orders (Buy side) */}
      <View style={styles.ordersSection}>
        {bidOrders.slice(0, maxVisibleOrders).map((order: any, index: any) => (
          <OrderBookItem
            key={`bid-${index}`}
            price={order.price}
            amount={order.amount}
            type="bid"
            onPress={() => handlePriceSelect(order.price)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Dimensions.radius.md,
    borderWidth: Dimensions.border.thin,
    borderColor: Colors.border.light,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Dimensions.spacing.md,
    paddingVertical: Dimensions.spacing.sm,
    borderBottomWidth: Dimensions.border.thin,
    borderBottomColor: Colors.border.medium,
  },
  headerText: {
    ...Typography.label,
  },
  ordersSection: {
    maxHeight: Dimensions.components.orderBookMaxHeight / 2,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Dimensions.spacing.sm,
    paddingHorizontal: Dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(34, 34, 34, 0.5)",
  },
  orderPrice: {
    fontSize: Dimensions.fontSize.md,
    fontWeight: "500",
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
    fontSize: Dimensions.fontSize.md,
    flex: 1,
    textAlign: "right",
  },
  currentPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Dimensions.spacing.md,
    paddingHorizontal: Dimensions.spacing.md,
    backgroundColor: Colors.action.sellLight,
    borderLeftWidth: Dimensions.border.medium,
    borderLeftColor: Colors.action.sell,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.medium,
    borderTopWidth: 1,
    borderTopColor: Colors.border.medium,
  },
  currentOrderPrice: {
    color: Colors.action.sell,
    fontSize: Dimensions.fontSize.lg,
    fontWeight: "bold",
  },
  currentOrderValue: {
    color: Colors.text.tertiary,
    fontSize: Dimensions.fontSize.sm,
  },
});

export default OrderBook;
