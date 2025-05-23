import React, { useState, useEffect } from "react";
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
  symbol?: string;
  orderType?: "market" | "limit";
  currentPrice?: number;
  onSubmitOrder?: (order: {
    type: "buy" | "sell";
    orderType: "market" | "limit";
    symbol: string;
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
  orderType = "market",
  currentPrice = 0,
  onSubmitOrder,
  availableBalance = 0,
}: OrderEntryProps) => {
  const tokenPrice = useSelector(
    (state: RootState) => state.cryptoPrices.prices[symbol] || 100
  );
  const [price, setPrice] = useState("0");
  const [amount, setAmount] = useState("0");
  const [sliderPosition, setSliderPosition] = useState(
    availableBalance > 0 ? 100 : 0
  );
  const [selectedTab, setSelectedTab] = useState<"buy" | "sell">("buy");
  const [marginEnabled, setMarginEnabled] = useState(false);

  useEffect(() => {
    if (symbol) {
      setPrice(tokenPrice.toString());
    }
  }, [symbol]);

  const handleSliderChange = (position: any) => {
    setSliderPosition(position);
    setAmount(formatAmount(position));
  };

  const handlePriceChange = (value: any) => {
    setPrice(value);
  };

  const handleAmountChange = (value: any) => {
    setAmount(value);
    console.log("textttt: ", value);

    if (availableBalance > 0) {
      const newPosition = (parseFloat(value) / availableBalance) * 100;
      setSliderPosition(Math.min(100, Math.max(0, newPosition)));
    }
  };

  const handleSubmitOrder = () => {
    const parsedPrice = parseFloat(price.replace(",", "."));
    const parsedAmount = parseFloat(amount.replace(",", "."));
    const effectivePrice =
      orderType === "market" ? currentPrice || tokenPrice : parsedPrice;
    const total = effectivePrice * parsedAmount;
    const fees = total * 0.001; // 0.1% fee

    if (onSubmitOrder && symbol) {
      onSubmitOrder({
        type: selectedTab,
        orderType: orderType,
        symbol: symbol,
        price: effectivePrice,
        amount: parsedAmount,
        total: total,
        fees: fees,
        status: "pending",
        timestamp: Date.now(),
      });
    }
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
      {/* Price Input */}
      <PriceInput
        label="Giá (USDT)"
        value={price}
        onChangeText={handlePriceChange}
        placeholder="0.00"
        editable={isPriceEditable}
      />

      {/* Amount Input */}
      <PriceInput
        label={`Số lượng (${symbol})`}
        value={amount}
        onChangeText={handleAmountChange}
        placeholder="0.00"
      />

      {/* Amount Slider */}
      <AmountPercentButton
        position={sliderPosition}
        onChange={handleSliderChange}
        tradeType={selectedTab}
        availableAmount={availableBalance}
        amountUnit={symbol}
        currentPrice={currentPrice || tokenPrice}
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
