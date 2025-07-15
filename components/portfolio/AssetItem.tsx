import React, { memo } from 'react';
import { Asset } from '@/types/crypto';
import { formatAmount } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootState } from '@/store';
import { styles } from './styles';
import { useSelector } from 'react-redux';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
      style={styles.enhancedAssetContainer}
      onPress={handlePress}
      activeOpacity={0.8}>
      <LinearGradient
        colors={["rgba(26, 29, 47, 0.8)", "rgba(26, 29, 47, 0.6)"]}
        style={styles.assetGradient}>
        <View style={styles.leftSection}>
          <View style={styles.imageContainer}>
            <Image source={imageSource} style={styles.image} />
            <View style={styles.imageBorder} />
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{asset.name}</Text>
            <Text style={styles.amount}>
              {formatAmount(asset.amount, 2)} {asset.symbol.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.value}>${formatAmount(Number(asset.value))}</Text>

          <View style={styles.percentageContainer}>
            <View style={styles.percentageIndicator}>
              <Ionicons name="pie-chart" size={12} color="#8C9EFF" />
            </View>
            <Text style={styles.percentage}>{percentage.toFixed(1)}%</Text>
          </View>

          {hasPnL && (
            <View style={styles.pnlContainer}>
              <View
                style={[
                  styles.pnlIndicator,
                  {
                    backgroundColor: isPositive
                      ? "rgba(76, 175, 80, 0.1)"
                      : "rgba(244, 67, 54, 0.1)",
                  },
                ]}>
                <Ionicons
                  name={isPositive ? "arrow-up" : "arrow-down"}
                  size={10}
                  color={isPositive ? "#4CAF50" : "#F44336"}
                />
              </View>
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
      </LinearGradient>
    </TouchableOpacity>
  );
});

AssetItem.displayName = "AssetItem";

export default AssetItem;
