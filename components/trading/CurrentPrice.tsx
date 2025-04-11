import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import Typography from "@/styles/typography";
import { formatTime } from "@/utils/formatters";

const CurrentPrice = ({
  price,
  timestamp = new Date(),
  priceType = "ask", // 'ask' or 'bid'
}: any) => {
  // Get current time if timestamp is not provided
  const formattedTime = formatTime(timestamp);

  // Determine price color based on type
  const priceColor =
    priceType === "bid" ? Colors.action.buy : Colors.action.sell;

  return (
    <View style={styles.container}>
      <View style={styles.priceBox}>
        <Text style={[styles.priceText, { color: priceColor }]}>{price}</Text>
        <Text style={styles.timestampText}>{formattedTime}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: Dimensions.spacing.xl,
    top: Dimensions.components.chartHeight - 30, // Position at the bottom of the chart
    zIndex: 50,
  },
  priceBox: {
    backgroundColor: Colors.ui.priceBoxBg,
    borderColor: Colors.border.light,
    borderWidth: Dimensions.border.thin,
    borderRadius: Dimensions.radius.sm,
    padding: Dimensions.spacing.md,
    alignItems: "center",

    // Shadow for iOS
    shadowColor: Colors.background.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    // Shadow for Android
    elevation: 3,
  },
  priceText: {
    ...Typography.currentPrice,
  },
  timestampText: {
    ...Typography.timestamp,
    marginTop: Dimensions.spacing.xs,
  },
});

export default CurrentPrice;
