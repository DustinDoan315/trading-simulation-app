import AssetList from "@/components/portfolio/AssetList";
import BalanceCard from "@/components/portfolio/BalanceCard";
import PortfolioHeader from "@/components/portfolio/PortfolioHeader";
import React, { useState, useEffect } from "react";

const ASSET_GROUP_CONFIG = {
  OTHERS: {
    name: "Others",
    symbol: "OTH",
    icon: null,
    changePercentage: 0,
  },
};

import { router } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CryptoCurrency } from "@/services/CryptoService";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { formatAmount } from "@/utils/formatters";

const PortfolioScreen = () => {
  const { balance, changeValue, changePercentage } = useSelector(
    (state: RootState) => ({
      balance: state.balance.balance,
      changeValue: state.balance.changeValue,
      changePercentage: state.balance.changePercentage,
    })
  );
  const holdings = Object.entries(balance.holdings);

  const [showAllAssetsModal, setShowAllAssetsModal] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Portfolio data from balanceSlice:", holdings);

      if (!holdings || holdings.length === 0) {
        setError("No portfolio data found");
        return;
      }

      const mappedAssets = holdings.map(([id, holding]) => ({
        id,
        name: holding.name || "Unknown",
        symbol: holding.symbol,
        amount: holding.amount.toString(),
        value: holding.valueInUSD.toFixed(2),
        image_url: holding.image_url || null,
      }));

      const total = balance.totalInUSD;

      setAssets(mappedAssets);
      setTotalValue(total);
      // Total value is the only local state we need to track
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch portfolio"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    return () => {
      setAssets([]);
      setTotalValue(0);
      setLoading(false);
      setError(null);
    };
  }, []);

  const handleAssetPress = (crypto: any) => {
    router.push({
      pathname: "/(subs)/crypto-chart",
      params: {
        id: crypto.id,
        symbol: crypto.symbol
          ? `${crypto.symbol.toLocaleUpperCase()}/USDT`
          : "BTC/USDT",
        name: crypto.name,
        image_url: crypto.image,
      },
    });
  };

  const targetBalance = 0;
  const progress =
    targetBalance > 0 ? Math.min(totalValue / targetBalance, 1) : 0;

  const sortedAssets = [...assets].sort(
    (a, b) => parseFloat(b.value) - parseFloat(a.value)
  );

  const mainAssets = sortedAssets.slice(0, 3);
  const otherAssets = sortedAssets.slice(3);

  const othersTotal = otherAssets.reduce(
    (sum, asset) => sum + parseFloat(asset.value),
    0
  );

  const displayAssets = [
    ...mainAssets,
    ...(otherAssets.length > 0
      ? [
          {
            id: "others",
            name: ASSET_GROUP_CONFIG.OTHERS.name,
            symbol: ASSET_GROUP_CONFIG.OTHERS.symbol,
            amount: otherAssets.length.toString(),
            value: othersTotal.toFixed(2),
            changePercentage: ASSET_GROUP_CONFIG.OTHERS.changePercentage,
            image_url: ASSET_GROUP_CONFIG.OTHERS.icon,
            isOthers: true,
            assets: otherAssets,
          },
        ]
      : []),
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={displayAssets}
        style={[styles.scrollView, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
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
              progress={progress}
              assets={displayAssets}
            />
          </>
        }
        renderItem={({ item }) => (
          <AssetList
            assets={[item]}
            onAssetPress={(asset) => {
              if ((asset as any).isOthers) {
                setShowAllAssetsModal(true);
              } else {
                handleAssetPress(asset);
              }
            }}
          />
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              setLoading(true);
              fetchPortfolio();
            }}
            tintColor="#FFFFFF"
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : error ? (
            <Text style={{ color: "white", textAlign: "center" }}>{error}</Text>
          ) : null
        }
      />
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
