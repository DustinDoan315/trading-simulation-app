import React from "react";
import { AddButton } from "@/components/home/AddButton";
import { BalanceSection } from "@/components/home/BalanceSection";
import { navigateToCryptoChart } from "@/utils/navigation";
import { router } from "expo-router";
import { useHomeData } from "@/hooks/useHomeData";
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

const HomeScreen = () => {
  const { user, userStats, loading, refreshUserData } = useUser();
  const {
    refreshing,
    trending,
    balance,
    isBalanceHidden,
    onRefresh,
    onResetBalance,
  } = useHomeData();

  const navigateToChart = (crypto: any) => {
    navigateToCryptoChart(crypto);
  };

  const handleAddButtonPress = () => {
    console.log("Add button pressed");
  };

  const handleRefresh = async () => {
    if (user) {
      await refreshUserData(user.id);
    }
    onRefresh();
  };

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
          balance={balance}
          isBalanceHidden={isBalanceHidden}
          onResetBalance={onResetBalance}
        />

        {/* Portfolio Summary */}
        {userStats && user && (
          <View style={styles.portfolioSection}>
            <Text style={styles.sectionTitle}>Portfolio Summary</Text>
            <View style={styles.portfolioStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  $
                  {parseFloat(
                    userStats.portfolio_value || "0"
                  ).toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Total Value</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {userStats.total_assets || 0}
                </Text>
                <Text style={styles.statLabel}>Assets</Text>
              </View>
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    {
                      color:
                        parseFloat(user.total_pnl || "0") >= 0
                          ? "#10BA68"
                          : "#F9335D",
                    },
                  ]}>
                  {parseFloat(user.total_pnl || "0") >= 0 ? "+" : ""}$
                  {parseFloat(user.total_pnl || "0").toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Total P&L</Text>
              </View>
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
      <AddButton onPress={handleAddButtonPress} />
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
});

export default HomeScreen;
