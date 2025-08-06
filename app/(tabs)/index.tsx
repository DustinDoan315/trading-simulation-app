import SimulationDisclaimer from '@/components/common/SimulationDisclaimer';
import styles from './styles';
import { BalanceSection } from '@/components/home/BalanceSection';
import { CryptoNewsCard } from '@/components/home/CryptoNewsCard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { loadBalance } from '@/features/balanceSlice';
import { RootState, useAppDispatch } from '@/store';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useHomeData } from '@/hooks/useHomeData';
import { useLanguage } from '@/context/LanguageContext';
import { useSelector } from 'react-redux';
import { useUser } from '@/context/UserContext';
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CryptoNewsArticle,
  cryptoNewsService,
} from "@/services/CryptoNewsService";
import {
  ShimmerBalanceSection,
  ShimmerNewsCard,
  ShimmerPortfolioCard,
  ShimmerQuickActions,
} from "@/components/home/ShimmerHomePlaceholders";
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
  const { t } = useLanguage();

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

      if (articles.length === 0 && retryCount < 3) {
        setTimeout(() => {
          loadCryptoNews(retryCount + 1);
        }, 2000);
      }
    } catch (error) {
      if (retryCount < 3) {
        setTimeout(() => {
          loadCryptoNews(retryCount + 1);
        }, 2000);
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

  // Check if user is new (less than 20 trades)
  const isNewUser = !user || user.total_trades < 20;

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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeSection}>
            <ShimmerBalanceSection />
          </View>
          {isNewUser && (
            <View style={styles.quickActionsSection}>
              <ShimmerQuickActions />
            </View>
          )}
          <View style={styles.portfolioSection}>
            <ShimmerPortfolioCard />
          </View>
          <View style={styles.insightsSection}>
            {[1, 2, 3].map((_, idx) => (
              <ShimmerNewsCard key={idx} />
            ))}
          </View>
        </ScrollView>
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
                {t("home.welcomeBack", {
                  name: user.display_name || user.username,
                })}
              </Text>
              <View style={styles.userStatsContainer}>
                <View style={styles.statBadge}>
                  <Ionicons name="trending-up" size={16} color="#4BB543" />
                  <Text style={styles.statText}>
                    {user.total_trades} {t("home.trades")}
                  </Text>
                </View>
                {isNewUser && (
                  <View style={styles.newUserBadge}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.newUserText}>
                      {t("home.newTrader")}
                    </Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.welcomeText}>{t("home.welcomeToApp")}</Text>
              <Text style={styles.welcomeSubtext}>
                {t("home.welcomeSubtext")}
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
              {t("home.getStarted")}
            </Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction("learn")}>
                <LinearGradient
                  colors={["#6366F1", "#8B5CF6"]}
                  style={styles.quickActionGradient}>
                  <Ionicons name="school" size={28} color="white" />
                  <Text style={styles.quickActionTitle}>
                    {t("home.learnTrading")}
                  </Text>
                  <Text style={styles.quickActionSubtitle}>
                    {t("home.learnTradingSubtitle")}
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
                  <Text style={styles.quickActionTitle}>
                    {t("home.practice")}
                  </Text>
                  <Text style={styles.quickActionSubtitle}>
                    {t("home.practiceSubtitle")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => handleQuickAction("watchlist")}>
                <LinearGradient
                  colors={["#EC4899", "#F59E0B"]}
                  style={styles.quickActionGradient}>
                  <Ionicons name="star" size={28} color="white" />
                  <Text style={styles.quickActionTitle}>
                    {t("home.watchlist")}
                  </Text>
                  <Text style={styles.quickActionSubtitle}>
                    {t("home.watchlistSubtitle")}
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
                  <Text style={styles.quickActionTitle}>
                    {t("home.portfolio")}
                  </Text>
                  <Text style={styles.quickActionSubtitle}>
                    {t("home.portfolioSubtitle")}
                  </Text>
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
            <Text style={styles.sectionTitle}>
              {t("home.portfolioSummary")}
            </Text>
          </View>

          <LinearGradient
            colors={["#1F2937", "#374151"]}
            style={styles.portfolioCard}>
            <View style={styles.portfolioStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatPortfolioValue(portfolioMetrics.totalValue)}
                </Text>
                <Text style={styles.statLabel}>{t("home.totalValue")}</Text>
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
                <Text style={styles.statLabel}>{t("home.assets")}</Text>
                <View style={styles.statTrend}>
                  <Ionicons name="add-circle" size={12} color="#6366F1" />
                  <Text style={styles.trendText}>{t("home.active")}</Text>
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
                <Text style={styles.statLabel}>{t("home.totalPnL")}</Text>
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
                    {portfolioMetrics.totalPnL >= 0
                      ? t("home.profitable")
                      : t("home.learning")}
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
            <Text style={styles.sectionTitle}>{t("home.cryptoNews")}</Text>
          </View>

          {loadingNews ? (
            <View style={styles.newsLoadingContainer}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={styles.newsLoadingText}>
                {t("home.loadingLatestNews")}
              </Text>
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
              <Text style={styles.newsErrorText}>
                {t("home.noNewsAvailable")}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadCryptoNews()}>
                <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
