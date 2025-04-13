import AssetList from '@/components/portfolio/AssetList';
import BalanceCard from '@/components/portfolio/BalanceCard';
import PortfolioHeader from '@/components/portfolio/PortfolioHeader';
import React from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";


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

  // Calculate progress based on actual balance vs target
  const totalBalance = 1560.6;
  const targetBalance = 2500; // Example target
  const progress = Math.min(totalBalance / targetBalance, 1);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={[styles.scrollView, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <PortfolioHeader
          totalValue="$6,242.50"
          changePercentage={1.56}
          changeValue="$97.38"
        />

        <BalanceCard
          balance="$1560.60"
          changePercentage={0.64}
          changeValue="$9.98"
          progress={progress}
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
