import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import PriceInput from "../common/PriceInput";
import AmountSlider from "../common/AmountSlider";
import ActionButton from "./ActionButton";
import { formatPrice, formatAmount } from "@/utils/formatters";
import { width } from "@/utils/response";
import TabSelector from "./TableSelector";

const OrderEntry = ({
  orderType = "market",
  currentPrice,
  onSubmitOrder,
  maxAmount = 0,
  availableBalance = 0,
}: any) => {
  // State for price and amount inputs
  const [price, setPrice] = useState(currentPrice || "0");
  const [amount, setAmount] = useState("0");
  const [sliderPosition, setSliderPosition] = useState(0);
  const [selectedTab, setSelectedTab] = useState("buy");
  const [marginEnabled, setMarginEnabled] = useState(false);

  // Update price when currentPrice changes
  useEffect(() => {
    if (currentPrice && currentPrice !== price) {
      setPrice(currentPrice);
    }
  }, [currentPrice]);

  // Handle slider position change
  const handleSliderChange = (position: any) => {
    setSliderPosition(position);

    // Calculate amount based on position (percentage)
    const calculatedAmount = (position / 100) * maxAmount;
    setAmount(formatAmount(calculatedAmount));
  };

  // Handle price input change
  const handlePriceChange = (value: any) => {
    setPrice(value);
  };

  // Handle amount input change
  const handleAmountChange = (value: any) => {
    setAmount(value);

    // Calculate and update slider position
    if (maxAmount > 0) {
      const newPosition = (parseFloat(value) / maxAmount) * 100;
      setSliderPosition(Math.min(100, Math.max(0, newPosition)));
    }
  };

  // Handle order submission
  const handleSubmitOrder = () => {
    // Parse values to ensure numbers
    const parsedPrice = parseFloat(price.replace(",", "."));
    const parsedAmount = parseFloat(amount.replace(",", "."));

    if (onSubmitOrder) {
      onSubmitOrder({
        type: selectedTab,
        orderType: orderType,
        price: orderType === "market" ? "market" : parsedPrice,
        amount: parsedAmount,
      });
    }
  };

  // Determine if price input should be editable based on order type
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
        label="Số lượng (BTC)"
        value={amount}
        onChangeText={handleAmountChange}
        placeholder="0.0000"
      />

      {/* Amount Slider */}
      <AmountSlider
        position={sliderPosition}
        onChange={handleSliderChange}
        tradeType={selectedTab}
        availableAmount={availableBalance}
        amountUnit="BTC"
      />

      {/* Action Button */}
      <ActionButton
        type={selectedTab}
        onPress={handleSubmitOrder}
        cryptoSymbol="BTC"
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
