import React, { memo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatAmount } from "@/utils/formatters";
import { Asset } from "@/app/types/crypto";
import { styles } from "./styles";

interface AssetItemProps {
  asset: Asset;
  totalBalance: number;
  onPress: (asset: Asset) => void;
}

const AssetItem = memo<AssetItemProps>(({ asset, totalBalance, onPress }) => {
  const percentage =
    totalBalance > 0 ? (Number(asset.value) / totalBalance) * 100 : 0;

  const imageSource = asset.image_url
    ? { uri: asset.image_url }
    : require("@/assets/icons/usdt.png");

  const handlePress = () => onPress(asset);

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
      </View>
    </TouchableOpacity>
  );
});

AssetItem.displayName = "AssetItem";

export default AssetItem;
