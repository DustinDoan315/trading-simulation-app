import { formatAmount, formatPrice } from "@/utils/formatters";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

type AssetItemProps = {
  image_url: any;
  name: string;
  symbol: string;
  amount: string;
  value: string;
  onPress?: () => void;
};

const AssetItem = ({
  image_url,
  name,
  symbol,
  amount,
  value,
  onPress,
}: AssetItemProps) => {
  const totalBalance = useSelector(
    (state: RootState) => state.balance.balance.totalInUSD
  );
  const percentage = (Number(value) / Number(totalBalance)) * 100;
  const imageSource = image_url
    ? { uri: image_url }
    : require("@/assets/icons/usdt.png");
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftSection}>
        <Image source={imageSource} style={styles.image_url} />
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.amount}>
            {formatAmount(amount, 2)} {symbol}
          </Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.value}>{formatAmount(Number(value))}</Text>
        <Text style={styles.change}>{percentage.toFixed(2)}%</Text>
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
  image_url: {
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
  amount: {
    fontSize: 14,
    color: "#9DA3B4",
    marginTop: 3,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  value: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  change: {
    fontSize: 14,
    marginTop: 2,
  },
  positive: {
    color: "#6674CC",
  },
  negative: {
    color: "#FF6B6B",
  },
});

export default AssetItem;
