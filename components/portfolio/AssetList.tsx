import AssetItem from "./AssetItem";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";

type Asset = {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  value: string;
  changePercentage: number;
  image_url: string;
};

type AssetListProps = {
  assets: Asset[];
  onAssetPress?: (asset: Asset) => void;
};

const AssetList = ({ assets, onAssetPress }: AssetListProps) => {
  console.log("Assets in AssetList:", assets);

  return (
    <View style={styles.container}>
      <FlatList
        data={assets}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <AssetItem
            image_url={item.image_url}
            name={item.name}
            symbol={item.symbol.toUpperCase()}
            amount={item.amount}
            value={item.value}
            onPress={() => onAssetPress && onAssetPress(item)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
});

export default AssetList;
