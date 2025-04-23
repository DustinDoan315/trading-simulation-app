import AssetList from "@/components/portfolio/AssetList";
import BalanceCard from "@/components/portfolio/BalanceCard";
import PortfolioHeader from "@/components/portfolio/PortfolioHeader";
import React, { useState } from "react";
import { router } from "expo-router";
import { ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const mockAssets = [
  {
    id: "1",
    name: "Bitcoin",
    symbol: "BTC",
    amount: "34.5",
    value: "$1560.60",
    changePercentage: 0.64,
    icon: require("../../assets/icons/btc.png"),
  },
  {
    id: "2",
    name: "Ethereum",
    symbol: "ETH",
    amount: "2.036",
    value: "$2897.05",
    changePercentage: 3.11,
    icon: require("../../assets/icons/eth.png"),
  },
];

const PortfolioScreen = () => {
  const insets = useSafeAreaInsets();
  const handleAssetPress = (asset: any) => {
    router.navigate("/(subs)/crypto-chart");
  };

  const [balance, setBalance] = useState(4500.6);
  const targetBalance = 4500;
  const progress = Math.min(balance / targetBalance, 1);

  const handleResetBalance = () => {
    setBalance(100000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={[styles.scrollView, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <PortfolioHeader
          totalValue={`$${balance.toFixed(2)}`}
          changePercentage={1.56}
          changeValue="$97.38"
        />

        <BalanceCard
          balance={`$${balance.toFixed(2)}`}
          changePercentage={0.64}
          changeValue="$9.98"
          progress={progress}
          assets={mockAssets}
          onResetBalance={handleResetBalance}
        />

        <AssetList assets={mockAssets} onAssetPress={handleAssetPress} />
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
