import React from 'react';
import { CryptoCurrency } from '@/services/CryptoService';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


interface WatchlistItemProps {
  crypto: CryptoCurrency;
  onPress: (id: string) => void;
}

export const WatchlistItem: React.FC<WatchlistItemProps> = ({
  crypto,
  onPress,
}) => {
  const isPositive = crypto.price_change_percentage_24h >= 0;

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
        <Text style={styles.price}>{formatCurrency(crypto.current_price)}</Text>
        <View style={styles.changeContainer}>
          <Ionicons
            name={isPositive ? "arrow-up" : "arrow-down"}
            size={12}
            color={isPositive ? "#6674CC" : "#FF6B6B"}
            style={styles.arrow}
          />
          <Text
            style={[
              styles.change,
              isPositive ? styles.positive : styles.negative,
            ]}>
            {formatPercentage(Math.abs(crypto.price_change_percentage_24h))}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
