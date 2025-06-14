import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import Dimensions from "@/styles/dimensions";
import PriceInput from "../common/PriceInput";
import AmountPercentButton from "../common/AmountPercentButton";
import ActionButton from "./ActionButton";
import { formatAmount } from "@/utils/formatters";
import TabSelector from "./TableSelector";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

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
  image_url?: string;
}

const OrderEntry = ({
  symbol = "BTC",
  name = "Bitcoin",
  orderType = "market",
  currentPrice = 0,
  onSubmitOrder,
  availableBalance = 0,
}: OrderEntryProps) => {
  // Get token balance from store
  const tokenBalance = useSelector((state: RootState) => {
    const holdings = state.balance.balance.holdings;
    const holding = Object.values(holdings).find(
      (h: any) => h.symbol === symbol
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

  const [sliderPosition, setSliderPosition] = useState(
    currentBalance > 0 ? 100 : 0
  );
  const [currentPosition, setCurrentPosition] = useState(0);

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
  }, [selectedTab]);

  const handleSliderChange = (position: any) => {
    setSliderPosition(position);
    setAmount(formatAmount(position));
  };

  const handlePriceChange = (value: any) => {
    setPrice(value);
  };

  const handleAmountChange = (value: any) => {
    setAmount(value);

    if (currentBalance > 0) {
      const newPosition = (parseFloat(value) / currentBalance) * 100;
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
        label="Giá (USDT)"
        value={price}
        onChangeText={handlePriceChange}
        placeholder="0.00"
        editable={isPriceEditable}
      />

      <PriceInput
        label={`Số lượng (${symbol})`}
        value={amount}
        onChangeText={handleAmountChange}
        placeholder="0.00"
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
      />

      <ActionButton
        type={selectedTab}
        onPress={handleSubmitOrder}
        cryptoSymbol={symbol}
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
