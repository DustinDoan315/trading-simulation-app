import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface PriceIndicatorProps {
  currentPrice: string;
}

const PriceIndicator = ({ currentPrice }: PriceIndicatorProps) => {
  return (
    <View style={styles.currentPriceContainer}>
      <View style={styles.currentPriceBox}>
        <Text style={styles.currentPriceText}>{currentPrice}</Text>
        <Text style={styles.timestampText}>01:52</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  currentPriceContainer: {
    position: "absolute",
    right: 20,
    top: 270,
    zIndex: 50,
  },
  currentPriceBox: {
    backgroundColor: "rgba(0,0,0,0.7)",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
  },
  currentPriceText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  timestampText: {
    color: "#777",
    fontSize: 12,
  },
});

export default PriceIndicator;
