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
  const buttonStyle = [
    styles.button,
    type === "buy" ? styles.buyButton : styles.sellButton,
    disabled && styles.disabledButton,
  ];

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
    borderRadius: Dimensions.radius.round,
    paddingVertical: Dimensions.spacing.md,
    marginTop: Dimensions.spacing.sm,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: Colors.background.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,

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
