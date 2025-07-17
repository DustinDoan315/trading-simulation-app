import Colors from '@/styles/colors';
import Dimensions from '@/styles/dimensions';
import React from 'react';
import Typography from '@/styles/typography';
import { useLanguage } from '@/context/LanguageContext';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";


const ActionButton = ({
  type = "buy",
  onPress,
  disabled = false,
  loading = false,
  cryptoSymbol = "BTC",
}: any) => {
  const { t } = useLanguage();

  const buttonStyle = [
    styles.button,
    type === "buy" ? styles.buyButton : styles.sellButton,
    disabled && styles.disabledButton,
  ];

  const getButtonLabel = () => {
    const action = type === "buy" ? t("trading.buy") : t("trading.sell");
    return `${action} ${cryptoSymbol}`;
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
