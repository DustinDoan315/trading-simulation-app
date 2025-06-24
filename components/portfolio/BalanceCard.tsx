import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
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
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { formatAmount } from "@/utils/formatters";
import { Asset } from "@/app/types/crypto";
import { height, width } from "@/utils/response";

type BalanceCardProps = {
  balance: string;
  changePercentage: number;
  changeValue: string;
  progress: number;
  assets?: Asset[];
  onResetBalance?: () => void;
};

const getTokenColors = (symbol: string): [string, string] => {
  // Simple hash function to convert symbol to consistent number
  const hash = Array.from(symbol).reduce(
    (hash, char) => char.charCodeAt(0) + ((hash << 5) - hash),
    0
  );

  // Generate colors based on hash
  const hue = Math.abs(hash) % 360;
  const saturation = 70 + (Math.abs(hash) % 30); // 70-100%
  const lightness1 = 40 + (Math.abs(hash) % 20); // 40-60%
  const lightness2 = 60 + (Math.abs(hash) % 20); // 60-80%

  // Convert HSL to HEX
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  return [
    hslToHex(hue, saturation, lightness1),
    hslToHex(hue, saturation, lightness2),
  ];
};

const TOKEN_COLORS = {
  DEFAULT: ["#9EAEFF", "#F7931A"],
};

// Separate utilities into their own functions outside the component
const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) => {
  const angleInRadians = ((angleInDegrees % 360) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
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

  // Handle full circle case
  if (normEndAngle - normStartAngle >= 359.5) {
    const outerRadius = radius + strokeWidth / 2;
    const innerRadius = radius - strokeWidth / 2;

    return `M ${x} ${y - outerRadius} 
            A ${outerRadius} ${outerRadius} 0 1 1 ${x - 0.1} ${y - outerRadius} 
            A ${outerRadius} ${outerRadius} 0 1 1 ${x} ${y - outerRadius} Z
            M ${x} ${y - innerRadius} 
            A ${innerRadius} ${innerRadius} 0 1 0 ${x - 0.1} ${y - innerRadius} 
            A ${innerRadius} ${innerRadius} 0 1 0 ${x} ${y - innerRadius} Z`;
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

// Memoized segment renderer
const SegmentRenderer = React.memo(
  ({
    segment,
    isActive,
    size,
    radius,
    circumference,
    strokeWidth,
    onPress,
  }: any) => (
    <React.Fragment>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={`url(#grad-${segment.id})`}
        strokeWidth={isActive ? strokeWidth + 3 : strokeWidth}
        fill="transparent"
        strokeDasharray={`${segment.segmentLength} ${
          circumference - segment.segmentLength
        }`}
        strokeDashoffset={segment.dashOffset}
        strokeLinecap="butt"
        rotation="0"
        origin={`${size / 2}, ${size / 2}`}
        opacity={isActive ? 1 : 0.8}
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
        onPress={() => onPress(segment.id)}
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

      {isActive && (
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
  )
);

// Memoized legend item
const LegendItem = React.memo(({ segment, isActive, onPress }: any) => (
  <TouchableWithoutFeedback onPress={() => onPress(segment.id)}>
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendColor,
          { backgroundColor: segment.colors[0] },
          isActive && styles.legendColorActive,
        ]}
      />
      <Text style={[styles.legendText, isActive && styles.legendTextActive]}>
        {segment.symbol}
      </Text>
    </View>
  </TouchableWithoutFeedback>
));

const BalanceCard = ({
  balance = "$100,000.00",
  changePercentage,
  changeValue,
  progress,
  assets = [],
  onResetBalance,
}: BalanceCardProps) => {
  const { t } = useLanguage();
  const [activeSegment, setActiveSegment] = React.useState<string | null>(null);
  const timeoutRef = useRef<any>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Size and chart constants - memoized
  const chartParams = useMemo(() => {
    const size = 280;
    const strokeWidth = 25;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    return { size, strokeWidth, radius, circumference };
  }, []);

  const { size, strokeWidth, radius, circumference } = chartParams;

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle animations when active segment changes
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

  // Memoize asset calculations to avoid recalculating on each render
  const { assetsWithNumericValues, totalValue } = useMemo(() => {
    const processedAssets = assets.map((asset) => ({
      ...asset,
      numericValue: parseFloat(asset.value?.replace("$", "").replace(",", "")),
    }));

    const total = processedAssets.reduce(
      (sum, asset) => sum + asset.numericValue,
      0
    );

    return { assetsWithNumericValues: processedAssets, totalValue: total };
  }, [assets]);

  // Memoize segment calculations
  const segments = useMemo(() => {
    if (totalValue === 0) return [];

    return assetsWithNumericValues.map((asset, index) => {
      const assetPercentage = asset.numericValue / totalValue;
      const segmentLength = circumference * assetPercentage;

      const previousSegmentsLength = assetsWithNumericValues
        .slice(0, index)
        .reduce(
          (sum, a) => sum + (a.numericValue / totalValue) * circumference,
          0
        );

      // Calculate angles starting from 0° (right side)
      const startAngle = (previousSegmentsLength / circumference) * 360;
      const endAngle =
        ((previousSegmentsLength + segmentLength) / circumference) * 360;

      // Improve touch target for small segments
      const minAngleSpan = 30;
      const touchExpansion = minAngleSpan * 1.2;
      const angleSpan = endAngle - startAngle;

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

      return {
        ...asset,
        segmentLength,
        dashOffset: index === 0 ? 0 : circumference - previousSegmentsLength,
        percentage: assetPercentage * 100,
        colors: getTokenColors(asset.symbol) || TOKEN_COLORS.DEFAULT,
        startAngle,
        endAngle,
        touchStartAngle,
        touchEndAngle,
        tooltipX,
        tooltipY,
        isSmallSegment: assetPercentage < 0.2,
        assetPercentage,
      };
    });
  }, [assetsWithNumericValues, totalValue, circumference, radius, size]);

  // Memoize segment handling logic
  const handleSegmentPress = useCallback(
    (segmentId: string) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Toggle active segment
      setActiveSegment((current) => (current === segmentId ? null : segmentId));

      // Auto-dismiss after a timeout
      if (segmentId !== activeSegment) {
        timeoutRef.current = setTimeout(() => {
          setActiveSegment(null);
        }, 3000);
      }
    },
    [activeSegment]
  );

  // Find active segment details once
  const activeSegmentDetails = activeSegment
    ? segments.find((segment) => segment.id === activeSegment)
    : null;

  // Simple function to check if segment is active
  const isSegmentActive = useCallback(
    (segmentId: string) => activeSegment === segmentId,
    [activeSegment]
  );

  const isPositive = changePercentage >= 0;

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

        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2A2D3E"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Render segments with memoized component */}
        {segments.map((segment) => (
          <SegmentRenderer
            key={`segment-${segment.id}`}
            segment={segment}
            isActive={isSegmentActive(segment.id)}
            size={size}
            radius={radius}
            circumference={circumference}
            strokeWidth={strokeWidth}
            onPress={handleSegmentPress}
          />
        ))}
      </Svg>

      <View style={styles.contentContainer}>
        <View style={styles.balanceHeader}>
          <Text style={styles.label}>{t("portfolio.availableBalance")}</Text>
        </View>
        <Text style={styles.balance}>{balance}</Text>
        {/* <View style={styles.changeContainer}> */}
          {/* <Ionicons
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
        </View> */}
      </View>

      {/* Legend items */}
      <View style={styles.legendContainer}>
        {segments.map((segment) => (
          <LegendItem
            key={`legend-${segment.id}`}
            segment={segment}
            isActive={isSegmentActive(segment.id)}
            onPress={handleSegmentPress}
          />
        ))}
      </View>

      {activeSegmentDetails && (
        <Animated.View
          style={[
            styles.tokenInfoContainer,
            {
              opacity: fadeAnim,
            },
          ]}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}>
             <View
            style={[
              styles.colorIndicator,
              { backgroundColor: activeSegmentDetails.colors[0] },
            ]}
          />
          <Text style={styles.tokenName}>{activeSegmentDetails.name}</Text>
         </View>
          <Text style={styles.tokenPercentage}>
            {Math.round(activeSegmentDetails.percentage)}%{" "}
            {t("portfolio.ofPortfolio")}
          </Text>

          <Text style={styles.tokenValue}>{`$${formatAmount(
            activeSegmentDetails.value,
            2
          )}`}</Text>
          <Text style={styles.tokenAmount}>
            {formatAmount(activeSegmentDetails.amount, 2)}{" "}
            {activeSegmentDetails.symbol}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 8,
    marginTop: 20,

  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(140, 158, 255, 0.1)",
  },
  resetText: {
    color: "#8C9EFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 50,
    paddingHorizontal: 16,
    paddingVertical: 70,
    position: "relative",
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
    marginTop: -height * 0.03,
  },
  balance: {
    fontSize: 26,
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
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "flex-start",
    width: 180,
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
    marginRight: 6,
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

export default React.memo(BalanceCard);
