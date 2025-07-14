import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Typography from "@/styles/typography";
import { formatAmount } from "@/utils/formatters";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "@/context/LanguageContext";

// Symbol-specific fallback prices
const getFallbackPrice = (symbol: string): number => {
  const symbolUpper = symbol.toUpperCase();
  switch (symbolUpper) {
    case "BTC":
      return 122000;
    case "ETH":
      return 3100;
    case "SOL":
      return 166;
    case "BNB":
      return 300;
    case "ADA":
      return 0.5;
    case "DOT":
      return 7;
    case "LINK":
      return 15;
    case "UNI":
      return 7;
    case "MATIC":
      return 0.8;
    case "LTC":
      return 70;
    default:
      return 100; // Generic fallback
  }
};

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

const AmountPercentButton = React.memo<AmountPercentButtonProps>(
  ({
    currentPosition = 0,
    setCurrentPosition,
    onChange,
    tradeType = "buy",
    availableAmount = 0,
    amountUnit = "BTC",
    currentPrice = 122000,
    balanceType = "token",
    resetTrigger,
  }) => {
    const { t } = useLanguage();

    // Extract base symbol from amountUnit if it contains "/" (e.g., "SOL/USDT" -> "SOL")
    const baseAmountUnit = useMemo(
      () => amountUnit?.split("/")[0] || amountUnit,
      [amountUnit]
    );

    // Use symbol-specific fallback price if currentPrice is not provided
    const effectivePrice = useMemo(
      () => currentPrice || getFallbackPrice(baseAmountUnit),
      [currentPrice, baseAmountUnit]
    );

    useEffect(() => {
      if (resetTrigger !== undefined) {
        setCurrentPosition(0);
        onChange(0);
      }
    }, [resetTrigger, setCurrentPosition, onChange]);

    const handleCirclePress = useCallback(
      (pos: number) => {
        setCurrentPosition(pos);
        let amount = 0;
        if (tradeType === "buy" && balanceType === "usdt") {
          // For buy orders with USDT balance, calculate token amount
          amount =
            effectivePrice > 0
              ? (availableAmount * (pos / 100)) / effectivePrice
              : 0;
        } else {
          // For sell orders or token balance, calculate directly
          amount = availableAmount * (pos / 100);
        }
        if (onChange) {
          onChange(amount);
        }
      },
      [
        setCurrentPosition,
        tradeType,
        balanceType,
        effectivePrice,
        availableAmount,
        onChange,
      ]
    );

    const getFillColor = useCallback(() => {
      return tradeType === "buy" ? Colors.action.buy : Colors.action.sell;
    }, [tradeType]);

    const getMaxAmountText = useCallback(() => {
      if (tradeType === "buy" && balanceType === "usdt") {
        const maxAmount =
          effectivePrice > 0 ? availableAmount / effectivePrice : 0;
        return `${formatAmount(maxAmount.toFixed(6), 2)} ${baseAmountUnit}`;
      }
      return `${formatAmount(availableAmount, 2)} ${baseAmountUnit}`;
    }, [
      tradeType,
      balanceType,
      effectivePrice,
      availableAmount,
      baseAmountUnit,
    ]);

    // Reset position when available amount changes significantly
    useEffect(() => {
      if (availableAmount > 0 && currentPosition > 0) {
        // Recalculate position based on new available amount
        const newPosition = Math.min(
          100,
          (currentPosition * availableAmount) / Math.max(availableAmount, 1)
        );
        if (Math.abs(newPosition - currentPosition) > 5) {
          // Only reset if change is significant
          setCurrentPosition(0);
          onChange(0);
        }
      }
    }, [availableAmount, currentPosition, onChange]);

    // Memoize the percentage buttons to prevent unnecessary re-renders
    const percentageButtons = useMemo(
      () =>
        [25, 50, 75, 100].map((pos) => (
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
        )),
      [currentPosition, getFillColor, handleCirclePress]
    );

    return (
      <View style={styles.container}>
        <View style={styles.buttonsContainer}>{percentageButtons}</View>

        <View style={styles.labelsContainer}>
          <View style={styles.labelRow}>
            <Text style={Typography.label}>{t("trading.available")}</Text>
            <Text style={Typography.bodySmall}>
              {formatAmount(availableAmount, 2)}{" "}
              {tradeType === "buy" ? "USDT" : baseAmountUnit}
            </Text>
          </View>

          {tradeType === "buy" && (
            <View style={styles.labelRow}>
              <Text style={Typography.label}>
                {t(tradeType === "buy" ? "trading.maxBuy" : "trading.maxSell")}
              </Text>
              <Text style={Typography.bodySmall}>{getMaxAmountText()}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }
);

AmountPercentButton.displayName = "AmountPercentButton";

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
    alignItems: "center",
    justifyContent: "center",
  },
  amountButton: {
    paddingHorizontal: Dimensions.spacing.md,
    paddingVertical: Dimensions.spacing.sm,
    borderRadius: Dimensions.radius.sm,
    borderWidth: 1,
    minWidth: 60,
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
