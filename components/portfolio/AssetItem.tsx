import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
    } from 'react-native';


type AssetItemProps = {
  icon: any; // Image source
  name: string;
  symbol: string;
  amount: string;
  value: string;
  changePercentage: number;
  onPress?: () => void;
};

const AssetItem = ({
  icon,
  name,
  symbol,
  amount,
  value,
  changePercentage,
  onPress,
}: AssetItemProps) => {
  const isPositive = changePercentage >= 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftSection}>
        <Image source={icon} style={styles.icon} />
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.amount}>
            {amount} {symbol}
          </Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.value}>{value}</Text>
        <Text
          style={[
            styles.change,
            isPositive ? styles.positive : styles.negative,
          ]}>
          {isPositive ? "+" : ""}
          {changePercentage}%
        </Text>
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
  amount: {
    fontSize: 14,
    color: "#9DA3B4",
    marginTop: 2,
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
