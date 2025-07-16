import React, { useState } from 'react';
import { AddButton } from '@/components/home/AddButton';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { navigateToCryptoChart } from '@/utils/navigation';
import { router } from 'expo-router';
import { useAppSelector } from '@/store';
import { useHomeData } from '@/hooks/useHomeData';
import { useLanguage } from '@/context/LanguageContext';
import { WatchListSection } from '@/components/home/WatchlistSection';
import {
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


const { width: screenWidth } = Dimensions.get("window");

const WatchlistScreen = () => {
  const { t } = useLanguage();
  const { trending, onRefresh } = useHomeData();
  const [refreshing, setRefreshing] = useState(false);
  const favoriteIds = useAppSelector((state) => state.favorites.favoriteIds);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const handleItemPress = (crypto: any) => {
    navigateToCryptoChart(crypto);
  };

  const handleAddToWatchlist = () => {
    router.push("/(subs)/crypto-search");
  };

  const filteredList = trending.filter((crypto) =>
    favoriteIds.includes(crypto.id)
  );

  const gainingCount = filteredList.filter(
    (crypto) => crypto.price_change_percentage_24h > 0
  ).length;

  const decliningCount = filteredList.filter(
    (crypto) => crypto.price_change_percentage_24h < 0
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#667eea"
            colors={["#667eea"]}
          />
        }>
        {filteredList.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={["rgba(102, 126, 234, 0.1)", "rgba(118, 75, 162, 0.1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyStateCard}>
              <View style={styles.emptyStateIconContainer}>
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  style={styles.emptyStateIconGradient}>
                  <Ionicons name="star" size={32} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.emptyStateTitle}>
                {t("watchList.emptyTitle")}
              </Text>
              <Text style={styles.emptyStateDescription}>
                {t("watchList.emptyDescription")}
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleAddToWatchlist}>
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyStateButtonGradient}>
                  <Ionicons name="add-circle" size={20} color="white" />
                  <Text style={styles.emptyStateButtonText}>
                    {t("watchList.addFirstCrypto")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.watchlistContainer}>
            <View style={styles.statsSection}>
              <LinearGradient
                colors={[
                  "rgba(102, 126, 234, 0.15)",
                  "rgba(118, 75, 162, 0.15)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statsCard}>
                <View style={styles.statsHeader}>
                  <Text style={styles.statsTitle}>
                    {t("watchList.portfolioOverview")}
                  </Text>
                  <View style={styles.statsBadge}>
                    <Text style={styles.statsBadgeText}>
                      {filteredList.length} {t("watchList.assets")}
                    </Text>
                  </View>
                </View>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <Ionicons name="eye" size={20} color="#667eea" />
                    </View>
                    <Text style={styles.statValue}>{filteredList.length}</Text>
                    <Text style={styles.statLabel}>
                      {t("watchList.watching")}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View
                      style={[styles.statIconContainer, styles.gainingIcon]}>
                      <Ionicons name="trending-up" size={20} color="#10b981" />
                    </View>
                    <Text style={[styles.statValue, styles.gainingValue]}>
                      {gainingCount}
                    </Text>
                    <Text style={styles.statLabel}>
                      {t("watchList.gaining")}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View
                      style={[styles.statIconContainer, styles.decliningIcon]}>
                      <Ionicons
                        name="trending-down"
                        size={20}
                        color="#ef4444"
                      />
                    </View>
                    <Text style={[styles.statValue, styles.decliningValue]}>
                      {decliningCount}
                    </Text>
                    <Text style={styles.statLabel}>
                      {t("watchList.declining")}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.watchlistSection}>
              <WatchListSection
                title=""
                cryptoList={trending}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                onItemPress={handleItemPress}
                scrollEnabled={false}
              />
            </View>
          </View>
        )}
      </ScrollView>
      <View
        style={{
          position: "absolute",
          bottom: -5,
          right: 0,
        }}>
        <AddButton onPress={handleAddToWatchlist} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a1a",
  },
  header: {
    backgroundColor: "rgba(102, 126, 234, 0.05)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(102, 126, 234, 0.1)",
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
  },
  addButton: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  emptyStateCard: {
    alignItems: "center",
    padding: 48,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(102, 126, 234, 0.2)",
    elevation: 16,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    width: screenWidth - 48,
  },
  emptyStateIconContainer: {
    marginBottom: 24,
  },
  emptyStateIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 40,
    paddingHorizontal: 16,
    fontWeight: "500",
  },
  emptyStateButton: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  emptyStateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 10,
  },
  emptyStateButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "white",
  },
  watchlistContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statsSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  statsCard: {
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(102, 126, 234, 0.15)",
    elevation: 12,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  statsBadge: {
    backgroundColor: "rgba(102, 126, 234, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statsBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#667eea",
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(102, 126, 234, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  gainingIcon: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  decliningIcon: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  gainingValue: {
    color: "#10b981",
  },
  decliningValue: {
    color: "#ef4444",
  },
  statLabel: {
    fontSize: 11,
    color: "#94a3b8",
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: "rgba(102, 126, 234, 0.15)",
    marginHorizontal: 16,
  },
  watchlistSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  sectionBadge: {
    backgroundColor: "rgba(102, 126, 234, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#667eea",
  },
});

export default WatchlistScreen;
