import React, { memo } from 'react';
import { Asset } from '@/types/crypto';
import { formatAmount } from '@/utils/formatters';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
  } from 'react-native';
import { RootState } from '@/store';
import { styles } from './styles';
import { useSelector } from 'react-redux';
import {
  DEFAULT_CRYPTO_IMAGE,
  DEFAULT_CRYPTO_NAME,
  DEFAULT_CRYPTO_SYMBOL,
} from "@/utils/constant";


interface AssetItemProps {
  asset: Asset;
  totalBalance: number;
  onPress: (asset: Asset) => void;
}

const AssetItem = memo<AssetItemProps>(({ asset, totalBalance, onPress }) => {
  // Get holding data from Redux store for PnL information
  const holding = useSelector((state: RootState) => {
    const holdings = state.balance.balance.holdings;
    return holdings[asset.symbol.toUpperCase()];
  });

  const percentage =
    totalBalance > 0 ? (Number(asset.value) / totalBalance) * 100 : 0;
  const imageSource = asset.image_url
    ? { uri: asset.image_url }
    : { uri: DEFAULT_CRYPTO_IMAGE.tether };

  const handlePress = () => onPress(asset);

  // Calculate PnL if holding data is available
  const hasPnL = holding && holding.profitLoss !== undefined;
  const pnlValue = hasPnL ? holding.profitLoss : 0;
  const pnlPercentage = hasPnL ? holding.profitLossPercentage : 0;
  const isPositive = pnlValue >= 0;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 15,
          paddingHorizontal: 20,
          borderRadius: 12,
          backgroundColor: "#1A1D2F",
          marginVertical: 6,
          shadowColor: "#000",
        },
      ]}
      onPress={handlePress}>
      <View style={styles.leftSection}>
        <Image source={imageSource} style={styles.image} />
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{asset.name}</Text>
          <Text style={styles.amount}>
            {formatAmount(asset.amount, 2)} {asset.symbol.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.value}>${formatAmount(Number(asset.value))}</Text>
        <Text style={styles.percentage}>{percentage.toFixed(1)}%</Text>
        {hasPnL && (
          <View style={styles.pnlContainer}>
            <Text
              style={[
                styles.pnlValue,
                { color: isPositive ? "#4CAF50" : "#F44336" },
              ]}>
              {isPositive ? "+" : ""}
              {pnlValue.toFixed(2)}
            </Text>
            <Text
              style={[
                styles.pnlPercentage,
                { color: isPositive ? "#4CAF50" : "#F44336" },
              ]}>
              ({isPositive ? "+" : ""}
              {pnlPercentage.toFixed(2)}%)
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

AssetItem.displayName = "AssetItem";

export default AssetItem;
