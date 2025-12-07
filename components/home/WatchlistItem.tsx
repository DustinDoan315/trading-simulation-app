import React, { useMemo } from "react";
import { CryptoCurrency } from "@/services/CryptoService";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { getColors } from "@/styles/colors";

interface WatchListItemProps {
  crypto: CryptoCurrency;
  onPress: (id: string) => void;
}

interface ChangeIndicatorProps {
  isPositive: boolean;
  crypto: CryptoCurrency;
}

const ChangeIndicator: React.FC<ChangeIndicatorProps> = ({
  isPositive,
  crypto,
}) => {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const color = isPositive ? colors.action.accent : colors.action.sell;
  return (
    <View style={styles.changeContainer}>
      <Ionicons
        name={isPositive ? "arrow-up" : "arrow-down"}
        size={12}
        color={color}
        style={styles.arrow}
      />
      <Text
        style={[
          styles.change, 
          { color: isPositive ? colors.action.accent : colors.action.sell }
        ]}>
        {formatPercentage(crypto.price_change_percentage_24h)}
      </Text>
    </View>
  );
};

const areEqual = (
  prevProps: ChangeIndicatorProps,
  nextProps: ChangeIndicatorProps
) => {
  return (
    prevProps.isPositive === nextProps.isPositive &&
    prevProps.crypto === nextProps.crypto
  );
};

const MemoizedChangeIndicator = React.memo(ChangeIndicator, areEqual);

const areWatchListItemPropsEqual = (
  prevProps: WatchListItemProps,
  nextProps: WatchListItemProps
) => {
  return (
    prevProps.crypto.id === nextProps.crypto.id &&
    prevProps.crypto.current_price === nextProps.crypto.current_price &&
    prevProps.crypto.market_cap_change_percentage_24h ===
      nextProps.crypto.market_cap_change_percentage_24h &&
    prevProps.onPress === nextProps.onPress
  );
};

export const WatchListChild: React.FC<WatchListItemProps> = React.memo(
  ({ crypto, onPress }) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    const isPositive = useMemo(
      () => crypto.price_change_percentage_24h >= 0,
      [crypto.price_change_percentage_24h]
    );

    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.background.card }]}
        onPress={() => onPress(crypto.symbol.toUpperCase())}>
        <View style={styles.leftSection}>
          <Image source={{ uri: crypto.image }} style={styles.icon} />
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: colors.text.primary }]}>{crypto.name}</Text>
            <Text style={[styles.symbol, { color: colors.text.muted }]}>{crypto.symbol.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={[styles.price, { color: colors.text.primary }]}>
            {formatCurrency(crypto.current_price)}
          </Text>
          <MemoizedChangeIndicator isPositive={isPositive} crypto={crypto} />
        </View>
      </TouchableOpacity>
    );
  },
  areWatchListItemPropsEqual
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 6,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  nameContainer: {
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
  },
  symbol: {
    fontSize: 14,
    marginTop: 2,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  arrow: {
    marginRight: 2,
  },
  change: {
    fontSize: 14,
  },
  positive: {
    // Color will be set dynamically
  },
  negative: {
    // Color will be set dynamically
  },
});
