import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CryptoCurrency } from "@/services/CryptoService";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { useAppDispatch, useAppSelector } from "@/store";
import { toggleFavorite } from "@/features/favoritesSlice";

interface CryptoListItemProps {
  crypto: CryptoCurrency;
  onPress: (id: string) => void;
}

interface ChangeIndicatorProps {
  changePercentage: number;
}

const ChangeIndicator: React.FC<ChangeIndicatorProps> = React.memo(
  ({ changePercentage }) => {
    const isPositive = changePercentage >= 0;
    const formattedChange = formatPercentage(changePercentage);
    const textColor = isPositive ? "#32CD32" : "#FF4C4C";

    return (
      <Text style={[styles.changeText, { color: textColor }]}>
        {formattedChange}
      </Text>
    );
  }
);

const arePropsEqual = (
  prevProps: CryptoListItemProps,
  nextProps: CryptoListItemProps
) => {
  return (
    prevProps.crypto.id === nextProps.crypto.id &&
    prevProps.crypto.current_price === nextProps.crypto.current_price &&
    prevProps.crypto.price_change_percentage_24h ===
      nextProps.crypto.price_change_percentage_24h
  );
};

const CryptoListItem: React.FC<CryptoListItemProps> = React.memo(
  ({ crypto, onPress }) => {
    const dispatch = useAppDispatch();
    const favoriteIds = useAppSelector((state) => state.favorites.favoriteIds);
    const isFavorite = favoriteIds.includes(crypto.id);

    return (
      <TouchableOpacity
        style={styles.container}
        onPress={() => onPress(crypto.id)}>
        <View style={styles.leftSection}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => dispatch(toggleFavorite(crypto.id))}>
            <Ionicons
              name={isFavorite ? "star" : "star-outline"}
              size={20}
              color={isFavorite ? "#FFD700" : "#8E8E93"}
            />
          </TouchableOpacity>

          <Image source={{ uri: crypto.image }} style={styles.tokenIcon} />

          <View style={styles.nameContainer}>
            <Text style={styles.tokenSymbol}>
              {crypto.symbol.toUpperCase()}
            </Text>
            <Text style={styles.tokenName}>{crypto.name}</Text>
          </View>

          {crypto.hot && (
            <View style={styles.hotIndicator}>
              <Ionicons name="flame" size={14} color="#FF4C4C" />
            </View>
          )}
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.priceText}>
            {formatCurrency(crypto.current_price)}
          </Text>
          <ChangeIndicator
            changePercentage={crypto.price_change_percentage_24h}
          />
        </View>
      </TouchableOpacity>
    );
  },
  arePropsEqual
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2C2C2E",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  favoriteButton: {
    marginRight: 8,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  nameContainer: {
    justifyContent: "center",
  },
  tokenSymbol: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  tokenName: {
    color: "#8E8E93",
    fontSize: 14,
    marginTop: 2,
  },
  hotIndicator: {
    marginLeft: 6,
    justifyContent: "center",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  priceText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  changeText: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default CryptoListItem;
