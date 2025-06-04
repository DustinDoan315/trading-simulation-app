import React from "react";
import { AddButton } from "@/components/home/AddButton";
import { BalanceSection } from "@/components/home/BalanceSection";
import { router } from "expo-router";
import { useHomeData } from "@/hooks/useHomeData";
import { WatchListSection } from "@/components/home/WatchlistSection";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
} from "react-native";
import { CryptoCurrency } from "@/services/CryptoService";

const HomeScreen = () => {
  const {
    refreshing,
    trending,
    balance,
    isBalanceHidden,
    onRefresh,
    onResetBalance,
  } = useHomeData();

  const navigateToChart = (crypto: CryptoCurrency) => {
    router.push({
      pathname: "/(subs)/crypto-chart",
      params: {
        id: crypto.id,
        symbol: crypto.symbol
          ? `${crypto.symbol.toLocaleUpperCase()}/USDT`
          : "BTC/USDT",
        name: crypto.name,
        image_url: crypto.image || "",
      },
    });
  };

  const handleAddButtonPress = () => {
    console.log("Add button pressed");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <BalanceSection
          balance={balance}
          isBalanceHidden={isBalanceHidden}
          onResetBalance={onResetBalance}
        />

        <WatchListSection
          cryptoList={trending}
          refreshing={false}
          onRefresh={() => {}}
          onItemPress={navigateToChart}
          onAddPress={handleAddButtonPress}
          scrollEnabled={false}
        />
      </ScrollView>
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
});

export default HomeScreen;
