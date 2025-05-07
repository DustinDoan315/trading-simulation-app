import AssetList from "@/components/portfolio/AssetList";
import BalanceCard from "@/components/portfolio/BalanceCard";
import PortfolioHeader from "@/components/portfolio/PortfolioHeader";
import React, { useState } from "react";

type Asset = {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  value: string;
  changePercentage: number;
  icon: any;
  isOthers?: boolean;
  assets?: Asset[];
};

import { useAppSelector, useAppDispatch } from "../../store";
import type { RootState } from "../../store";
import { router } from "expo-router";
import { ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PortfolioScreen = () => {
  const [showAllAssetsModal, setShowAllAssetsModal] = useState(false);
  const insets = useSafeAreaInsets();
  const { balance, changePercentage, changeValue } = useAppSelector(
    (state: RootState) => state.balance
  );

  const handleAssetPress = (asset: any) => {
    router.navigate("/(subs)/crypto-chart");
  };

  const targetBalance = 0;
  const progress =
    targetBalance > 0 ? Math.min(balance.totalInUSD / targetBalance, 1) : 0;

  const allAssets = Object.entries(balance.holdings)
    .filter(([_, holding]) => holding.amount > 0)
    .map(([cryptoId, holding]) => {
      return {
        id: cryptoId,
        name: cryptoId.charAt(0).toUpperCase() + cryptoId.slice(1),
        symbol: holding.symbol,
        amount: holding.amount.toFixed(4),
        value: `$${holding.valueInUSD.toFixed(2)}`,
        changePercentage: 0,
        icon: null,
      };
    });

  const sortedAssets = [...allAssets].sort((a, b) => 
    parseFloat(b.value.replace('$', '')) - parseFloat(a.value.replace('$', ''))
  );
  
  const mainAssets = sortedAssets.slice(0, 3);
  const otherAssets = sortedAssets.slice(3);

  const othersTotal = otherAssets.reduce(
    (sum, asset) => sum + parseFloat(asset.value.replace("$", "")),
    0
  );

  const assets = [
    ...mainAssets,
    ...(otherAssets.length > 0
      ? [
          {
            id: "others",
            name: "Others",
            symbol: "OTH",
            amount: otherAssets.length.toString(),
            value: `$${othersTotal.toFixed(2)}`,
            changePercentage: 0,
            icon: null,
            isOthers: true,
            assets: otherAssets,
          },
        ]
      : []),
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={[styles.scrollView, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <PortfolioHeader
          totalValue={`$${balance.totalInUSD.toFixed(2)}`}
          changePercentage={changePercentage}
          changeValue={`$${Math.abs(changeValue).toFixed(2)}`}
        />

        <BalanceCard
          balance={`$${balance.totalInUSD.toFixed(2)}`}
          changePercentage={changePercentage}
          changeValue={`$${Math.abs(changeValue).toFixed(2)}`}
          progress={progress}
          assets={assets}
        />

        <AssetList
          assets={assets}
          onAssetPress={(asset) => {
            if ((asset as Asset).isOthers) {
              setShowAllAssetsModal(true);
            } else {
              handleAssetPress(asset);
            }
          }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131523",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default PortfolioScreen;
