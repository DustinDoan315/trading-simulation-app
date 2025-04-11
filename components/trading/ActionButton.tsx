import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import Typography from "@/styles/typography";

const ActionButton = ({
  type = "buy",
  onPress,
  disabled = false,
  loading = false,
  cryptoSymbol = "BTC",
}: any) => {
  // Determine button styles based on type
  const buttonStyle = [
    styles.button,
    type === "buy" ? styles.buyButton : styles.sellButton,
    disabled && styles.disabledButton,
  ];

  // Get appropriate label based on type
  const getButtonLabel = () => {
    return type === "buy" ? `Mua ${cryptoSymbol}` : `Bán ${cryptoSymbol}`;
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.text.primary} />
      ) : (
        <Text style={styles.buttonText}>{getButtonLabel()}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: Dimensions.radius.md,
    paddingVertical: Dimensions.spacing.lg,
    marginTop: Dimensions.spacing.lg,
    alignItems: "center",
    justifyContent: "center",

    // Shadow for iOS
    shadowColor: Colors.background.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    // Shadow for Android
    elevation: 5,
  },
  buyButton: {
    backgroundColor: Colors.action.buy,
    borderWidth: Dimensions.border.thin,
    borderColor: Colors.action.buyBorder,
  },
  sellButton: {
    backgroundColor: Colors.action.sell,
    borderWidth: Dimensions.border.thin,
    borderColor: Colors.action.sellBorder,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    ...Typography.buttonText,
  },
});

export default ActionButton;
