import React, { useMemo } from "react";
import { CryptoCurrency } from "@/services/CryptoService";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WatchlistItemProps {
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
  const color = isPositive ? "#6674CC" : "#FF6B6B";
  return (
    <View style={styles.changeContainer}>
      <Ionicons
        name={isPositive ? "arrow-up" : "arrow-down"}
        size={12}
        color={color}
        style={styles.arrow}
      />
      <Text
        style={[styles.change, isPositive ? styles.positive : styles.negative]}>
        {formatPercentage(Math.abs(crypto.price_change_percentage_24h))}
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

const areWatchlistItemPropsEqual = (
  prevProps: WatchlistItemProps,
  nextProps: WatchlistItemProps
) => {
  return (
    prevProps.crypto.id === nextProps.crypto.id &&
    prevProps.crypto.current_price === nextProps.crypto.current_price &&
    prevProps.crypto.price_change_percentage_24h ===
      nextProps.crypto.price_change_percentage_24h &&
    prevProps.onPress === nextProps.onPress
  );
};

export const WatchlistItem: React.FC<WatchlistItemProps> = React.memo(
  ({ crypto, onPress }) => {
    const isPositive = useMemo(
      () => crypto.price_change_percentage_24h >= 0,
      [crypto.price_change_percentage_24h]
    );
    console.log("crypto: ", crypto);

    return (
      <TouchableOpacity
        style={styles.container}
        onPress={() => onPress(crypto.id)}>
        <View style={styles.leftSection}>
          <Image source={{ uri: crypto.image }} style={styles.icon} />
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{crypto.name}</Text>
            <Text style={styles.symbol}>{crypto.symbol.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.price}>
            {formatCurrency(crypto.current_price)}
          </Text>
          <MemoizedChangeIndicator isPositive={isPositive} crypto={crypto} />
        </View>
      </TouchableOpacity>
    );
  },
  areWatchlistItemPropsEqual
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#1A1D2F",
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
    color: "white",
  },
  symbol: {
    fontSize: 14,
    color: "#9DA3B4",
    marginTop: 2,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
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
    color: "#6674CC",
  },
  negative: {
    color: "#FF6B6B",
  },
});
