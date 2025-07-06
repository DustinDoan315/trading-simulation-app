import AssetItem from "@/components/portfolio/AssetItem";
import BalanceCard from "@/components/portfolio/BalanceCard";
import PortfolioHeader from "@/components/portfolio/PortfolioHeader";
import React, { useCallback, useMemo } from "react";
import { Asset } from "@/types/crypto";
import { formatAmount } from "@/utils/formatters";
import { navigateToCryptoChart } from "@/utils/navigation";
import { OthersButton } from "@/components/portfolio/OthersButton";
import { styles } from "@/components/portfolio/styles";
import { useLanguage } from "@/context/LanguageContext";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "@/context/UserContext";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from "react-native";

const PortfolioScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, userStats, loading: userLoading, refreshUserData } = useUser();
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

    navigateToCryptoChart(asset);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (user) {
      await refreshUserData(user.id);
    }
    refreshPortfolio();
  }, [user, refreshUserData, refreshPortfolio]);

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

  // Use user data for portfolio summary if available
  const portfolioValue = userStats?.portfolio_value || totalValue;
  const portfolioChange = user
    ? parseFloat(user.total_pnl || "0")
    : changeValue;
  const portfolioChangePercent = user
    ? (portfolioChange / parseFloat(user.balance || "100000")) * 100
    : changePercentage;

  const ListHeaderComponent = useMemo(
    () => (
      <>
        <PortfolioHeader
          totalValue={`$${formatAmount(portfolioValue)}`}
          changePercentage={portfolioChangePercent}
          changeValue={`${portfolioChange >= 0 ? "+" : "-"}$${Math.abs(
            portfolioChange
          ).toFixed(2)}`}
        />
        <BalanceCard
          balance={`$${formatAmount(portfolioValue, 0)}`}
          changePercentage={portfolioChangePercent}
          changeValue={`$${Math.abs(portfolioChange).toFixed(2)}`}
          progress={0}
          assets={displayAssets}
        />

        {/* User Trading Stats */}
        {user && (
          <View style={styles.userStatsContainer}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Trades</Text>
                <Text style={styles.statValue}>{user.total_trades}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Win Rate</Text>
                <Text style={styles.statValue}>
                  {parseFloat(user.win_rate).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Global Rank</Text>
                <Text style={styles.statValue}>
                  {user.global_rank ? `#${user.global_rank}` : "N/A"}
                </Text>
              </View>
            </View>
          </View>
        )}
      </>
    ),
    [
      portfolioValue,
      portfolioChangePercent,
      portfolioChange,
      displayAssets,
      user,
    ]
  );

  const ListEmptyComponent = useMemo(() => {
    if (loading || userLoading) {
      return <ActivityIndicator size="large" color="#FFFFFF" />;
    }
    if (error) {
      return (
        <Text style={styles.errorText}>{t("portfolio.errorLoading")}</Text>
      );
    }
    return null;
  }, [loading, userLoading, error]);

  const { t } = useLanguage();
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={loading || userLoading}
        onRefresh={handleRefresh}
        tintColor="#FFFFFF"
        title={t("portfolio.pullToRefresh")}
        titleColor="#FFFFFF"
      />
    ),
    [loading, userLoading, handleRefresh, t]
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
