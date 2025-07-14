import React, { useEffect, useMemo, useState } from "react";
import { AchievementCard } from "@/components/home/AchievementCard";
import { AddButton } from "@/components/home/AddButton";
import { BalanceSection } from "@/components/home/BalanceSection";
import { CryptoNewsCard } from "@/components/home/CryptoNewsCard";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { loadBalance } from "@/features/balanceSlice";
import { MarketInsightsCard } from "@/components/home/MarketInsightsCard";
import { navigateToCryptoChart } from "@/utils/navigation";
import { RootState, useAppDispatch } from "@/store";
import { router } from "expo-router";
import { TradingEducationCard } from "@/components/home/TradingEducationCard";
import { useHomeData } from "@/hooks/useHomeData";
import { useSelector } from "react-redux";
import { useUser } from "@/context/UserContext";
import { WatchListSection } from "@/components/home/WatchlistSection";
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

  // Get balance from Redux store
  const reduxBalance = useSelector((state: RootState) => state.balance.balance);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // News state
  const [newsArticles, setNewsArticles] = useState<CryptoNewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  const navigateToChart = (crypto: any) => {
    navigateToCryptoChart(crypto);
  };

  const handleAddButtonPress = () => {
    router.push("/(subs)/crypto-search");
  };

  const handleRefresh = async () => {
    if (user) {
      await refreshUserData(user.id);
      // Also refresh Redux balance
      dispatch(loadBalance());
    }
    // Refresh news as well
    await loadCryptoNews();
    onRefresh();
  };

  // Load balance from database on component mount
  useEffect(() => {
    if (user) {
      dispatch(loadBalance());
    }
  }, [user, dispatch]);

  // Load crypto news
  useEffect(() => {
    loadCryptoNews();
  }, []);

  const loadCryptoNews = async () => {
    try {
      setLoadingNews(true);
      const articles = await cryptoNewsService.getTopCryptoNews(3);
      setNewsArticles(articles);
    } catch (error) {
      console.error("Error loading crypto news:", error);
    } finally {
      setLoadingNews(false);
    }
  };

  // Animate components on mount
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

  // Use the Redux balance directly since interfaces are now standardized
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
        // Navigate to learning section or show tutorial
        break;
      case "practice":
        router.push("/(subs)/crypto-search");
        break;
      case "watchlist":
        // Focus on watchlist section
        break;
      case "portfolio":
        router.push("/(tabs)/portfolio");
        break;
    }
  };

  const handleNewsPress = (article: CryptoNewsArticle) => {
    router.push({
      pathname: "/(modals)/news-detail",
      params: { articleId: article.id },
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
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {/* Enhanced Welcome Section */}
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

        {/* Quick Actions for New Users */}
        {isNewUser && (
          <Animated.View
            style={[
              styles.quickActionsSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}>
            <Text style={styles.sectionTitle}>Get Started</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction("learn")}>
                <LinearGradient
                  colors={["#4BB543", "#45A03D"]}
                  style={styles.quickActionGradient}>
                  <Ionicons name="school" size={24} color="white" />
                  <Text style={styles.quickActionTitle}>Learn</Text>
                  <Text style={styles.quickActionSubtitle}>Trading basics</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction("practice")}>
                <LinearGradient
                  colors={["#6262D9", "#9D62D9"]}
                  style={styles.quickActionGradient}>
                  <Ionicons name="play" size={24} color="white" />
                  <Text style={styles.quickActionTitle}>Practice</Text>
                  <Text style={styles.quickActionSubtitle}>Start trading</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction("watchlist")}>
                <LinearGradient
                  colors={["#FF6B6B", "#FF8E53"]}
                  style={styles.quickActionGradient}>
                  <Ionicons name="eye" size={24} color="white" />
                  <Text style={styles.quickActionTitle}>Watch</Text>
                  <Text style={styles.quickActionSubtitle}>Market trends</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction("portfolio")}>
                <LinearGradient
                  colors={["#4ECDC4", "#44A08D"]}
                  style={styles.quickActionGradient}>
                  <Ionicons name="pie-chart" size={24} color="white" />
                  <Text style={styles.quickActionTitle}>Portfolio</Text>
                  <Text style={styles.quickActionSubtitle}>Track progress</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Enhanced Portfolio Summary */}
        <Animated.View
          style={[
            styles.portfolioSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Portfolio Summary</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={16} color="#6262D9" />
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={["#1A1D2F", "#2A2D3F"]}
            style={styles.portfolioCard}>
            <View style={styles.portfolioStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatPortfolioValue(portfolioMetrics.totalValue)}
                </Text>
                <Text style={styles.statLabel}>Total Value</Text>
                <View style={styles.statTrend}>
                  <Ionicons name="trending-up" size={12} color="#4BB543" />
                  <Text style={styles.trendText}>+2.5%</Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {portfolioMetrics.totalAssets}
                </Text>
                <Text style={styles.statLabel}>Assets</Text>
                <View style={styles.statTrend}>
                  <Ionicons name="add-circle" size={12} color="#6262D9" />
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

        {/* Trading Tip of the Day */}
        <Animated.View
          style={[
            styles.tipSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}>
          <LinearGradient
            colors={["#FFD700", "#FFA500"]}
            style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={20} color="#8B4513" />
              <Text style={styles.tipTitle}>Trading Tip</Text>
            </View>
            <Text style={styles.tipText}>
              "Start with small positions and focus on learning market patterns
              before scaling up your trades."
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Educational Content for New Users */}
        {isNewUser && (
          <Animated.View
            style={[
              styles.educationSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Learn Trading</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="arrow-forward" size={16} color="#6262D9" />
              </TouchableOpacity>
            </View>

            <TradingEducationCard
              title="Crypto Trading Basics"
              description="Learn the fundamentals of cryptocurrency trading, including market orders, limit orders, and risk management."
              icon="school"
              gradientColors={["#4BB543", "#45A03D"]}
              difficulty="Beginner"
              duration="10 min"
              onPress={() => handleQuickAction("learn")}
            />

            <TradingEducationCard
              title="Technical Analysis"
              description="Master chart patterns, indicators, and technical analysis tools to make informed trading decisions."
              icon="analytics"
              gradientColors={["#6262D9", "#9D62D9"]}
              difficulty="Intermediate"
              duration="15 min"
              onPress={() => handleQuickAction("learn")}
            />
          </Animated.View>
        )}

        <WatchListSection
          cryptoList={trending}
          refreshing={false}
          onRefresh={() => {}}
          onItemPress={navigateToChart}
          scrollEnabled={false}
        />

        {/* Market Insights */}
        <Animated.View
          style={[
            styles.insightsSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Crypto News</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={16} color="#6262D9" />
            </TouchableOpacity>
          </View>

          {loadingNews ? (
            <View style={styles.newsLoadingContainer}>
              <ActivityIndicator size="small" color="#6262D9" />
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
                onPress={loadCryptoNews}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Achievements for New Users */}
        {isNewUser && (
          <Animated.View
            style={[
              styles.achievementsSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Progress</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="arrow-forward" size={16} color="#6262D9" />
              </TouchableOpacity>
            </View>

            <AchievementCard
              title="First Trade"
              description="Complete your first cryptocurrency trade"
              icon="rocket"
              progress={user?.total_trades || 0}
              maxProgress={1}
              isCompleted={(user?.total_trades || 0) >= 1}
              reward="+100 XP"
              onPress={() => handleQuickAction("practice")}
            />

            <AchievementCard
              title="Portfolio Builder"
              description="Hold 3 different cryptocurrencies"
              icon="pie-chart"
              progress={portfolioMetrics.totalAssets}
              maxProgress={3}
              isCompleted={portfolioMetrics.totalAssets >= 3}
              reward="+250 XP"
              onPress={() => handleQuickAction("portfolio")}
            />

            <AchievementCard
              title="Learning Champion"
              description="Complete 5 educational modules"
              icon="school"
              progress={0}
              maxProgress={5}
              isCompleted={false}
              reward="+500 XP"
              onPress={() => handleQuickAction("learn")}
            />
          </Animated.View>
        )}
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
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: "#9DA3B4",
    marginTop: 4,
  },
  userStatsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(75, 181, 67, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: "#4BB543",
    fontWeight: "600",
  },
  newUserBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  newUserText: {
    fontSize: 12,
    color: "#FFD700",
    fontWeight: "600",
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: "#6262D9",
    fontWeight: "600",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionCard: {
    width: (width - 64) / 2 - 6,
    height: 100,
    borderRadius: 16,
    overflow: "hidden",
  },
  quickActionGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginTop: 8,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  portfolioSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  portfolioCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: "#9DA3B4",
    marginBottom: 8,
  },
  statTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendText: {
    fontSize: 10,
    color: "#4BB543",
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  tipSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tipCard: {
    borderRadius: 16,
    padding: 16,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B4513",
  },
  tipText: {
    fontSize: 14,
    color: "#8B4513",
    lineHeight: 20,
    fontStyle: "italic",
  },
  educationSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  insightsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  achievementsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  newsLoadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  newsLoadingText: {
    fontSize: 14,
    color: "#9DA3B4",
    marginTop: 8,
  },
  newsErrorContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  newsErrorText: {
    fontSize: 14,
    color: "#9DA3B4",
    marginTop: 8,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#6262D9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
});

export default HomeScreen;
