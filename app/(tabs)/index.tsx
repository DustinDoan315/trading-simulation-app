import React from 'react';
import { AddButton } from '@/components/home/AddButton';
import { BalanceSection } from '@/components/home/BalanceSection';
import { router } from 'expo-router';
import { useHomeData } from '@/hooks/useHomeData';
import { WatchlistSection } from '@/components/home/WatchlistSection';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
} from "react-native";


const HomeScreen = () => {
  const { refreshing, trending, balance, isBalanceHidden, onRefresh } =
    useHomeData();

  const navigateToDetail = (id: string) => {
    router.navigate(`/(subs)/crypto-detail?id=${id}`);
  };

  const handleAddButtonPress = () => {
    // Add functionality for the add button
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
        <BalanceSection balance={balance} isBalanceHidden={isBalanceHidden} />

        <WatchlistSection
          cryptoList={trending}
          refreshing={false}
          onRefresh={() => {}}
          onItemPress={navigateToDetail}
          onAddPress={handleAddButtonPress}
          scrollEnabled={false} /* Disable scrolling in WatchlistSection */
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
