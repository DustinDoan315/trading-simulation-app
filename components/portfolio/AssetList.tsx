import React, { memo, useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Asset } from "@/app/types/crypto";
import AssetItem from "./AssetItem";
import { OthersButton } from "./OthersButton";
import { styles } from "./styles";

interface AssetListProps {
  assets: Asset[];
  totalBalance: number;
  onAssetPress: (asset: Asset) => void;
}

const AssetList = memo<AssetListProps>(
  ({ assets, totalBalance, onAssetPress }) => {
    const renderAsset = useCallback(
      ({ item }: { item: Asset }) => {
        if (item.isOthers) {
          return <OthersButton asset={item} onPress={onAssetPress} />;
        }

        return (
          <AssetItem
            asset={item}
            totalBalance={totalBalance}
            onPress={onAssetPress}
          />
        );
      },
      [totalBalance, onAssetPress]
    );

    const keyExtractor = useCallback((item: Asset) => item.id, []);

    return (
      <View style={styles.container}>
        <FlatList
          data={assets}
          renderItem={renderAsset}
          keyExtractor={keyExtractor}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      </View>
    );
  }
);

AssetList.displayName = "AssetList";

export default AssetList;
