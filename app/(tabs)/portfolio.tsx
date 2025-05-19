import AssetList from "@/components/portfolio/AssetList";
import BalanceCard from "@/components/portfolio/BalanceCard";
import PortfolioHeader from "@/components/portfolio/PortfolioHeader";
import React, { useState, useEffect } from "react";
import { PortfolioService } from "@/services/SupabaseService";

const ASSET_GROUP_CONFIG = {
  OTHERS: {
    name: "Others",
    symbol: "OTH",
    icon: null,
    changePercentage: 0,
  },
};

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
import { router } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PortfolioScreen = () => {
  const [showAllAssetsModal, setShowAllAssetsModal] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [changePercentage, setChangePercentage] = useState(0);
  const [changeValue, setChangeValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const portfolioItems = await PortfolioService.getPortfolioList();
      console.log("Portfolio data from Supabase:", portfolioItems);

      if (!portfolioItems || portfolioItems.length === 0) {
        setError("No portfolio data found");
        return;
      }

      const mappedAssets = portfolioItems.map((item) => ({
        id: item.id,
        name: item.name,
        symbol: item.symbol,
        amount: item.amount,
        value: item.value,
        changePercentage: item.change_percentage,
        icon: item.icon_url ? { uri: item.icon_url } : null,
      }));

      const total = mappedAssets.reduce(
        (sum, asset) => sum + parseFloat(asset?.value.replace("$", "")),
        0
      );

      setAssets(mappedAssets);
      setTotalValue(total);
      // Default change values - can be updated with real data
      setChangePercentage(0);
      setChangeValue(0);
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
  }, []);

  const handleAssetPress = (asset: any) => {
    router.navigate(`/(subs)/crypto-chart?symbol=${asset.symbol}`);
  };

  const targetBalance = 0;
  const progress =
    targetBalance > 0 ? Math.min(totalValue / targetBalance, 1) : 0;

  const sortedAssets = [...assets].sort(
    (a, b) =>
      parseFloat(b.value.replace("$", "")) -
      parseFloat(a.value.replace("$", ""))
  );

  const mainAssets = sortedAssets.slice(0, 3);
  const otherAssets = sortedAssets.slice(3);

  const othersTotal = otherAssets.reduce(
    (sum, asset) => sum + parseFloat(asset.value.replace("$", "")),
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
            value: `$${othersTotal.toFixed(2)}`,
            changePercentage: ASSET_GROUP_CONFIG.OTHERS.changePercentage,
            icon: ASSET_GROUP_CONFIG.OTHERS.icon,
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
              totalValue={`$${totalValue.toFixed(2)}`}
              changePercentage={changePercentage}
              changeValue={`$${Math.abs(changeValue).toFixed(2)}`}
            />
            <BalanceCard
              balance={`$${totalValue.toFixed(2)}`}
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
              if ((asset as Asset).isOthers) {
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
