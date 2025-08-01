import AssetItem from "@/components/portfolio/AssetItem";
import BalanceCard from "@/components/portfolio/BalanceCard";
import PortfolioHeader from "@/components/portfolio/PortfolioHeader";
import React, { useCallback, useMemo } from "react";
import ShimmerPlaceHolder from "react-native-shimmer-placeholder";
import { Asset } from "@/types/crypto";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { navigateToCryptoChart } from "@/utils/navigation";
import { NON_TRADEABLE_TOKENS } from "@/utils/constant";
import { OthersButton } from "@/components/portfolio/OthersButton";
import { styles } from "@/components/portfolio/styles";
import { useLanguage } from "@/context/LanguageContext";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useRealTimeBalance } from "@/hooks/useRealTimeBalance";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "@/context/UserContext";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from "react-native";
import {
  ShimmerBalanceSection,
  ShimmerPortfolioCard,
} from "@/components/shimmer/ShimmerHeaders";

const { width } = Dimensions.get("window");

const PortfolioScreen = () => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user, loading: userLoading, refreshUserData } = useUser();
  const { displayAssets, loading, error } = usePortfolioData();

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

    // Check if the asset is a non-tradeable token (like USDT)
    const assetSymbol = asset.symbol?.toUpperCase();
    if (assetSymbol && NON_TRADEABLE_TOKENS.includes(assetSymbol as any)) {
      // Do nothing for non-tradeable tokens like USDT
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

  const ShimmerHeader = (
    <View style={styles.enhancedContainer}>
      <LinearGradient
        colors={["#1A1D2F", "#131523", "#0F111A"]}
        style={styles.backgroundGradient}
      />
      <View style={styles.headerContainer}>
        <ShimmerPortfolioCard />
      </View>
      <View style={styles.balanceCardContainer}>
        <ShimmerBalanceSection />
      </View>
      <View style={styles.enhancedStatsContainer}>
        <LinearGradient
          colors={["rgba(140, 158, 255, 0.1)", "rgba(140, 158, 255, 0.05)"]}
          style={styles.statsGradient}>
          <View style={styles.statsHeader}>
            <Ionicons name="trending-up" size={20} color="#8C9EFF" />
            <Text style={styles.statsTitle}>
              {t("portfolio.portfolioPerformance")}
            </Text>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="arrow-up" size={16} color="#4CAF50" />
              </View>
              <Text style={styles.statLabel}>{t("portfolio.totalPnL")}</Text>
              <ShimmerPlaceHolder
                LinearGradient={LinearGradient}
                style={{ width: 60, height: 18, borderRadius: 8 }}
              />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="analytics" size={16} color="#8C9EFF" />
              </View>
              <Text style={styles.statLabel}>
                {t("portfolio.pnlPercentage")}
              </Text>
              <ShimmerPlaceHolder
                LinearGradient={LinearGradient}
                style={{ width: 60, height: 18, borderRadius: 8 }}
              />
            </View>
          </View>
        </LinearGradient>
      </View>
      <View style={styles.assetsHeader}>
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={{ width: 120, height: 20, borderRadius: 8, marginBottom: 4 }}
        />
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={{ width: 80, height: 14, borderRadius: 7 }}
        />
      </View>
    </View>
  );

  const ShimmerAssetList = (
    <View>
      {[...Array(4)].map((_, idx) => (
        <View key={idx} style={{ marginBottom: 12 }}>
          <ShimmerPortfolioCard />
        </View>
      ))}
    </View>
  );

  const ListHeaderComponent = useMemo(() => {
    if (loading || userLoading || realTimeLoading) {
      return ShimmerHeader;
    }
    return (
      <View style={styles.enhancedContainer}>
        <LinearGradient
          colors={["#1A1D2F", "#131523", "#0F111A"]}
          style={styles.backgroundGradient}
        />
        <View style={styles.headerContainer}>
          <PortfolioHeader
            totalValue={formattedTotalBalance}
            changePercentage={portfolioChangePercent}
            changeValue={formattedTotalPnL}
          />
        </View>
        <View style={styles.balanceCardContainer}>
          <BalanceCard
            balance={formattedAvailableBalance}
            progress={0}
            assets={displayAssets}
          />
        </View>
        <View style={styles.enhancedStatsContainer}>
          <LinearGradient
            colors={["rgba(140, 158, 255, 0.1)", "rgba(140, 158, 255, 0.05)"]}
            style={styles.statsGradient}>
            <View style={styles.statsHeader}>
              <Ionicons name="trending-up" size={20} color="#8C9EFF" />
              <Text style={styles.statsTitle}>
                {t("portfolio.portfolioPerformance")}
              </Text>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons
                    name={totalPnL >= 0 ? "arrow-up" : "arrow-down"}
                    size={16}
                    color={totalPnL >= 0 ? "#4CAF50" : "#F44336"}
                  />
                </View>
                <Text style={styles.statLabel}>{t("portfolio.totalPnL")}</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: totalPnL >= 0 ? "#4CAF50" : "#F44336" },
                  ]}>
                  {formattedTotalPnL}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="analytics" size={16} color="#8C9EFF" />
                </View>
                <Text style={styles.statLabel}>
                  {t("portfolio.pnlPercentage")}
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: totalPnLPercentage >= 0 ? "#4CAF50" : "#F44336" },
                  ]}>
                  {formattedTotalPnLPercentage}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
        {displayAssets.length === 0 && !loading && (
          <View style={styles.welcomeContainer}>
            <LinearGradient
              colors={[
                "rgba(140, 158, 255, 0.15)",
                "rgba(140, 158, 255, 0.05)",
              ]}
              style={styles.welcomeGradient}>
              <Ionicons name="wallet-outline" size={48} color="#8C9EFF" />
              <Text style={styles.welcomeTitle}>
                {t("portfolio.welcomeTitle")}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                {t("portfolio.welcomeSubtitle")}
              </Text>
              <View style={styles.welcomeStats}>
                <View style={styles.welcomeStat}>
                  <Text style={styles.welcomeStatValue}>0</Text>
                  <Text style={styles.welcomeStatLabel}>
                    {t("portfolio.assetsCount")}
                  </Text>
                </View>
                <View style={styles.welcomeStatDivider} />
                <View style={styles.welcomeStat}>
                  <Text style={styles.welcomeStatValue}>$0.00</Text>
                  <Text style={styles.welcomeStatLabel}>
                    {t("portfolio.totalValueLabel")}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}
        {displayAssets.length > 0 && (
          <View style={styles.assetsHeader}>
            <Text style={styles.assetsTitle}>{t("portfolio.yourAssets")}</Text>
            <Text style={styles.assetsSubtitle}>
              {t("portfolio.assetsInPortfolio", {
                count: displayAssets.length,
                plural: displayAssets.length !== 1 ? "s" : "",
              })}
            </Text>
          </View>
        )}
      </View>
    );
  }, [
    loading,
    userLoading,
    realTimeLoading,
    formattedTotalBalance,
    portfolioChangePercent,
    formattedTotalPnL,
    displayAssets,
    user,
    formattedAvailableBalance,
    totalPnL,
    totalPnLPercentage,
    formattedTotalPnLPercentage,
    t,
  ]);

  const ListEmptyComponent = useMemo(() => {
    if (loading || userLoading || realTimeLoading) {
      return <View style={styles.loadingContainer}>{ShimmerAssetList}</View>;
    }
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>{t("portfolio.errorLoading")}</Text>
        </View>
      );
    }
    return null;
  }, [loading, userLoading, realTimeLoading, error, t]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={loading || userLoading || realTimeLoading}
        onRefresh={handleRefresh}
        tintColor="#8C9EFF"
        title={t("portfolio.pullToRefresh")}
        titleColor="#8C9EFF"
      />
    ),
    [loading, userLoading, realTimeLoading, handleRefresh, t]
  );

  const keyExtractor = useCallback((item: Asset) => item.id, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131523" />
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
        getItemLayout={(_, index) => ({
          length: 80,
          offset: 80 * index,
          index,
        })}
      />
    </View>
  );
};

export default PortfolioScreen;
