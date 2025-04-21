import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, PanResponder, Animated } from "react-native";
import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import Typography from "@/styles/typography";

const AmountSlider = ({
  position = 30,
  onChange,
  tradeType = "buy",
  availableAmount = 0,
  amountUnit = "BTC",
}: any) => {
  // Create animated value for smooth slider movement
  const panX: any = useRef(new Animated.Value(position)).current;

  // Update animated value when position prop changes
  useEffect(() => {
    panX.setValue(position);
  }, [position, panX]);

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
        // Calculate allowed movement based on parent width
        // Using 300 as an approximation - in a real app we would measure the actual width
        const parentWidth = 300;
        const newPosition = Math.max(
          0,
          Math.min(100, panX._offset + (dx / parentWidth) * 100)
        );
        panX.setValue(newPosition - panX._offset);
      },
      onPanResponderRelease: () => {
        // Add current value to offset and reset value
        panX.flattenOffset();

        // Snap to nearest 25% mark
        const snapThreshold = 12.5;
        const snappedValue = Math.round(panX._value / 25) * 25;
        const shouldSnap = Math.abs(panX._value - snappedValue) < snapThreshold;
        const finalValue = shouldSnap ? snappedValue : panX._value;

        // Animate to final position
        Animated.spring(panX, {
          toValue: finalValue,
          useNativeDriver: false,
        }).start();

        // Call onChange with the final position
        if (onChange) {
          onChange(finalValue);
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

  return (
    <View style={styles.container}>
      <View style={styles.sliderTrack}>
        {/* Segment markers and circle indicators */}
        <View style={[styles.segmentMarker, { left: "25%" }]} />
        <View style={[styles.segmentMarker, { left: "50%" }]} />
        <View style={[styles.segmentMarker, { left: "75%" }]} />
        <View style={[styles.segmentCircle, { left: "0%" }]} />
        <View style={[styles.segmentCircle, { left: "25%" }]} />
        <View style={[styles.segmentCircle, { left: "50%" }]} />
        <View style={[styles.segmentCircle, { left: "75%" }]} />
        <View style={[styles.segmentCircle, { left: "100%" }]} />
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
            },
          ]}
          {...panResponder.panHandlers}
        />
      </View>

      <View style={styles.labelsContainer}>
        <View style={styles.labelRow}>
          <Text style={Typography.label}>Khả dụng</Text>
          <Text style={Typography.bodySmall}>
            {availableAmount} {amountUnit}
          </Text>
        </View>

        <View style={styles.labelRow}>
          <Text style={Typography.label}>
            {tradeType === "buy" ? "Mua" : "Bán"} tối đa
          </Text>
          <Text style={Typography.bodySmall}>{position.toFixed(2)}%</Text>
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
    // Shadow for iOS
    shadowColor: Colors.background.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    // Shadow for Android
    elevation: 5,
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
