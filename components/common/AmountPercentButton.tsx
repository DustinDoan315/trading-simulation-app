import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import Typography from "@/styles/typography";
import { formatAmount } from "@/utils/formatters";

interface AmountPercentButtonProps {
  currentPosition: number;
  setCurrentPosition: (pos: number) => any;
  onChange: (amount: number) => void;
  tradeType: "buy" | "sell";
  availableAmount: number;
  amountUnit: string;
  currentPrice?: number;
  balanceType: "token" | "usdt";
  symbol?: string;
  resetTrigger?: any; // New prop to trigger reset from parent
}

const AmountPercentButton = ({
  currentPosition = 0,
  setCurrentPosition,
  onChange,
  tradeType = "buy",
  availableAmount = 0,
  amountUnit = "BTC",
  currentPrice = 1,
  balanceType = "token",
  resetTrigger,
}: AmountPercentButtonProps) => {
  useEffect(() => {
    if (resetTrigger !== undefined) {
      console.log("Resetting position due to external trigger");
      setCurrentPosition(0);
      onChange(0);
    }
  }, [resetTrigger]);

  const handleCirclePress = (pos: number) => {
    console.log(`Setting position to ${pos}%`);
    setCurrentPosition(pos);
    let amount = 0;
    if (tradeType === "buy" && balanceType === "usdt") {
      amount = (availableAmount * (pos / 100)) / currentPrice;
    } else {
      amount = availableAmount * (pos / 100);
    }
    if (onChange) {
      console.log(`Calling onChange with amount: ${amount}`);
      onChange(amount);
    }
  };

  const getFillColor = () => {
    return tradeType === "buy" ? Colors.action.buy : Colors.action.sell;
  };

  const getMaxAmountText = () => {
    if (tradeType === "buy" && balanceType === "usdt") {
      return `${formatAmount(
        (availableAmount / currentPrice).toFixed(6),
        2
      )}  ${amountUnit}`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonsContainer}>
        {[25, 50, 75, 100].map((pos) => (
          <TouchableOpacity
            key={`button-${pos}`}
            onPress={() => handleCirclePress(pos)}
            style={[
              styles.amountButton,
              {
                backgroundColor:
                  currentPosition === pos
                    ? getFillColor()
                    : Colors.background.tertiary,
                borderColor: getFillColor(),
              },
            ]}>
            <Text
              style={[
                Typography.bodySmall,
                {
                  color:
                    currentPosition === pos
                      ? Colors.background.secondary
                      : Colors.text.primary,
                },
              ]}>
              {pos}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.labelsContainer}>
        <View style={styles.labelRow}>
          <Text style={Typography.label}>Khả dụng</Text>
          <Text style={Typography.bodySmall}>
            {formatAmount(availableAmount, 2)}{" "}
            {tradeType === "buy" ? "USDT" : amountUnit}
          </Text>
        </View>

        {tradeType === "buy" && (
          <View style={styles.labelRow}>
            <Text style={Typography.label}>
              {tradeType === "buy" ? "Mua" : "Bán"} tối đa
            </Text>
            <Text style={Typography.bodySmall}>{getMaxAmountText()}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Dimensions.spacing.xs,
    marginBottom: Dimensions.spacing.lg,
  },
  buttonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Dimensions.spacing.sm,
    marginBottom: Dimensions.spacing.md,
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountButton: {
    paddingHorizontal: Dimensions.spacing.md,
    paddingVertical: Dimensions.spacing.sm,
    borderRadius: Dimensions.radius.sm,
    borderWidth: 1,
    minWidth: 80,
    alignItems: "center",
  },
  labelsContainer: {
    marginTop: Dimensions.spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Dimensions.spacing.xs,
  },
});

export default AmountPercentButton;
