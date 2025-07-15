import React, { useEffect, useMemo, useState } from 'react';
import { AchievementCard } from '@/components/home/AchievementCard';
import { AddButton } from '@/components/home/AddButton';
import { BalanceSection } from '@/components/home/BalanceSection';
import { CryptoNewsCard } from '@/components/home/CryptoNewsCard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { loadBalance } from '@/features/balanceSlice';
import { MarketInsightsCard } from '@/components/home/MarketInsightsCard';
import { navigateToCryptoChart } from '@/utils/navigation';
import { RootState, useAppDispatch } from '@/store';
import { router } from 'expo-router';
import { useHomeData } from '@/hooks/useHomeData';
import { useSelector } from 'react-redux';
import { useUser } from '@/context/UserContext';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CryptoNewsArticle,
  cryptoNewsService,
} from "@/services/CryptoNewsService";
import {
  calculatePortfolioMetrics,
  formatPnL,
  formatPortfolioValue,
  getPnLColor,
} from "@/utils/helper";

const { width } = Dimensions.get("window");

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

  const reduxBalance = useSelector((state: RootState) => state.balance.balance);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const [newsArticles, setNewsArticles] = useState<CryptoNewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(loadBalance());
      loadCryptoNews();
    }
  }, [user, dispatch]);

  const handleRefresh = async () => {
    if (user) {
      await refreshUserData(user.id);
      dispatch(loadBalance());
    }
    await loadCryptoNews();
    onRefresh();
  };

  const loadCryptoNews = async (retryCount = 0) => {
    try {
      setLoadingNews(true);

      const articles = await cryptoNewsService.getTopCryptoNews(5);
      setNewsArticles(articles);

      // If no articles loaded and we haven't retried too many times, try again
      if (articles.length === 0 && retryCount < 3) {
        setTimeout(() => {
          loadCryptoNews(retryCount + 1);
        }, 2000); // Retry after 2 seconds
      }
    } catch (error) {
      // If error occurred and we haven't retried too many times, try again
      if (retryCount < 3) {
        setTimeout(() => {
          loadCryptoNews(retryCount + 1);
        }, 2000); // Retry after 2 seconds
      }
    } finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Calculate real-time portfolio metrics using utility function
  const portfolioMetrics = useMemo(() => {
    return calculatePortfolioMetrics(reduxBalance);
  }, [reduxBalance]);

  const balanceForDisplay = useMemo(() => {
    if (!reduxBalance) {
      return {
        usdtBalance: 0,
        totalPortfolioValue: 0,
        holdings: {},
      };
    }

    return reduxBalance;
  }, [reduxBalance]);

  // Check if user is new (less than 5 trades)
  const isNewUser = !user || user.total_trades < 5;

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "learn":
        router.push("/(subs)/learn-trading");
        break;
      case "practice":
        router.push("/(subs)/crypto-search");
        break;
      case "watchlist":
        router.push("/(tabs)/watchlist");
        break;
      case "portfolio":
        router.push("/(tabs)/portfolio");
        break;
    }
  };

  const handleNewsPress = (article: CryptoNewsArticle) => {
    router.push({
      pathname: "/(modals)/news-detail",
      params: {
        articleId: article.id,
        articleData: JSON.stringify(article),
      },
    });
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
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        <Animated.View
          style={[
            styles.welcomeSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}>
          {user ? (
            <>
              <Text style={styles.welcomeText}>
                Welcome back, {user.display_name || user.username}! 👋
              </Text>
              <View style={styles.userStatsContainer}>
                <View style={styles.statBadge}>
                  <Ionicons name="trending-up" size={16} color="#4BB543" />
                  <Text style={styles.statText}>
                    {user.total_trades} trades
                  </Text>
                </View>
                {isNewUser && (
                  <View style={styles.newUserBadge}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.newUserText}>New Trader</Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.welcomeText}>
                Welcome to Trading Simulator! 🚀
              </Text>
              <Text style={styles.welcomeSubtext}>
                Master trading with zero risk
              </Text>
            </>
          )}
        </Animated.View>

        <BalanceSection
          balance={balanceForDisplay}
          isBalanceHidden={isBalanceHidden}
          onResetBalance={onResetBalance}
        />

        {isNewUser && (
          <Animated.View
            style={[
              styles.quickActionsSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}>
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
              Get Started
            </Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction("learn")}>
                <LinearGradient
                  colors={["#6366F1", "#8B5CF6"]}
                  style={styles.quickActionGradient}>
                  <Ionicons name="school" size={28} color="white" />
                  <Text style={styles.quickActionTitle}>Learn Trading</Text>
                  <Text style={styles.quickActionSubtitle}>
                    Master the basics
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction("practice")}>
                <LinearGradient
                  colors={["#8B5CF6", "#EC4899"]}
                  style={styles.quickActionGradient}>
                  <Ionicons name="play" size={28} color="white" />
                  <Text style={styles.quickActionTitle}>Practice</Text>
                  <Text style={styles.quickActionSubtitle}>Start trading</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction("watchlist")}>
                <LinearGradient
                  colors={["#EC4899", "#F59E0B"]}
                  style={styles.quickActionGradient}>
                  <Ionicons name="star" size={28} color="white" />
                  <Text style={styles.quickActionTitle}>Watchlist</Text>
                  <Text style={styles.quickActionSubtitle}>
                    Track favorites
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction("portfolio")}>
                <LinearGradient
                  colors={["#6366F1", "#06B6D4"]}
                  style={styles.quickActionGradient}>
                  <Ionicons name="pie-chart" size={28} color="white" />
                  <Text style={styles.quickActionTitle}>Portfolio</Text>
                  <Text style={styles.quickActionSubtitle}>Track progress</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <Animated.View
          style={[
            styles.portfolioSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Portfolio Summary</Text>
          </View>

          <LinearGradient
            colors={["#1F2937", "#374151"]}
            style={styles.portfolioCard}>
            <View style={styles.portfolioStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatPortfolioValue(portfolioMetrics.totalValue)}
                </Text>
                <Text style={styles.statLabel}>Total Value</Text>
                <View style={styles.statTrend}>
                  <Ionicons
                    name={
                      portfolioMetrics.totalPnLPercentage >= 0
                        ? "trending-up"
                        : "trending-down"
                    }
                    size={12}
                    color={getPnLColor(portfolioMetrics.totalPnLPercentage)}
                  />
                  <Text
                    style={[
                      styles.trendText,
                      {
                        color: getPnLColor(portfolioMetrics.totalPnLPercentage),
                      },
                    ]}>{`${portfolioMetrics.totalPnLPercentage.toFixed(
                    2
                  )}%`}</Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {portfolioMetrics.totalAssets}
                </Text>
                <Text style={styles.statLabel}>Assets</Text>
                <View style={styles.statTrend}>
                  <Ionicons name="add-circle" size={12} color="#6366F1" />
                  <Text style={styles.trendText}>Active</Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    { color: getPnLColor(portfolioMetrics.totalPnL) },
                  ]}>
                  {formatPnL(portfolioMetrics.totalPnL)}
                </Text>
                <Text style={styles.statLabel}>Total P&L</Text>
                <View style={styles.statTrend}>
                  <Ionicons
                    name={
                      portfolioMetrics.totalPnL >= 0
                        ? "trending-up"
                        : "trending-down"
                    }
                    size={12}
                    color={getPnLColor(portfolioMetrics.totalPnL)}
                  />
                  <Text
                    style={[
                      styles.trendText,
                      { color: getPnLColor(portfolioMetrics.totalPnL) },
                    ]}>
                    {portfolioMetrics.totalPnL >= 0 ? "Profitable" : "Learning"}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View
          style={[
            styles.insightsSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Crypto News</Text>
          </View>

          {loadingNews ? (
            <View style={styles.newsLoadingContainer}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={styles.newsLoadingText}>Loading latest news...</Text>
            </View>
          ) : newsArticles.length > 0 ? (
            newsArticles.map((article) => (
              <CryptoNewsCard
                key={article.id}
                article={article}
                onPress={handleNewsPress}
              />
            ))
          ) : (
            <View style={styles.newsErrorContainer}>
              <Ionicons name="newspaper-outline" size={32} color="#9DA3B4" />
              <Text style={styles.newsErrorText}>No news available</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadCryptoNews()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F0F23",
  },
  loadingText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 16,
    letterSpacing: -0.5,
    textAlign: "left",
  },
  welcomeSubtext: {
    fontSize: 18,
    color: "#9CA3AF",
    marginTop: 8,
    fontWeight: "500",
    textAlign: "left",
  },
  userStatsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 20,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  statText: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "700",
  },
  newUserBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.3)",
  },
  newUserText: {
    fontSize: 12,
    color: "#EC4899",
    fontWeight: "700",
  },
  quickActionsSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textAlign: "left",
    marginBottom: 10,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  quickActionCard: {
    width: width / 2.45,
    height: 120,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quickActionGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "white",
    marginTop: 12,
    textAlign: "center",
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
    textAlign: "center",
    fontWeight: "500",
  },
  portfolioSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  portfolioCard: {
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
    elevation: 12,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  portfolioStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  statTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  trendText: {
    fontSize: 10,
    color: "#6366F1",
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    marginHorizontal: 2,
  },

  tipCard: {
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: "#EC4899",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  tipText: {
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 22,
    fontStyle: "italic",
    fontWeight: "500",
  },

  insightsSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  achievementsSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  newsLoadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  newsLoadingText: {
    fontSize: 15,
    color: "#9CA3AF",
    marginTop: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  newsErrorContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  newsErrorText: {
    fontSize: 15,
    color: "#9CA3AF",
    marginTop: 16,
    marginBottom: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  retryButtonText: {
    fontSize: 15,
    color: "white",
    fontWeight: "700",
  },
});

export default HomeScreen;
