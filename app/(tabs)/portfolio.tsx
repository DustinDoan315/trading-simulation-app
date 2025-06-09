import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatAmount } from "@/utils/formatters";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { Asset } from "@/app/types/crypto";
import PortfolioHeader from "@/components/portfolio/PortfolioHeader";
import BalanceCard from "@/components/portfolio/BalanceCard";
import AssetItem from "@/components/portfolio/AssetItem";
import { OthersButton } from "@/components/portfolio/OthersButton";
import { styles } from "@/components/portfolio/styles";

const PortfolioScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    displayAssets,
    totalValue,
    changeValue,
    changePercentage,
    loading,
    error,
    refreshPortfolio,
  } = usePortfolioData();

  const handleAssetPress = useCallback((asset: Asset) => {
    if (asset.isOthers) {
      // Navigate to detailed others view or show modal
      // router.push("/(modals)/others-assets");
      return;
    }

    router.push({
      pathname: "/(subs)/crypto-chart",
      params: {
        id: asset.id,
        symbol: asset.symbol
          ? `${asset.symbol.toUpperCase()}/USDT`
          : "BTC/USDT",
        name: asset.name,
        image_url: asset.image_url || "",
      },
    });
  }, []);

  // Memoized render function
  const renderAsset = useCallback(
    ({ item }: { item: Asset }) => {
      if (item.isOthers) {
        return <OthersButton asset={item} onPress={handleAssetPress} />;
      }

      return (
        <AssetItem
          asset={item}
          totalBalance={totalValue}
          onPress={handleAssetPress}
        />
      );
    },
    [totalValue, handleAssetPress]
  );

  // Memoized header component
  const ListHeaderComponent = useMemo(
    () => (
      <>
        <PortfolioHeader
          totalValue={`$${formatAmount(totalValue)}`}
          changePercentage={changePercentage}
          changeValue={`${changeValue >= 0 ? "+" : "-"}$${Math.abs(
            changeValue
          ).toFixed(2)}`}
        />
        <BalanceCard
          balance={`$${formatAmount(totalValue, 0)}`}
          changePercentage={changePercentage}
          changeValue={`$${Math.abs(changeValue).toFixed(2)}`}
          progress={0}
          assets={displayAssets}
        />
      </>
    ),
    [totalValue, changePercentage, changeValue, displayAssets]
  );

  const ListEmptyComponent = useMemo(() => {
    if (loading) {
      return <ActivityIndicator size="large" color="#FFFFFF" />;
    }
    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }
    return null;
  }, [loading, error]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={loading}
        onRefresh={refreshPortfolio}
        tintColor="#FFFFFF"
      />
    ),
    [loading, refreshPortfolio]
  );

  const keyExtractor = useCallback((item: Asset) => item.id, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={displayAssets}
        renderItem={renderAsset}
        keyExtractor={keyExtractor}
        style={[styles.scrollView, { paddingTop: insets.top }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={refreshControl}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={8}
        getItemLayout={(data, index) => ({
          length: 78,
          offset: 78 * index,
          index,
        })}
      />
    </View>
  );
};

export default PortfolioScreen;
