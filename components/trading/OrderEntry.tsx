import ActionButton from './ActionButton';
import AmountPercentButton from '../common/AmountPercentButton';
import Dimensions from '@/styles/dimensions';
import PriceInput from '../common/PriceInput';
import RealTimeDataService from '@/services/RealTimeDataService';
import TabSelector from './TableSelector';
import { formatAmount } from '@/utils/formatters';
import { LinearGradient } from 'expo-linear-gradient';
import { RootState } from '@/store';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useSelector } from 'react-redux';
import {
  CRYPTO_FALLBACK_PRICES,
  DEFAULT_CRYPTO,
  DEFAULT_CURRENCY,
  TRADING_CONFIG,
} from "@/utils/constant";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";


const getFallbackPrice = (symbol: string): number => {
  const symbolUpper = symbol.toUpperCase();
  return (
    CRYPTO_FALLBACK_PRICES[
      symbolUpper as keyof typeof CRYPTO_FALLBACK_PRICES
    ] || CRYPTO_FALLBACK_PRICES.DEFAULT
  );
};

const safeParseFloat = (value: string | number): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value !== "string") {
    return 0;
  }
  const cleaned = value.replaceAll(",", "").replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

interface OrderEntryProps {
  name?: string;
  symbol?: string;
  orderType?: "market" | "limit";
  currentPrice?: number;
  onSubmitOrder?: (order: {
    type: "buy" | "sell";
    orderType: "market" | "limit";
    symbol: string;
    name: string;
    price: number;
    amount: number;
    total: number;
    fees: number;
    status: "pending" | "completed" | "failed";
    timestamp: number;
  }) => void;
  maxAmount?: number;
  availableBalance?: number;
  image?: string;
  disabled?: boolean;
}

const OrderEntry = React.memo(
  ({
    symbol = DEFAULT_CRYPTO,
    name = "Bitcoin",
    orderType = "market",
    currentPrice = 0,
    onSubmitOrder,
    availableBalance = 0,
    disabled = false,
  }: OrderEntryProps) => {
    const { t } = useLanguage();

    const baseSymbol = useMemo(() => symbol?.split("/")[0] || symbol, [symbol]);

    const realTimePrice = useSelector(
      (state: RootState) => state.cryptoPrices.prices[baseSymbol.toUpperCase()]
    );

    const { balance } = useSelector((state: RootState) => state.balance);

    const tokenBalance = useMemo(() => {
      const holding =
        balance.holdings[baseSymbol.toUpperCase()] ||
        balance.holdings[baseSymbol.toLowerCase()] ||
        Object.values(balance.holdings).find(
          (h: any) => h.symbol.toUpperCase() === baseSymbol.toUpperCase()
        );

      return holding ? holding.amount : 0;
    }, [balance.holdings, baseSymbol]);

    const [price, setPrice] = useState("0");
    const [amount, setAmount] = useState("0");
    const [selectedTab, setSelectedTab] = useState<"buy" | "sell">("buy");
    const [marginEnabled, setMarginEnabled] = useState(false);
    const firstRender = useRef(true);

    const effectivePrice = useMemo(() => {
      const price =
        realTimePrice || currentPrice || getFallbackPrice(baseSymbol);
      if (
        !Number.isFinite(price) ||
        price <= 0 ||
        price > 1000000000 ||
        price < 0.00000001
      ) {
        return getFallbackPrice(baseSymbol);
      }
      return price;
    }, [realTimePrice, currentPrice, baseSymbol]);

    const currentBalance = useMemo(
      () => (selectedTab === "buy" ? availableBalance : tokenBalance),
      [selectedTab, availableBalance, tokenBalance]
    );

    const canSell = useMemo(
      () => selectedTab === "buy" || tokenBalance > 0,
      [selectedTab, tokenBalance]
    );

    const [sliderPosition, setSliderPosition] = useState(
      currentBalance > 0
        ? TRADING_CONFIG.MAX_PERCENTAGE
        : TRADING_CONFIG.MIN_PERCENTAGE
    );
    const [currentPosition, setCurrentPosition] = useState(0);
    const [resetCounter, setResetCounter] = useState(0);

    useEffect(() => {
      const realTimeService = RealTimeDataService.getInstance();
      if (!realTimeService.isActive()) {
        realTimeService.startUpdates();
      }
    }, []);

    useEffect(() => {
      if (
        baseSymbol &&
        effectivePrice > 0 &&
        Number.isFinite(effectivePrice) &&
        effectivePrice < 1000000000
      ) {
        const priceStr = effectivePrice.toString();
        if (!priceStr.includes(",")) {
          setPrice(priceStr);
        }
      }
    }, [baseSymbol, effectivePrice]);

    useEffect(() => {
      if (firstRender.current) {
        firstRender.current = false;
        return;
      }

      setAmount("0");
      setCurrentPosition(0);
      setResetCounter((prev) => prev + 1);

      if (selectedTab === "buy") {
        if (
          baseSymbol &&
          effectivePrice > 0 &&
          Number.isFinite(effectivePrice) &&
          effectivePrice < 1000000000
        ) {
          const cleanPrice = effectivePrice.toString();
          setPrice(cleanPrice);
        }
      }
    }, [selectedTab, baseSymbol, effectivePrice]);

    const handleSliderChange = useCallback(
      (calculatedAmount: number) => {
        const formattedAmount =
          calculatedAmount > 0 &&
          calculatedAmount < TRADING_CONFIG.SMALL_NUMBER_THRESHOLD
            ? calculatedAmount.toFixed(
                TRADING_CONFIG.SMALL_NUMBER_DECIMAL_PLACES
              )
            : calculatedAmount.toString();
        setAmount(formattedAmount);

        if (
          currentBalance <= 0 ||
          calculatedAmount < 0 ||
          Number.isNaN(calculatedAmount) ||
          Number.isNaN(currentBalance)
        ) {
          if (calculatedAmount === 0) {
            setCurrentPosition(TRADING_CONFIG.MIN_PERCENTAGE);
          }
          return;
        }

        let percentage: number;

        if (selectedTab === "buy") {
          const usdtValue = calculatedAmount * effectivePrice;
          percentage =
            (usdtValue / currentBalance) * TRADING_CONFIG.MAX_PERCENTAGE;
        } else {
          percentage =
            (calculatedAmount / currentBalance) * TRADING_CONFIG.MAX_PERCENTAGE;
        }

        for (const buttonValue of TRADING_CONFIG.PERCENTAGE_BUTTONS) {
          let expectedAmount: number;
          if (selectedTab === "buy") {
            let expectedUsdt =
              currentBalance * (buttonValue / TRADING_CONFIG.MAX_PERCENTAGE);
            if (buttonValue === TRADING_CONFIG.MAX_PERCENTAGE) {
              const feesRate = TRADING_CONFIG.TRADING_FEE_PERCENTAGE;
              expectedUsdt = currentBalance / (1 + feesRate);
            }
            expectedAmount = expectedUsdt / effectivePrice;
          } else {
            expectedAmount =
              currentBalance * (buttonValue / TRADING_CONFIG.MAX_PERCENTAGE);
          }

          const tolerance =
            selectedTab === "buy"
              ? (currentBalance * TRADING_CONFIG.PERCENTAGE_TOLERANCE) /
                effectivePrice
              : currentBalance * TRADING_CONFIG.PERCENTAGE_TOLERANCE;

          if (Math.abs(calculatedAmount - expectedAmount) <= tolerance) {
            setCurrentPosition(buttonValue);
            return;
          }
        }

        const roundedPercentage = Math.max(
          TRADING_CONFIG.MIN_PERCENTAGE,
          Math.min(TRADING_CONFIG.MAX_PERCENTAGE, Math.round(percentage))
        );
        setCurrentPosition(roundedPercentage);
      },
      [currentBalance, selectedTab, effectivePrice]
    );

    const handlePriceChange = useCallback((value: any) => {
      setPrice(value);
    }, []);

    const handleAmountChange = useCallback((value: string) => {
      setAmount(value);
    }, []);

    const handleSubmitOrder = useCallback(() => {
      const parsedPrice = safeParseFloat(price);
      const parsedAmount = safeParseFloat(amount);

      if (parsedPrice <= 0) {
        console.error("Invalid price:", parsedPrice);
        return;
      }

      if (parsedAmount <= 0) {
        console.error("Invalid amount:", parsedAmount);
        return;
      }

      const orderPrice = orderType === "market" ? effectivePrice : parsedPrice;

      if (!Number.isFinite(orderPrice) || orderPrice <= 0) {
        console.error("Invalid order price:", orderPrice);
        return;
      }

      const total = orderPrice * parsedAmount;
      const fees = total * TRADING_CONFIG.TRADING_FEE_PERCENTAGE;

      if (!Number.isFinite(total) || !Number.isFinite(fees)) {
        console.error("Invalid calculation:", { total, fees });
        return;
      }

      if (onSubmitOrder && baseSymbol) {
        onSubmitOrder({
          type: selectedTab,
          orderType: orderType,
          symbol: baseSymbol,
          name: name,
          price: orderPrice,
          amount: parsedAmount,
          total: total,
          fees: fees,
          status: "pending",
          timestamp: Date.now(),
        });
      }
      handleSliderChange(0);
      setResetCounter((prev) => prev + 1);
    }, [
      price,
      amount,
      orderType,
      effectivePrice,
      onSubmitOrder,
      baseSymbol,
      selectedTab,
      name,
      handleSliderChange,
    ]);

    const isPriceEditable = useMemo(() => orderType !== "market", [orderType]);

    return (
      <View style={styles.container}>
        <View style={styles.tabSection}>
          <TabSelector
            selectedTab={selectedTab}
            onSelectTab={setSelectedTab}
            marginEnabled={marginEnabled}
            onToggleMargin={setMarginEnabled}
          />
        </View>

        <View style={styles.balanceSection}>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.03)"]}
            style={styles.balanceCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Text style={styles.balanceLabel}>
              {selectedTab === "buy"
                ? "Available USDT"
                : `Available ${baseSymbol}`}
            </Text>
            <Text style={styles.balanceAmount}>
              {formatAmount(currentBalance, selectedTab === "buy" ? 2 : 6)}{" "}
              {selectedTab === "buy" ? "USDT" : baseSymbol}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <PriceInput
                label={`${t("order.price")} (${DEFAULT_CURRENCY})`}
                value={price}
                onChangeText={handlePriceChange}
                placeholder="0.00"
                editable={isPriceEditable}
              />
            </View>
            <View style={styles.inputContainer}>
              <PriceInput
                label={`${t("order.amount")} (${baseSymbol})`}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.sliderSection}>
          <AmountPercentButton
            currentPosition={currentPosition}
            setCurrentPosition={setCurrentPosition}
            onChange={handleSliderChange}
            tradeType={selectedTab}
            availableAmount={currentBalance}
            amountUnit={baseSymbol}
            currentPrice={effectivePrice}
            balanceType={selectedTab === "buy" ? "usdt" : "token"}
            resetTrigger={resetCounter}
          />
        </View>

        <View style={styles.totalSection}>
          <LinearGradient
            colors={["rgba(102, 116, 204, 0.1)", "rgba(102, 116, 204, 0.05)"]}
            style={styles.totalCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("order.total")}:</Text>
              <Text style={styles.totalAmount}>
                $
                {formatAmount(
                  (() => {
                    const cleanAmount = safeParseFloat(amount);
                    const cleanPrice = safeParseFloat(price);
                    const calculated = cleanAmount * cleanPrice;
                    return Number.isFinite(calculated) && calculated >= 0
                      ? calculated
                      : 0;
                  })(),
                  2
                )}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.feeLabel}>
                {t("order.fee")} ({TRADING_CONFIG.TRADING_FEE_DISPLAY}):
              </Text>
              <Text style={styles.feeAmount}>
                $
                {formatAmount(
                  (() => {
                    const cleanAmount = safeParseFloat(amount);
                    const cleanPrice = safeParseFloat(price);
                    const calculated =
                      cleanAmount *
                      cleanPrice *
                      TRADING_CONFIG.TRADING_FEE_PERCENTAGE;
                    return Number.isFinite(calculated) && calculated >= 0
                      ? calculated
                      : 0;
                  })(),
                  2
                )}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.buttonSection}>
          <ActionButton
            type={selectedTab}
            onPress={handleSubmitOrder}
            cryptoSymbol={baseSymbol}
            disabled={!canSell || disabled}
            loading={disabled}
          />
        </View>
      </View>
    );
  }
);

OrderEntry.displayName = "OrderEntry";

const styles = StyleSheet.create({
  container: {
    padding: Dimensions.spacing.md,
    width: "100%",
  },
  tabSection: {
    marginBottom: Dimensions.spacing.md,
  },
  balanceSection: {
    marginBottom: Dimensions.spacing.md,
  },
  balanceCard: {
    padding: Dimensions.spacing.md,
    borderRadius: Dimensions.radius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  balanceLabel: {
    fontSize: Dimensions.fontSize.sm,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: Dimensions.spacing.xs,
  },
  balanceAmount: {
    fontSize: Dimensions.fontSize.xl,
    fontWeight: "bold",
    color: "#fff",
  },
  inputSection: {
    marginBottom: Dimensions.spacing.md,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: Dimensions.spacing.xs,
  },
  sliderSection: {
    marginBottom: Dimensions.spacing.md,
  },
  totalSection: {
    marginTop: Dimensions.spacing.md,
  },
  totalCard: {
    padding: Dimensions.spacing.md,
    borderRadius: Dimensions.radius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Dimensions.spacing.xs,
  },
  totalLabel: {
    fontSize: Dimensions.fontSize.sm,
    color: "rgba(255, 255, 255, 0.7)",
  },
  totalAmount: {
    fontSize: Dimensions.fontSize.md,
    fontWeight: "bold",
    color: "#fff",
  },
  feeLabel: {
    fontSize: Dimensions.fontSize.sm,
    color: "rgba(255, 255, 255, 0.7)",
  },
  feeAmount: {
    fontSize: Dimensions.fontSize.md,
    fontWeight: "bold",
    color: "#fff",
  },
  buttonSection: {
    marginTop: Dimensions.spacing.md,
  },
});

export default OrderEntry;
