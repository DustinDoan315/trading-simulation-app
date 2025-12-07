import Dimensions from '@/styles/dimensions';
import React, { useCallback, useEffect, useMemo } from 'react';
import Typography from '@/styles/typography';
import { CRYPTO_FALLBACK_PRICES, TRADING_CONFIG } from '@/utils/constant';
import { formatAmount } from '@/utils/formatters';
import { getColors } from '@/styles/colors';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
  } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';


const getFallbackPrice = (symbol: string): number => {
  const symbolUpper = symbol.toUpperCase();
  return (
    CRYPTO_FALLBACK_PRICES[
      symbolUpper as keyof typeof CRYPTO_FALLBACK_PRICES
    ] || CRYPTO_FALLBACK_PRICES.DEFAULT
  );
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
    const { theme } = useTheme();
    const colors = getColors(theme);
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
        if (availableAmount <= 0 || effectivePrice <= 0) {
          return;
        }

        let amount: number;
        if (tradeType === "buy" && balanceType === "usdt") {
          let usdtToSpend =
            availableAmount * (pos / TRADING_CONFIG.MAX_PERCENTAGE);

          if (pos === TRADING_CONFIG.MAX_PERCENTAGE) {
            const feesRate = TRADING_CONFIG.TRADING_FEE_PERCENTAGE;
            const maxUsdtAfterFees = availableAmount / (1 + feesRate);
            usdtToSpend = Math.max(0, maxUsdtAfterFees);
          }

          amount = usdtToSpend / effectivePrice;
        } else {
          amount = availableAmount * (pos / TRADING_CONFIG.MAX_PERCENTAGE);
        }

        setCurrentPosition(pos);

        if (onChange) {
          onChange(amount);
        }
      },
      [
        setCurrentPosition,
        availableAmount,
        onChange,
        tradeType,
        balanceType,
        effectivePrice,
      ]
    );

    const getFillColor = useCallback(() => {
      return tradeType === "buy" ? colors.action.buy : colors.action.sell;
    }, [tradeType, colors]);

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

    useEffect(() => {
      if (availableAmount === 0 && currentPosition > 0) {
        setCurrentPosition(0);
        onChange(0);
      }
    }, [availableAmount, currentPosition, onChange, setCurrentPosition]);

    // Memoize the percentage buttons to prevent unnecessary re-renders
    const percentageButtons = useMemo(
      () =>
        TRADING_CONFIG.PERCENTAGE_BUTTONS.map((pos) => (
          <TouchableOpacity
            key={`button-${pos}`}
            onPress={() => handleCirclePress(pos)}
            style={[
              styles.amountButton,
              {
                backgroundColor:
                  currentPosition === pos
                    ? getFillColor()
                    : colors.background.tertiary,
                borderColor: getFillColor(),
              },
            ]}>
            <Text
              style={[
                Typography.bodySmall,
                {
                  color: colors.text.primary,
                },
              ]}>
              {pos}%
            </Text>
          </TouchableOpacity>
        )),
      [currentPosition, getFillColor, handleCirclePress, colors]
    );

    return (
      <View style={styles.container}>
        <View style={styles.buttonsContainer}>{percentageButtons}</View>

        <View style={styles.labelsContainer}>
          <View style={styles.labelRow}>
            <Text style={[Typography.label, { color: colors.text.secondary }]}>
              {t("trading.available")}
            </Text>
            <Text
              style={[Typography.bodySmall, { color: colors.text.primary }]}>
              {formatAmount(availableAmount, 2)}{" "}
              {tradeType === "buy" ? "USDT" : baseAmountUnit}
            </Text>
          </View>

          {tradeType === "buy" && (
            <View style={styles.labelRow}>
              <Text
                style={[Typography.label, { color: colors.text.secondary }]}>
                {t(tradeType === "buy" ? "trading.maxBuy" : "trading.maxSell")}
              </Text>
              <Text
                style={[Typography.bodySmall, { color: colors.text.primary }]}>
                {getMaxAmountText()}
              </Text>
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
