import ActionButton from "./ActionButton";
import AmountPercentButton from "../common/AmountPercentButton";
import Dimensions from "@/styles/dimensions";
import PriceInput from "../common/PriceInput";
import RealTimeDataService from "@/services/RealTimeDataService";
import TabSelector from "./TableSelector";
import { DEFAULT_CRYPTO, DEFAULT_CURRENCY } from "@/utils/constant";
import { formatAmount } from "@/utils/formatters";
import { LinearGradient } from "expo-linear-gradient";
import { RootState } from "@/store";
import { StyleSheet, Text, View } from "react-native";
import { useDualBalance } from "@/hooks/useDualBalance";
import { useLanguage } from "@/context/LanguageContext";
import { useSelector } from "react-redux";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Symbol-specific fallback prices
const getFallbackPrice = (symbol: string): number => {
  const symbolUpper = symbol.toUpperCase();
  switch (symbolUpper) {
    case "BTC":
      return 120000;
    case "ETH":
      return 3100;
    case "SOL":
      return 166;
    case "BNB":
      return 700;
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

    // Extract base symbol from full symbol format (e.g., "SOL/USDT" -> "SOL")
    const baseSymbol = useMemo(() => symbol?.split("/")[0] || symbol, [symbol]);

    // Get real-time price from Redux store
    const realTimePrice = useSelector(
      (state: RootState) => state.cryptoPrices.prices[baseSymbol.toUpperCase()]
    );

    // Use dual balance system for consistent data
    const { currentHoldings } = useDualBalance();

    // Get token balance from dual balance holdings
    const tokenBalance = useMemo(() => {
      const holding =
        currentHoldings[baseSymbol.toUpperCase()] ||
        currentHoldings[baseSymbol.toLowerCase()] ||
        Object.values(currentHoldings).find(
          (h: any) => h.symbol.toUpperCase() === baseSymbol.toUpperCase()
        );

      return holding ? holding.amount : 0;
    }, [currentHoldings, baseSymbol]);

    const [price, setPrice] = useState("0");
    const [amount, setAmount] = useState("0");
    const [selectedTab, setSelectedTab] = useState<"buy" | "sell">("buy");
    const [marginEnabled, setMarginEnabled] = useState(false);
    const firstRender = useRef(true);

    // Use real-time price from Redux store, fallback to props, then to symbol-specific default
    const effectivePrice = useMemo(
      () => realTimePrice || currentPrice || getFallbackPrice(baseSymbol),
      [realTimePrice, currentPrice, baseSymbol]
    );

    const currentBalance = useMemo(
      () => (selectedTab === "buy" ? availableBalance : tokenBalance),
      [selectedTab, availableBalance, tokenBalance]
    );

    // Reset slider when balance changes
    useEffect(() => {
      if (currentBalance > 0) {
        setSliderPosition(100);
      } else {
        setSliderPosition(0);
      }
      setAmount("0");
      setResetCounter((prev) => prev + 1);
    }, [currentBalance]);

    // Disable sell button if no token balance
    const canSell = useMemo(
      () => selectedTab === "buy" || tokenBalance > 0,
      [selectedTab, tokenBalance]
    );

    const [sliderPosition, setSliderPosition] = useState(
      currentBalance > 0 ? 100 : 0
    );
    const [currentPosition, setCurrentPosition] = useState(0);
    const [resetCounter, setResetCounter] = useState(0);

    // Initialize real-time data service when component mounts
    useEffect(() => {
      const realTimeService = RealTimeDataService.getInstance();
      if (!realTimeService.isActive()) {
        realTimeService.startUpdates();
      }
    }, []);

    useEffect(() => {
      if (baseSymbol) {
        setPrice(effectivePrice.toString());
      }
    }, [baseSymbol, effectivePrice]);

    useEffect(() => {
      if (firstRender.current) {
        firstRender.current = false;
        return;
      }

      handleSliderChange(0);
      setResetCounter((prev) => prev + 1);
    }, [selectedTab]);

    const handleSliderChange = useCallback((position: any) => {
      setSliderPosition(position);
      setAmount(formatAmount(position));
    }, []);

    const handlePriceChange = useCallback((value: any) => {
      setPrice(value);
    }, []);

    const handleAmountChange = useCallback(
      (value: string) => {
        // Only allow numbers and single decimal point
        const cleanedValue = value.replace(/[^0-9.]/g, "");
        // Ensure only one decimal point
        const parts = cleanedValue.split(".");
        const formattedValue =
          parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 8)}` : parts[0];

        setAmount(formattedValue);

        if (currentBalance > 0 && formattedValue) {
          const numericValue = parseFloat(formattedValue) || 0;
          const newPosition = (numericValue / currentBalance) * 100;
          setSliderPosition(Math.min(100, Math.max(0, newPosition)));
        }
      },
      [currentBalance]
    );

    const handleSubmitOrder = useCallback(() => {
      const parsedPrice = parseFloat(price.replace(",", "."));
      const parsedAmount = parseFloat(amount.replace(",", "."));
      const orderPrice = orderType === "market" ? effectivePrice : parsedPrice;
      const total = orderPrice * parsedAmount;
      const fees = total * 0.001;

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
        {/* Enhanced Tab Selector */}
        <View style={styles.tabSection}>
          <TabSelector
            selectedTab={selectedTab}
            onSelectTab={setSelectedTab}
            marginEnabled={marginEnabled}
            onToggleMargin={setMarginEnabled}
          />
        </View>

        {/* Balance Display */}
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

        {/* Input Fields Section */}
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

        {/* Amount Slider Section */}
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

        {/* Total Calculation */}
        <View style={styles.totalSection}>
          <LinearGradient
            colors={["rgba(102, 116, 204, 0.1)", "rgba(102, 116, 204, 0.05)"]}
            style={styles.totalCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Value:</Text>
              <Text style={styles.totalAmount}>
                $
                {formatAmount(
                  (parseFloat(amount) || 0) * (parseFloat(price) || 0),
                  2
                )}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.feeLabel}>Fees (0.1%):</Text>
              <Text style={styles.feeAmount}>
                $
                {formatAmount(
                  (parseFloat(amount) || 0) * (parseFloat(price) || 0) * 0.001,
                  2
                )}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Action Button */}
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
