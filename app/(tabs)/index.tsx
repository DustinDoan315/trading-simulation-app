import React, { useEffect, useMemo } from "react";
import { AddButton } from "@/components/home/AddButton";
import { BalanceSection } from "@/components/home/BalanceSection";
import { loadBalance } from "@/features/balanceSlice";
import { navigateToCryptoChart } from "@/utils/navigation";
import { RootState, useAppDispatch } from "@/store";
import { router } from "expo-router";
import { useHomeData } from "@/hooks/useHomeData";
import { useSelector } from "react-redux";
import { useUser } from "@/context/UserContext";
import { WatchListSection } from "@/components/home/WatchlistSection";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  calculatePortfolioMetrics,
  formatPnL,
  formatPortfolioValue,
  getPnLColor,
} from "@/utils/helper";

const HomeScreen = () => {
  const dispatch = useAppDispatch();
  const { user, userStats, loading, refreshUserData } = useUser();
  const {
    refreshing,
    trending,
    balance,
    isBalanceHidden,
    onRefresh,
    onResetBalance,
  } = useHomeData();

  // Get balance from Redux store
  const reduxBalance = useSelector((state: RootState) => state.balance.balance);

  const navigateToChart = (crypto: any) => {
    navigateToCryptoChart(crypto);
  };

  const handleAddButtonPress = () => {
    console.log("Add button pressed");
  };

  const handleRefresh = async () => {
    if (user) {
      await refreshUserData(user.id);
      // Also refresh Redux balance
      dispatch(loadBalance());
    }
    onRefresh();
  };

  // Load balance from database on component mount
  useEffect(() => {
    if (user) {
      dispatch(loadBalance());
    }
  }, [user, dispatch]);

  // Calculate real-time portfolio metrics using utility function
  const portfolioMetrics = useMemo(() => {
    return calculatePortfolioMetrics(reduxBalance);
  }, [reduxBalance]);

  // Create a proper UserBalance object for BalanceSection
  const balanceForDisplay = useMemo(() => {
    if (!reduxBalance) {
      return {
        totalInUSD: 0,
        holdings: {},
      };
    }

    return {
      totalInUSD: reduxBalance.totalPortfolioValue,
      holdings: reduxBalance.holdings,
    };
  }, [reduxBalance]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {/* User Welcome Section */}
        {user && (
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>
              Welcome back, {user.display_name || user.username}! 👋
            </Text>
            <Text style={styles.userStats}>
              {user.total_trades} trades •{" "}
              {parseFloat(user.win_rate).toFixed(1)}% win rate
            </Text>
          </View>
        )}

        <BalanceSection
          balance={balanceForDisplay}
          isBalanceHidden={isBalanceHidden}
          onResetBalance={onResetBalance}
        />

        {/* Portfolio Summary */}
        {user && (
          <View style={styles.portfolioSection}>
            <Text style={styles.sectionTitle}>Portfolio Summary</Text>
            <View style={styles.portfolioStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatPortfolioValue(portfolioMetrics.totalValue)}
                </Text>
                <Text style={styles.statLabel}>Total Value</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {portfolioMetrics.totalAssets}
                </Text>
                <Text style={styles.statLabel}>Assets</Text>
              </View>
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    { color: getPnLColor(portfolioMetrics.totalPnL) },
                  ]}>
                  {formatPnL(portfolioMetrics.totalPnL)}
                </Text>
                <Text style={styles.statLabel}>Total P&L</Text>
              </View>
            </View>
            {/* P&L Percentage */}
            <View style={styles.pnlPercentageContainer}>
              <Text
                style={[
                  styles.pnlPercentage,
                  { color: getPnLColor(portfolioMetrics.totalPnLPercentage) },
                ]}>
                {portfolioMetrics.totalPnLPercentage >= 0 ? "+" : ""}
                {portfolioMetrics.totalPnLPercentage.toFixed(2)}%
              </Text>
            </View>
          </View>
        )}

        <WatchListSection
          cryptoList={trending}
          refreshing={false}
          onRefresh={() => {}}
          onItemPress={navigateToChart}
          scrollEnabled={false}
        />
      </ScrollView>
      <View
        style={{
          position: "absolute",
          bottom: -10,
          right: 0,
        }}>
        <AddButton onPress={handleAddButtonPress} />
      </View>
    </SafeAreaView>
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
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#131523",
  },
  loadingText: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userStats: {
    fontSize: 14,
    color: "#9DA3B4",
  },
  portfolioSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  portfolioStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9DA3B4",
  },
  pnlPercentageContainer: {
    alignItems: "center",
    marginTop: 12,
  },
  pnlPercentage: {
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default HomeScreen;
