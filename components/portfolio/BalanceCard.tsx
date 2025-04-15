import React, { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

type Asset = {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  value: string;
  changePercentage: number;
  icon: any;
};

type BalanceCardProps = {
  balance: string;
  changePercentage: number;
  changeValue: string;
  progress: number;
  assets?: Asset[];
};

const TOKEN_COLORS = {
  BTC: ["#F7931A", "#FFC24D"],
  ETH: ["#627EEA", "#9EAEFF"],
  DEFAULT: ["#9EAEFF", "#F7931A"],
};

const BalanceCard = ({
  balance,
  changePercentage,
  changeValue,
  progress,
  assets = [],
}: BalanceCardProps) => {
  console.log(
    "Rendering BalanceCard with assets:",
    assets.map((a) => `${a.symbol}: ${a.value}`)
  );
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const screenWidth = Dimensions.get("window").width;

  // useEffect(() => {
  //   return () => {
  //     if (timeoutRef.current) {
  //       clearTimeout(timeoutRef.current);
  //     }
  //   };
  // }, []);

  useEffect(() => {
    if (activeSegment) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ]).start();

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [activeSegment, scaleAnim, fadeAnim]);

  const size = 280;
  const strokeWidth = 25;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const isPositive = changePercentage >= 0;

  const assetsWithNumericValues = assets.map((asset) => ({
    ...asset,
    numericValue: parseFloat(asset.value.replace("$", "").replace(",", "")),
  }));

  const totalValue = assetsWithNumericValues.reduce(
    (sum, asset) => sum + asset.numericValue,
    0
  );

  const segments = assetsWithNumericValues.map((asset, index) => {
    const assetPercentage = asset.numericValue / totalValue;

    const segmentLength = circumference * assetPercentage; // Keep visual segment as actual value
    const previousSegmentsLength = assetsWithNumericValues
      .slice(0, index)
      .reduce(
        (sum, a) => sum + (a.numericValue / totalValue) * circumference,
        0
      );

    // Calculate angles starting from 0° (right side) and covering full 360°
    const startAngle = (previousSegmentsLength / circumference) * 360;
    const endAngle =
      ((previousSegmentsLength + segmentLength) / circumference) * 360;

    // Calculate the angle span of this segment
    let angleSpan = endAngle - startAngle;
    // Fix for negative angleSpan (when crossing 0/360 boundary)
    if (angleSpan < 0) angleSpan += 360;

    console.log(
      `${asset.symbol} segment: ${
        assetPercentage * 100
      }%, angles: ${startAngle.toFixed(2)}° to ${endAngle.toFixed(
        2
      )}°, span: ${angleSpan.toFixed(2)}°`
    );

    // Minimum angle span for easier touch targeting (30 degrees provides better touch targets)
    const minAngleSpan = 30;

    // For all segments, use expanded touch area
    const touchExpansion = minAngleSpan * 1.2;

    // Adjusted angles for touch area - expand small segments to ensure touchability
    const touchStartAngle =
      angleSpan < touchExpansion
        ? startAngle - (touchExpansion - angleSpan) / 2
        : startAngle;

    const touchEndAngle =
      angleSpan < touchExpansion
        ? endAngle + (touchExpansion - angleSpan) / 2
        : endAngle;

    const centerAngle = (startAngle + endAngle) / 2;
    const tooltipX =
      size / 2 + Math.cos((centerAngle * Math.PI) / 180) * (radius / 1.3);
    const tooltipY =
      size / 2 + Math.sin((centerAngle * Math.PI) / 180) * (radius / 1.3);

    const isLargeSegment = assetPercentage > 0.36;

    const useTouchCircle = false;

    return {
      ...asset,
      segmentLength,
      dashOffset: index === 0 ? 0 : circumference - previousSegmentsLength,
      percentage: assetPercentage * 100,
      colors:
        TOKEN_COLORS[asset.symbol.toUpperCase() as keyof typeof TOKEN_COLORS] ||
        TOKEN_COLORS.DEFAULT,
      startAngle,
      endAngle,
      touchStartAngle,
      touchEndAngle,
      tooltipX,
      tooltipY,
      isSmallSegment: assetPercentage < 0.2,
      isLargeSegment,
      useTouchCircle,
      assetPercentage,
    };
  });

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    if (isNaN(angleInDegrees)) {
      console.log("WARNING: Invalid angle detected:", angleInDegrees);
      angleInDegrees = 0;
    }

    const angleInRadians = ((angleInDegrees % 360) * Math.PI) / 180.0;
    const result = {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };

    if (isNaN(result.x) || isNaN(result.y)) {
      console.log(
        "WARNING: Invalid coordinate calculated:",
        result,
        "from angle",
        angleInDegrees
      );
    }

    return result;
  };

  const createArcPath = (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    strokeWidth: number
  ) => {
    const normalizeAngle = (angle: number) => {
      let result = angle % 360;
      if (result < 0) result += 360;
      return result;
    };

    let normStartAngle = normalizeAngle(startAngle);
    let normEndAngle = normalizeAngle(endAngle);

    if (normEndAngle <= normStartAngle) {
      normEndAngle += 360;
    }

    // Special case for full circle
    if (normEndAngle - normStartAngle >= 359.5) {
      return `M ${x} ${y - radius - strokeWidth / 2} 
              A ${radius + strokeWidth / 2} ${radius + strokeWidth / 2} 0 1 1 ${
        x - 0.1
      } ${y - radius - strokeWidth / 2} 
              A ${radius + strokeWidth / 2} ${
        radius + strokeWidth / 2
      } 0 1 1 ${x} ${y - radius - strokeWidth / 2} Z
              M ${x} ${y - radius + strokeWidth / 2} 
              A ${radius - strokeWidth / 2} ${radius - strokeWidth / 2} 0 1 0 ${
        x - 0.1
      } ${y - radius + strokeWidth / 2} 
              A ${radius - strokeWidth / 2} ${
        radius - strokeWidth / 2
      } 0 1 0 ${x} ${y - radius + strokeWidth / 2} Z`;
    }

    const innerRadius = radius - strokeWidth / 2;
    const outerRadius = radius + strokeWidth / 2;

    const startOuter = polarToCartesian(x, y, outerRadius, normStartAngle);
    const endOuter = polarToCartesian(x, y, outerRadius, normEndAngle);
    const startInner = polarToCartesian(x, y, innerRadius, normStartAngle);
    const endInner = polarToCartesian(x, y, innerRadius, normEndAngle);

    const largeArcFlag = normEndAngle - normStartAngle <= 180 ? "0" : "1";

    return `M ${startOuter.x} ${startOuter.y}
            A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}
            L ${endInner.x} ${endInner.y}
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}
            Z`;
  };

  const handleSegmentPress = (segmentId: string) => {
    console.log("Pressed segment:", segmentId);
    const segment = segments.find((s) => s.id === segmentId);

    if (segment) {
      console.log(
        `Successfully pressed ${
          segment.symbol
        } segment with percentage ${segment.percentage.toFixed(2)}%`
      );

      // if (timeoutRef.current) {
      //   clearTimeout(timeoutRef.current);
      // }

      if (activeSegment === segmentId) {
        setActiveSegment(null);
        console.log("Deactivated segment:", segmentId);
      } else {
        setActiveSegment(segmentId);
        console.log("Activated segment:", segmentId);

        // Auto-dismiss after a longer timeout (3 seconds)
        timeoutRef.current = setTimeout(() => {
          setActiveSegment(null);
          console.log("Auto-dismissed segment:", segmentId);
        }, 3000);
      }
    } else {
      console.error("Failed to find segment with ID:", segmentId);
    }
  };

  const activeSegmentDetails = activeSegment
    ? segments.find((segment) => segment.id === activeSegment)
    : null;

  const isSegmentActive = (segmentId: string) => activeSegment === segmentId;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          {segments.map((segment) => (
            <LinearGradient
              key={`grad-${segment.id}`}
              id={`grad-${segment.id}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%">
              <Stop offset="0%" stopColor={segment.colors[0]} />
              <Stop offset="100%" stopColor={segment.colors[1]} />
            </LinearGradient>
          ))}
        </Defs>

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2A2D3E"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {segments.map((segment) => (
          <React.Fragment key={`segment-group-${segment.id}`}>
            <Circle
              key={`segment-${segment.id}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={`url(#grad-${segment.id})`}
              strokeWidth={
                isSegmentActive(segment.id) ? strokeWidth + 3 : strokeWidth
              }
              fill="transparent"
              strokeDasharray={`${segment.segmentLength} ${
                circumference - segment.segmentLength
              }`}
              strokeDashoffset={segment.dashOffset}
              strokeLinecap="butt"
              rotation="0"
              origin={`${size / 2}, ${size / 2}`}
              opacity={isSegmentActive(segment.id) ? 1 : 0.8}
            />

            <Path
              d={createArcPath(
                size / 2,
                size / 2,
                radius,
                segment.touchStartAngle,
                segment.touchEndAngle,
                strokeWidth + 10
              )}
              fill="transparent"
              onPress={() => handleSegmentPress(segment.id)}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />

            <Circle
              cx={segment.tooltipX}
              cy={segment.tooltipY}
              r={4}
              fill={segment.colors[0]}
              opacity={0.7}
              stroke="white"
              strokeWidth={0.5}
            />

            {isSegmentActive(segment.id) && (
              <Circle
                cx={segment.tooltipX}
                cy={segment.tooltipY}
                r={6}
                fill={segment.colors[0]}
                stroke="white"
                strokeWidth={1.5}
              />
            )}
          </React.Fragment>
        ))}
      </Svg>

      <View style={styles.contentContainer}>
        <Text style={styles.label}>Available Balance</Text>
        <Text style={styles.balance}>{balance}</Text>
        <View style={styles.changeContainer}>
          <Ionicons
            name={isPositive ? "caret-up" : "caret-down"}
            size={18}
            color={isPositive ? "#8C9EFF" : "#FF6B6B"}
          />
          <Text
            style={[
              styles.change,
              isPositive ? styles.positive : styles.negative,
            ]}>
            {isPositive ? "+" : ""}
            {changePercentage}% ({changeValue})
          </Text>
        </View>
      </View>

      <View style={styles.legendContainer}>
        {segments.map((segment) => (
          <TouchableWithoutFeedback
            key={`legend-${segment.id}`}
            onPress={() => handleSegmentPress(segment.id)}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: segment.colors[0] },
                  isSegmentActive(segment.id) && styles.legendColorActive,
                ]}
              />
              <Text
                style={[
                  styles.legendText,
                  isSegmentActive(segment.id) && styles.legendTextActive,
                ]}>
                {segment.symbol}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        ))}
      </View>

      {activeSegmentDetails && (
        <Animated.View
          style={[
            styles.tokenInfoContainer,
            {
              opacity: fadeAnim,
              left:
                activeSegmentDetails.tooltipX > size / 2
                  ? Math.min(activeSegmentDetails.tooltipX, screenWidth - 150)
                  : Math.max(10, activeSegmentDetails.tooltipX - 130),
              top:
                activeSegmentDetails.tooltipY > size / 2
                  ? activeSegmentDetails.tooltipY + 10
                  : activeSegmentDetails.tooltipY - 90,
            },
          ]}>
          <View
            style={[
              styles.colorIndicator,
              { backgroundColor: activeSegmentDetails.colors[0] },
            ]}
          />
          <Text style={styles.tokenName}>{activeSegmentDetails.name}</Text>
          <Text style={styles.tokenValue}>{activeSegmentDetails.value}</Text>
          <Text style={styles.tokenPercentage}>
            {Math.round(activeSegmentDetails.percentage)}% of portfolio
          </Text>
          <Text style={styles.tokenAmount}>
            {activeSegmentDetails.amount} {activeSegmentDetails.symbol}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 50,
    paddingHorizontal: 16,
    paddingVertical: 70,
    position: "relative",
  },
  hitBoxContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 10,
  },
  hitBox: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    zIndex: 10,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    padding: 5,
    backgroundColor: "rgba(26, 29, 47, 0.7)",
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendColorActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "white",
  },
  legendText: {
    color: "#9DA3B4",
    fontSize: 12,
    fontWeight: "500",
  },
  legendTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  svg: {
    position: "absolute",
    shadowColor: "#6674CC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  contentContainer: {
    alignItems: "center",
    width: 200,
  },
  label: {
    fontSize: 16,
    color: "#9DA3B4",
    fontWeight: "bold",
    marginTop: 25,
  },
  balance: {
    fontSize: 30,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(255, 255, 255, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "rgba(26, 29, 47, 0.7)",
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  change: {
    fontSize: 16,
    marginLeft: 2,
    fontWeight: "600",
  },
  positive: {
    color: "#8C9EFF",
  },
  negative: {
    color: "#FF6B6B",
  },
  tokenInfoContainer: {
    position: "absolute",
    backgroundColor: "rgba(26, 29, 47, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "flex-start",
    width: 130,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(140, 158, 255, 0.3)",
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 6,
  },
  tokenName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  tokenValue: {
    color: "white",
    fontSize: 14,
    marginTop: 2,
  },
  tokenPercentage: {
    color: "#9DA3B4",
    fontSize: 12,
    marginTop: 4,
  },
  tokenAmount: {
    color: "white",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
});

export default BalanceCard;
