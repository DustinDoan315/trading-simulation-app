import React from 'react';
import Svg, {
    Circle,
    Defs,
    LinearGradient,
    Stop
    } from 'react-native-svg';
import {
    Dimensions,
    StyleSheet,
    Text,
    View
    } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


type BalanceCardProps = {
  balance: string;
  changePercentage: number;
  changeValue: string;
  progress: number;
};

const BalanceCard = ({
  balance,
  changePercentage,
  changeValue,
  progress,
}: BalanceCardProps) => {
  const size = 280;
  const strokeWidth = 25;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference * (1 - progress);

  const isPositive = changePercentage >= 0;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#6674CC" />
            <Stop offset="100%" stopColor="#8C9EFF" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2A2D3E"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#grad)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={styles.contentContainer}>
        <Text style={styles.label}>Available Balance</Text>
        <View style={styles.spacer} />
        <Text style={styles.balance}>{balance}</Text>
        <View style={styles.spacer} />
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
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressText}>
            {Math.round(progress * 100)}% of Goal
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    justifyContent: "space-around",
    height: 200,
    width: 200,
  },
  spacer: {
    height: 10,
  },
  label: {
    fontSize: 14,
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
    paddingVertical: 4,
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
  progressTextContainer: {
    marginTop: 15,
    marginBottom: 10,
    backgroundColor: "#1A1D2F",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  progressText: {
    color: "#9DA3B4",
    fontWeight: "500",
  },
});

export default BalanceCard;
