import React from "react";
import { ChartType } from "../../app/types/crypto";
import { Feather, Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SymbolHeaderProps {
  priceChange: string;
  chartType: ChartType;
  toggleChartType: () => void;
  toggleIndicators: () => void;
}

const SymbolHeader = ({
  priceChange,
  chartType,
  toggleChartType,
  toggleIndicators,
}: SymbolHeaderProps) => {
  return (
    <View style={styles.symbolContainer}>
      <View style={styles.symbolLeft}>
        <Text style={styles.symbolText}>BTC/USDT</Text>
        <TouchableOpacity>
          <Ionicons name="chevron-down" size={16} color="white" />
        </TouchableOpacity>
        <Text
          style={[
            styles.priceChangeText,
            { color: priceChange.includes("+") ? "#4ADE80" : "#FF4D4F" },
          ]}>
          {priceChange}
        </Text>
      </View>
      <View style={styles.symbolRight}>
        <TouchableOpacity style={styles.iconButton} onPress={toggleChartType}>
          <Feather
            name={chartType === "candlestick" ? "bar-chart-2" : "trending-up"}
            size={22}
            color="white"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={toggleIndicators}>
          <Feather name="layers" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="more-vertical" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  symbolContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  symbolLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  symbolText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 8,
  },
  priceChangeText: {
    color: "#4ADE80",
    fontSize: 14,
    marginLeft: 8,
  },
  symbolRight: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 16,
    padding: 4,
  },
});

export default SymbolHeader;
