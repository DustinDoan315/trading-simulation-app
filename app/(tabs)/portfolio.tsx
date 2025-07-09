import AssetItem from "@/components/portfolio/AssetItem";
import BalanceCard from "@/components/portfolio/BalanceCard";
import PortfolioHeader from "@/components/portfolio/PortfolioHeader";
import React, { useCallback, useMemo } from "react";
import { Asset } from "@/types/crypto";
import { navigateToCryptoChart } from "@/utils/navigation";
import { OthersButton } from "@/components/portfolio/OthersButton";
import { styles } from "@/components/portfolio/styles";
import { useLanguage } from "@/context/LanguageContext";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useRealTimeBalance } from "@/hooks/useRealTimeBalance";
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
  const { user, loading: userLoading, refreshUserData } = useUser();
  const { displayAssets, loading, error } = usePortfolioData();

  // Use real-time balance hook for live updates
  const {
    totalBalance,
    totalPnL,
    totalPnLPercentage,
    formattedTotalBalance,
    formattedAvailableBalance,
    formattedTotalPnL,
    formattedTotalPnLPercentage,
    isLoading: realTimeLoading,
    refresh: refreshRealTimeData,
  } = useRealTimeBalance();

  const handleAssetPress = useCallback((asset: Asset) => {
    if (asset.isOthers) {
      return;
    }

    navigateToCryptoChart(asset);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (user) {
      await refreshUserData(user.id);
    }
    await refreshRealTimeData();
  }, [user, refreshUserData, refreshRealTimeData]);

  const renderAsset = useCallback(
    ({ item }: { item: Asset }) => {
      if (item.isOthers) {
        return <OthersButton asset={item} onPress={handleAssetPress} />;
      }

      return (
        <AssetItem
          asset={item}
          totalBalance={totalBalance}
          onPress={handleAssetPress}
        />
      );
    },
    [totalBalance, handleAssetPress]
  );

  const portfolioChangePercent = totalPnLPercentage;

  const ListHeaderComponent = useMemo(
    () => (
      <>
        <PortfolioHeader
          totalValue={formattedTotalBalance}
          changePercentage={portfolioChangePercent}
          changeValue={formattedTotalPnL}
        />
        <BalanceCard
          balance={formattedAvailableBalance}
          progress={0}
          assets={displayAssets}
        />

        {/* Real-time Balance Information */}
        <View style={styles.userStatsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total P&L</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: totalPnL >= 0 ? "#4CAF50" : "#F44336" },
                ]}>
                {formattedTotalPnL}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>P&L %</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: totalPnLPercentage >= 0 ? "#4CAF50" : "#F44336" },
                ]}>
                {formattedTotalPnLPercentage}
              </Text>
            </View>
          </View>
        </View>

        {/* User Trading Stats */}
        {user && (
          <View style={styles.userStatsContainer}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Trades</Text>
                <Text style={styles.statValue}>{user.total_trades}</Text>
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
      formattedTotalBalance,
      portfolioChangePercent,
      formattedTotalPnL,
      displayAssets,
      user,
      formattedAvailableBalance,
      totalPnL,
      totalPnLPercentage,
      formattedTotalPnLPercentage,
    ]
  );

  const ListEmptyComponent = useMemo(() => {
    if (loading || userLoading || realTimeLoading) {
      return <ActivityIndicator size="large" color="#FFFFFF" />;
    }
    if (error) {
      return (
        <Text style={styles.errorText}>{t("portfolio.errorLoading")}</Text>
      );
    }
    return null;
  }, [loading, userLoading, realTimeLoading, error]);

  const { t } = useLanguage();
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={loading || userLoading || realTimeLoading}
        onRefresh={handleRefresh}
        tintColor="#FFFFFF"
        title={t("portfolio.pullToRefresh")}
        titleColor="#FFFFFF"
      />
    ),
    [loading, userLoading, realTimeLoading, handleRefresh, t]
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
