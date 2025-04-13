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
  return (
    <TouchableOpacity
      style={styles.cryptoItem}
      onPress={() => onPress(crypto.id)}>
      <View style={styles.cryptoInfo}>
        <Image source={{ uri: crypto.image }} style={styles.cryptoImage} />
        <View>
          <Text style={styles.cryptoName}>{crypto.name}</Text>
          <Text style={styles.cryptoSymbol}>{crypto.symbol.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cryptoPriceInfo}>
        <Text style={styles.cryptoPrice}>
          {formatCurrency(crypto.current_price)}
        </Text>
        <View
          style={[
            styles.percentageContainer,
            crypto.price_change_percentage_24h >= 0
              ? styles.positiveChange
              : styles.negativeChange,
          ]}>
          <Ionicons
            name={
              crypto.price_change_percentage_24h >= 0
                ? "arrow-up"
                : "arrow-down"
            }
            size={12}
            color="white"
          />
          <Text style={styles.percentageText}>
            {formatPercentage(Math.abs(crypto.price_change_percentage_24h))}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cryptoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  cryptoInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  cryptoImage: {
    width: 36,
    height: 36,
    marginRight: 12,
    borderRadius: 18,
  },
  cryptoName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  cryptoSymbol: {
    color: "#999",
    fontSize: 14,
    marginTop: 2,
  },
  cryptoPriceInfo: {
    alignItems: "flex-end",
  },
  cryptoPrice: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  percentageContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  positiveChange: {
    backgroundColor: "#2ecc71",
  },
  negativeChange: {
    backgroundColor: "#e74c3c",
  },
  percentageText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },
});
