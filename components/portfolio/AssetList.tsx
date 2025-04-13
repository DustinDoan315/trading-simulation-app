import AssetItem from './AssetItem';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';


type Asset = {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  value: string;
  changePercentage: number;
  icon: any;
};

type AssetListProps = {
  assets: Asset[];
  onAssetPress?: (asset: Asset) => void;
};

const AssetList = ({ assets, onAssetPress }: AssetListProps) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={assets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AssetItem
            icon={item.icon}
            name={item.name}
            symbol={item.symbol}
            amount={item.amount}
            value={item.value}
            changePercentage={item.changePercentage}
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
