import ActionButton from './ActionButton';
import AmountPercentButton from '../common/AmountPercentButton';
import Dimensions from '@/styles/dimensions';
import PriceInput from '../common/PriceInput';
import React, { useEffect, useRef, useState } from 'react';
import TabSelector from './TableSelector';
import { DEFAULT_CRYPTO, DEFAULT_CURRENCY } from '@/utils/constant';
import { formatAmount } from '@/utils/formatters';
import { RootState } from '@/store';
import { StyleSheet, View } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useSelector } from 'react-redux';


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

const OrderEntry = ({
  symbol = DEFAULT_CRYPTO,
  name = "Bitcoin",
  orderType = "market",
  currentPrice = 0,
  onSubmitOrder,
  availableBalance = 0,
  disabled = false,
}: OrderEntryProps) => {
  const { t } = useLanguage();
  // Get token balance from store
  const tokenBalance = useSelector((state: RootState) => {
    const holdings = state.balance.balance.holdings;
    // Try to find by symbol (case-insensitive) or by direct key access
    const holding =
      holdings[symbol.toUpperCase()] ||
      holdings[symbol.toLowerCase()] ||
      Object.values(holdings).find(
        (h: any) => h.symbol.toUpperCase() === symbol.toUpperCase()
      );

    return holding ? holding.amount : 0;
  });

  const [price, setPrice] = useState("0");
  const [amount, setAmount] = useState("0");
  const [selectedTab, setSelectedTab] = useState<"buy" | "sell">("buy");
  const [marginEnabled, setMarginEnabled] = useState(false);
  const firstRender = useRef(true);

  // Use currentPrice from props or fallback to 100 if not available
  const fallbackPrice = currentPrice || 100;

  const currentBalance =
    selectedTab === "buy" ? availableBalance : tokenBalance;

  // Disable sell button if no token balance
  const canSell = selectedTab === "buy" || tokenBalance > 0;

  const [sliderPosition, setSliderPosition] = useState(
    currentBalance > 0 ? 100 : 0
  );
  const [currentPosition, setCurrentPosition] = useState(0);
  const [resetCounter, setResetCounter] = useState(0);

  useEffect(() => {
    if (symbol) {
      setPrice(fallbackPrice.toString());
    }
  }, [symbol, currentPrice]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    handleSliderChange(0);
    setResetCounter((prev) => prev + 1);
  }, [selectedTab]);

  const handleSliderChange = (position: any) => {
    setSliderPosition(position);
    setAmount(formatAmount(position));
  };

  const handlePriceChange = (value: any) => {
    setPrice(value);
  };

  const handleAmountChange = (value: string) => {
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
  };

  const handleSubmitOrder = () => {
    const parsedPrice = parseFloat(price.replace(",", "."));
    const parsedAmount = parseFloat(amount.replace(",", "."));
    const effectivePrice = orderType === "market" ? fallbackPrice : parsedPrice;
    const total = effectivePrice * parsedAmount;
    const fees = total * 0.001;

    if (onSubmitOrder && symbol) {
      onSubmitOrder({
        type: selectedTab,
        orderType: orderType,
        symbol: symbol,
        name: name,
        price: effectivePrice,
        amount: parsedAmount,
        total: total,
        fees: fees,
        status: "pending",
        timestamp: Date.now(),
      });
    }
    handleSliderChange(0);
    setResetCounter((prev) => prev + 1);
  };

  const isPriceEditable = orderType !== "market";

  return (
    <View style={styles.container}>
      <TabSelector
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
        marginEnabled={marginEnabled}
        onToggleMargin={setMarginEnabled}
      />

      <PriceInput
        label={`${t("order.price")} (${DEFAULT_CURRENCY})`}
        value={price}
        onChangeText={handlePriceChange}
        placeholder="0.00"
        editable={isPriceEditable}
      />

      <PriceInput
        label={`${t("order.amount")} (${symbol})`}
        value={amount}
        onChangeText={handleAmountChange}
        placeholder="0.00"
        keyboardType="numeric"
      />

      <AmountPercentButton
        currentPosition={currentPosition}
        setCurrentPosition={setCurrentPosition}
        onChange={handleSliderChange}
        tradeType={selectedTab}
        availableAmount={currentBalance}
        amountUnit={symbol}
        currentPrice={fallbackPrice}
        balanceType={selectedTab === "buy" ? "usdt" : "token"}
        resetTrigger={resetCounter}
      />

      <ActionButton
        type={selectedTab}
        onPress={handleSubmitOrder}
        cryptoSymbol={symbol}
        disabled={!canSell || disabled}
        loading={disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Dimensions.spacing.lg,
    width: "55%",
  },
});

export default OrderEntry;
