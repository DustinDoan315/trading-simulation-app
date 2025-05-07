import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, PanResponder, Animated } from "react-native";
import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import Typography from "@/styles/typography";

interface AmountSliderProps {
  position?: number;
  onChange: (amount: number) => void;
  tradeType: "buy" | "sell";
  availableAmount: number;
  amountUnit: string;
  currentPrice?: number; // Required for buy calculations
  balanceType: "token" | "usdt"; // Whether availableAmount is in tokens or USDT
  symbol?: string; // Symbol for the balance currency (e.g. "USDT")
}

const AmountSlider = ({
  position = 30,
  onChange,
  tradeType = "buy",
  availableAmount = 0,
  amountUnit = "BTC",
  currentPrice = 1,
  balanceType = "token",
  symbol,
}: AmountSliderProps) => {
  // Create animated value for smooth slider movement
  const panX: any = useRef(new Animated.Value(position)).current;

  // Update animated value when position prop changes
  useEffect(() => {
    panX.setValue(position);
  }, [position, panX]);

  // Measure actual slider width for precise dragging
  const sliderWidth = useRef(300);
  const handleSliderLayout = (event: any) => {
    sliderWidth.current = event.nativeEvent.layout.width;
  };

  // Create pan responder for dragging the slider handle
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Store current value to avoid jumps when dragging starts
        panX.setOffset(panX._value);
        panX.setValue(0);
      },
      onPanResponderMove: (_, { dx }) => {
        // Calculate new position based on actual slider width
        const newPosition = Math.max(
          0,
          Math.min(100, panX._offset + (dx / sliderWidth.current) * 100)
        );
        panX.setValue(newPosition - panX._offset);
      },
      onPanResponderRelease: () => {
        panX.flattenOffset();

        // Snap to nearest 25% mark with smooth animation
        const snappedValue = Math.round(panX._value / 25) * 25;
        const finalValue =
          Math.abs(panX._value - snappedValue) < 12.5
            ? snappedValue
            : panX._value;

        Animated.spring(panX, {
          toValue: finalValue,
          useNativeDriver: true,
          damping: 15,
          stiffness: 100,
        }).start();

        // Calculate actual amount based on position percentage
        let amount = 0;
        if (tradeType === "buy" && balanceType === "usdt") {
          // For buy orders with USDT balance, calculate token amount
          amount = (availableAmount * (finalValue / 100)) / currentPrice;
        } else {
          // For sell orders or token balance, use percentage directly
          amount = availableAmount * (finalValue / 100);
        }

        // Call onChange with the actual amount
        if (onChange) {
          onChange(amount);
        }
      },
    })
  ).current;

  // Get slider fill color based on trade type
  const getFillColor = () => {
    return tradeType === "buy" ? Colors.action.buy : Colors.action.sell;
  };

  // Get slider handle border color
  const getHandleBorderColor = () => {
    return tradeType === "buy" ? Colors.action.buy : Colors.action.sell;
  };

  const getMaxAmountText = () => {
    if (tradeType === "buy" && balanceType === "usdt") {
      return `${(
        (availableAmount * (position / 100)) /
        currentPrice
      ).toFixed(6)} ${amountUnit}`;
    }
    return `${(availableAmount * (position / 100)).toFixed(6)} ${amountUnit}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.sliderTrack} onLayout={handleSliderLayout}>
        {/* Segment markers and circle indicators */}
        {[25, 50, 75].map((pos) => (
          <View key={`marker-${pos}`} style={[styles.segmentMarker, { left: `${pos}%` }]} />
        ))}
        {[0, 25, 50, 75, 100].map((pos) => (
          <View key={`circle-${pos}`} style={[styles.segmentCircle, { left: `${pos}%` }]} />
        ))}
        <Animated.View
          style={[
            styles.sliderFill,
            {
              width: panX.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
              backgroundColor: getFillColor(),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.sliderHandle,
            {
              left: panX.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
              borderColor: getHandleBorderColor(),
              transform: [
                {
                  scale: panX.interpolate({
                    inputRange: [0, 100],
                    outputRange: [1, 1.1],
                    extrapolate: "clamp",
                  }),
                },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        />
      </View>

      <View style={styles.labelsContainer}>
        <View style={styles.labelRow}>
          <Text style={Typography.label}>Khả dụng</Text>
          <Text style={Typography.bodySmall}>
            {availableAmount} {'USDT'}
          </Text>
        </View>

        <View style={styles.labelRow}>
          <Text style={Typography.label}>
            {tradeType === "buy" ? "Mua" : "Bán"} tối đa
          </Text>
          <Text style={Typography.bodySmall}>
            {getMaxAmountText()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Dimensions.spacing.md,
    marginBottom: Dimensions.spacing.lg,
  },
  sliderTrack: {
    height: Dimensions.components.sliderTrackHeight,
    backgroundColor: Colors.background.tertiary,
    borderRadius: Dimensions.radius.xs,
    marginBottom: Dimensions.spacing.md,
    position: "relative",
  },
  sliderFill: {
    height: Dimensions.components.sliderTrackHeight,
    backgroundColor: Colors.action.buy,
    borderRadius: Dimensions.radius.xs,
  },
  sliderHandle: {
    position: "absolute",
    width: Dimensions.components.sliderHandleSize,
    height: Dimensions.components.sliderHandleSize,
    borderRadius: Dimensions.components.sliderHandleSize / 2,
    backgroundColor: Colors.background.secondary,
    borderWidth: Dimensions.border.medium,
    borderColor: Colors.action.buy,
    marginLeft: -Dimensions.components.sliderHandleSize / 2,
    top:
      -(
        Dimensions.components.sliderHandleSize -
        Dimensions.components.sliderTrackHeight
      ) / 2,
    // Enhanced shadow
    shadowColor: Colors.background.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  labelsContainer: {
    marginTop: Dimensions.spacing.sm,
  },
  segmentMarker: {
    position: "absolute",
    width: 1,
    height: Dimensions.components.sliderTrackHeight + 4,
    backgroundColor: Colors.background.primary,
    top: -2,
  },
  segmentCircle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 6,
    backgroundColor: Colors.text.inactive,
    top: Dimensions.components.sliderTrackHeight / 2 - 4,
    marginLeft: -4,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Dimensions.spacing.xs,
  },
});

export default AmountSlider;
