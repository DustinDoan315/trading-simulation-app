import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import Typography from "@/styles/typography";

// Available timeframes
const TIMEFRAMES = ["15m", "1h", "4h", "1d", "3d", "1w"];

const TimeframeSelector = ({
  selectedTimeframe,
  onTimeframeChange,
  showIndicators,
  onToggleIndicators,
}: any) => {
  // Determine style for timeframe button based on selection state
  const getTimeframeButtonStyle = (timeframe: any) => {
    return [
      styles.timeframeButton,
      selectedTimeframe === timeframe && styles.timeframeButtonActive,
    ];
  };

  // Determine text style for timeframe based on selection state
  const getTimeframeTextStyle = (timeframe: any) => {
    return [
      styles.timeframeText,
      selectedTimeframe === timeframe && styles.timeframeTextActive,
    ];
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {TIMEFRAMES.map((timeframe) => (
          <TouchableOpacity
            key={timeframe}
            style={getTimeframeButtonStyle(timeframe)}
            onPress={() => onTimeframeChange(timeframe)}
            activeOpacity={0.7}>
            <Text style={getTimeframeTextStyle(timeframe)}>{timeframe}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.indicatorButton}
        onPress={onToggleIndicators}
        activeOpacity={0.7}>
        <Text style={styles.indicatorText}>
          {showIndicators ? "Ẩn" : "Hiện"}
        </Text>
        <Ionicons
          name={showIndicators ? "chevron-down" : "chevron-up"}
          size={16}
          color={Colors.text.primary}
          style={styles.indicatorIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Dimensions.spacing.md,
    paddingVertical: Dimensions.spacing.sm,
    borderBottomWidth: Dimensions.border.thin,
    borderBottomColor: Colors.border.dark,
  },
  scrollContent: {
    paddingRight: Dimensions.spacing.lg, // Extra padding at the end
  },
  timeframeButton: {
    paddingHorizontal: Dimensions.spacing.md,
    paddingVertical: Dimensions.spacing.sm,
    marginRight: Dimensions.spacing.sm,
  },
  timeframeButtonActive: {
    borderBottomWidth: Dimensions.border.medium,
    borderBottomColor: Colors.action.primary,
  },
  timeframeText: {
    color: Colors.text.tertiary,
    fontSize: Dimensions.fontSize.md,
  },
  timeframeTextActive: {
    color: Colors.text.primary,
    fontWeight: "bold",
  },
  indicatorButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Dimensions.spacing.sm,
    paddingVertical: Dimensions.spacing.xs,
  },
  indicatorText: {
    color: Colors.text.primary,
    fontSize: Dimensions.fontSize.sm,
    marginRight: Dimensions.spacing.xs,
  },
  indicatorIcon: {
    marginTop: 2, // Slight adjustment for better alignment
  },
});

export default TimeframeSelector;
