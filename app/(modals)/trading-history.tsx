import React, { useCallback, useEffect, useState } from "react";
import { fetchTransactions } from "@/features/userSlice";
import { getColors } from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { logger } from "@/utils/logger";
import { router } from "expo-router";
import { Transaction } from "@/types/database";
import { TRANSACTION_LIMITS } from "@/utils/constant";
import { useAppDispatch } from "@/store";
import { useFocusEffect } from "@react-navigation/native";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TradingHistoryModal = () => {
  const dispatch = useAppDispatch();
  const { theme, isDark } = useTheme();
  const colors = getColors(theme);
  const { user, transactions, loading, error, refreshUserData } = useUser();
  const { t } = useLanguage();

  const [activeFilter, setActiveFilter] = useState<"all" | "buy" | "sell">(
    "all"
  );
  const [timePeriod, setTimePeriod] = useState<
    "all" | "1d" | "1w" | "1m" | "3m" | "1y"
  >("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      dispatch(
        fetchTransactions({
          userId: user.id,
          limit: TRANSACTION_LIMITS.FETCH_LIMIT,
        })
      );
    }
  }, [user?.id, dispatch]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        dispatch(
          fetchTransactions({
            userId: user.id,
            limit: TRANSACTION_LIMITS.FETCH_LIMIT,
          })
        );
      }
    }, [user?.id, dispatch])
  );

  const handleRefresh = async () => {
    if (!user?.id) return;

    try {
      setRefreshing(true);
      await dispatch(
        fetchTransactions({
          userId: user.id,
          limit: TRANSACTION_LIMITS.FETCH_LIMIT,
        })
      ).unwrap();
      await refreshUserData(user.id);
    } catch (error) {
      logger.error(
        "Failed to refresh trading history",
        "TradingHistory",
        error
      );
    } finally {
      setRefreshing(false);
    }
  };

  const getFilteredHistory = () => {
    if (!transactions) return [];

    let filtered = transactions;

    if (activeFilter !== "all") {
      filtered = filtered.filter(
        (trade) => trade.type.toLowerCase() === activeFilter
      );
    }

    if (timePeriod !== "all") {
      const now = new Date();
      const timePeriodMap = {
        "1d": 24 * 60 * 60 * 1000,
        "1w": 7 * 24 * 60 * 60 * 1000,
        "1m": 30 * 24 * 60 * 60 * 1000,
        "3m": 90 * 24 * 60 * 60 * 1000,
        "1y": 365 * 24 * 60 * 60 * 1000,
      };

      const cutoffTime = now.getTime() - timePeriodMap[timePeriod];
      filtered = filtered.filter((trade) => {
        const tradeTime = new Date(trade.timestamp).getTime();
        return tradeTime >= cutoffTime;
      });
    }

    return filtered;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return t("tradingHistory.justNow");
    if (diffInHours < 24)
      return t("tradingHistory.hoursAgo", { hours: diffInHours });

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
      return t("tradingHistory.daysAgo", { days: diffInDays });

    return date.toLocaleDateString();
  };

  const FORMATTING_THRESHOLDS = {
    THOUSAND: 1000,
    MILLION: 1000000,
  };

  const formatAmount = (value: string | number, decimals: number = 8) => {
    const num = typeof value === "string" ? parseFloat(value) : value;

    if (num < 0.0001) {
      return num.toExponential(4);
    }

    if (num < 1) {
      return num.toFixed(Math.min(2, decimals));
    }

    if (num >= FORMATTING_THRESHOLDS.MILLION) {
      return `${(num / FORMATTING_THRESHOLDS.MILLION).toFixed(2)}M`;
    } else if (num >= FORMATTING_THRESHOLDS.THOUSAND) {
      return `${(num / FORMATTING_THRESHOLDS.THOUSAND).toFixed(2)}K`;
    } else {
      return num.toFixed(Math.min(2, decimals));
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;

    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "#10BA68";
      case "PENDING":
        return "#FF9500";
      case "CANCELLED":
        return "#F9335D";
      case "FAILED":
        return "#F9335D";
      default:
        return "#9DA3B4";
    }
  };

  const getTypeGradient = (type: string): readonly [string, string] => {
    if (type === "BUY") {
      return ["#10BA68", "#0A8A4A"] as const;
    } else {
      return ["#F9335D", "#D42A4A"] as const;
    }
  };

  const TradeItem = ({ trade }: { trade: Transaction }) => {
    const gradientColors =
      theme === "dark"
        ? [colors.background.card, colors.background.cardSecondary]
        : [colors.background.card, colors.background.card];

    return (
      <View style={styles.tradeItem}>
        {theme === "dark" ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.tradeItemGradient,
              { borderColor: colors.border.card },
            ]}>
            <View style={styles.tradeHeader}>
              <View style={styles.symbolContainer}>
                <View
                  style={[
                    styles.symbolIcon,
                    { backgroundColor: colors.action.accent },
                  ]}>
                  <Text
                    style={[
                      styles.symbolIconText,
                      { color: colors.text.primary },
                    ]}>
                    {trade.symbol.charAt(0)}
                  </Text>
                </View>
                <View style={styles.symbolInfo}>
                  <Text style={[styles.symbol, { color: colors.text.primary }]}>
                    {trade.symbol}
                  </Text>
                  <Text
                    style={[
                      styles.symbolName,
                      { color: colors.text.secondary },
                    ]}>
                    {trade.symbol} {t("tradingHistory.token")}
                  </Text>
                </View>
              </View>

              <View style={styles.headerRight}>
                <LinearGradient
                  colors={getTypeGradient(trade.type)}
                  style={styles.typeBadge}>
                  <Ionicons
                    name={trade.type === "BUY" ? "arrow-down" : "arrow-up"}
                    size={12}
                    color="#FFFFFF"
                  />
                  <Text style={styles.typeText}>{trade.type}</Text>
                </LinearGradient>
                <Text
                  style={[styles.timestamp, { color: colors.text.secondary }]}>
                  {formatDate(trade.timestamp)}
                </Text>
              </View>
            </View>

            <View style={styles.amountSection}>
              <View style={styles.amountRow}>
                <Text
                  style={[
                    styles.amountLabel,
                    { color: colors.text.secondary },
                  ]}>
                  {t("tradingHistory.amount")}
                </Text>
                <Text
                  style={[styles.amountValue, { color: colors.text.primary }]}>
                  {formatAmount(trade.quantity)} {trade.symbol}
                </Text>
              </View>
              <View style={styles.amountRow}>
                <Text
                  style={[
                    styles.amountLabel,
                    { color: colors.text.secondary },
                  ]}>
                  {t("tradingHistory.price")}
                </Text>
                <Text
                  style={[styles.amountValue, { color: colors.text.primary }]}>
                  {formatCurrency(trade.price)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.totalSection,
                { borderTopColor: colors.border.card },
              ]}>
              <View style={styles.totalRow}>
                <Text
                  style={[styles.totalLabel, { color: colors.text.secondary }]}>
                  {t("tradingHistory.totalValue")}
                </Text>
                <Text
                  style={[styles.totalValue, { color: colors.text.primary }]}>
                  {formatCurrency(trade.total_value)}
                </Text>
              </View>
              {parseFloat(trade.fee) > 0 && (
                <View style={styles.feeRow}>
                  <Text
                    style={[styles.feeLabel, { color: colors.text.secondary }]}>
                    {t("tradingHistory.fee")}
                  </Text>
                  <Text
                    style={[styles.feeValue, { color: colors.action.sell }]}>
                    {formatCurrency(trade.fee)}
                  </Text>
                </View>
              )}
            </View>

            <View
              style={[
                styles.statusSection,
                { borderTopColor: colors.border.card },
              ]}>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(trade.status) },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(trade.status) },
                  ]}>
                  {trade.status}
                </Text>
              </View>
              <View
                style={[
                  styles.orderTypeContainer,
                  { backgroundColor: colors.background.cardSecondary },
                ]}>
                <Text
                  style={[
                    styles.orderTypeText,
                    { color: colors.text.secondary },
                  ]}>
                  {trade.order_type}
                </Text>
              </View>
            </View>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.tradeItemGradient,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.border.card,
              },
            ]}>
            <View style={styles.tradeHeader}>
              <View style={styles.symbolContainer}>
                <View
                  style={[
                    styles.symbolIcon,
                    { backgroundColor: colors.action.accent },
                  ]}>
                  <Text
                    style={[
                      styles.symbolIconText,
                      { color: colors.text.primary },
                    ]}>
                    {trade.symbol.charAt(0)}
                  </Text>
                </View>
                <View style={styles.symbolInfo}>
                  <Text style={[styles.symbol, { color: colors.text.primary }]}>
                    {trade.symbol}
                  </Text>
                  <Text
                    style={[
                      styles.symbolName,
                      { color: colors.text.secondary },
                    ]}>
                    {trade.symbol} {t("tradingHistory.token")}
                  </Text>
                </View>
              </View>

              <View style={styles.headerRight}>
                <LinearGradient
                  colors={getTypeGradient(trade.type)}
                  style={styles.typeBadge}>
                  <Ionicons
                    name={trade.type === "BUY" ? "arrow-down" : "arrow-up"}
                    size={12}
                    color="#FFFFFF"
                  />
                  <Text style={styles.typeText}>{trade.type}</Text>
                </LinearGradient>
                <Text
                  style={[styles.timestamp, { color: colors.text.secondary }]}>
                  {formatDate(trade.timestamp)}
                </Text>
              </View>
            </View>

            <View style={styles.amountSection}>
              <View style={styles.amountRow}>
                <Text
                  style={[
                    styles.amountLabel,
                    { color: colors.text.secondary },
                  ]}>
                  {t("tradingHistory.amount")}
                </Text>
                <Text
                  style={[styles.amountValue, { color: colors.text.primary }]}>
                  {formatAmount(trade.quantity)} {trade.symbol}
                </Text>
              </View>
              <View style={styles.amountRow}>
                <Text
                  style={[
                    styles.amountLabel,
                    { color: colors.text.secondary },
                  ]}>
                  {t("tradingHistory.price")}
                </Text>
                <Text
                  style={[styles.amountValue, { color: colors.text.primary }]}>
                  {formatCurrency(trade.price)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.totalSection,
                { borderTopColor: colors.border.card },
              ]}>
              <View style={styles.totalRow}>
                <Text
                  style={[styles.totalLabel, { color: colors.text.secondary }]}>
                  {t("tradingHistory.totalValue")}
                </Text>
                <Text
                  style={[styles.totalValue, { color: colors.text.primary }]}>
                  {formatCurrency(trade.total_value)}
                </Text>
              </View>
              {parseFloat(trade.fee) > 0 && (
                <View style={styles.feeRow}>
                  <Text
                    style={[styles.feeLabel, { color: colors.text.secondary }]}>
                    {t("tradingHistory.fee")}
                  </Text>
                  <Text
                    style={[styles.feeValue, { color: colors.action.sell }]}>
                    {formatCurrency(trade.fee)}
                  </Text>
                </View>
              )}
            </View>

            <View
              style={[
                styles.statusSection,
                { borderTopColor: colors.border.card },
              ]}>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(trade.status) },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(trade.status) },
                  ]}>
                  {trade.status}
                </Text>
              </View>
              <View
                style={[
                  styles.orderTypeContainer,
                  { backgroundColor: colors.background.cardSecondary },
                ]}>
                <Text
                  style={[
                    styles.orderTypeText,
                    { color: colors.text.secondary },
                  ]}>
                  {trade.order_type}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const FilterButton = ({
    title,
    value,
    isActive,
  }: {
    title: string;
    value: "all" | "buy" | "sell";
    isActive: boolean;
  }) => {
    const gradientColors = isActive
      ? [colors.action.accent, colors.action.accent]
      : theme === "dark"
      ? [colors.background.card, colors.background.cardSecondary]
      : [colors.background.card, colors.background.card];

    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          isActive && { borderColor: colors.action.accent },
        ]}
        onPress={() => setActiveFilter(value)}>
        {theme === "dark" ? (
          <LinearGradient
            colors={gradientColors}
            style={[
              styles.filterButtonGradient,
              {
                borderColor: isActive
                  ? colors.action.accent
                  : colors.border.card,
              },
            ]}>
            <Text
              style={[
                styles.filterButtonText,
                {
                  color: isActive ? colors.text.primary : colors.text.secondary,
                },
              ]}>
              {title}
            </Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.filterButtonGradient,
              {
                backgroundColor: isActive
                  ? colors.action.accent
                  : colors.background.card,
                borderColor: isActive
                  ? colors.action.accent
                  : colors.border.card,
              },
            ]}>
            <Text
              style={[
                styles.filterButtonText,
                {
                  color: isActive ? colors.text.primary : colors.text.secondary,
                },
              ]}>
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const TimeButton = ({
    title,
    value,
    isActive,
  }: {
    title: string;
    value: "all" | "1d" | "1w" | "1m" | "3m" | "1y";
    isActive: boolean;
  }) => {
    const gradientColors = isActive
      ? [colors.action.accent, colors.action.accent]
      : theme === "dark"
      ? [colors.background.card, colors.background.cardSecondary]
      : [colors.background.card, colors.background.card];

    return (
      <TouchableOpacity
        style={[
          styles.timeButton,
          isActive && { borderColor: colors.action.accent },
        ]}
        onPress={() => setTimePeriod(value)}>
        {theme === "dark" ? (
          <LinearGradient
            colors={gradientColors}
            style={[
              styles.timeButtonGradient,
              {
                borderColor: isActive
                  ? colors.action.accent
                  : colors.border.card,
              },
            ]}>
            <Text
              style={[
                styles.timeButtonText,
                {
                  color: isActive ? colors.text.primary : colors.text.secondary,
                },
              ]}>
              {title}
            </Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.timeButtonGradient,
              {
                backgroundColor: isActive
                  ? colors.action.accent
                  : colors.background.card,
                borderColor: isActive
                  ? colors.action.accent
                  : colors.border.card,
              },
            ]}>
            <Text
              style={[
                styles.timeButtonText,
                {
                  color: isActive ? colors.text.primary : colors.text.secondary,
                },
              ]}>
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredHistory = getFilteredHistory();
  const buyCount = filteredHistory.filter((t) => t.type === "BUY").length;
  const sellCount = filteredHistory.filter((t) => t.type === "SELL").length;

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={colors.background.primary}
        />
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: colors.background.card },
            ]}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t("tradingHistory.title")}
          </Text>
          <View style={styles.exportButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.action.accent} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            {t("tradingHistory.loadingTradingHistory")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.primary },
      ]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background.primary}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: colors.background.card },
          ]}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {t("tradingHistory.title")}
        </Text>
      </View>

      <View style={styles.timeFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TimeButton title="All" value="all" isActive={timePeriod === "all"} />
          <TimeButton title="1D" value="1d" isActive={timePeriod === "1d"} />
          <TimeButton title="1W" value="1w" isActive={timePeriod === "1w"} />
          <TimeButton title="1M" value="1m" isActive={timePeriod === "1m"} />
          <TimeButton title="3M" value="3m" isActive={timePeriod === "3m"} />
          <TimeButton title="1Y" value="1y" isActive={timePeriod === "1y"} />
        </ScrollView>
      </View>

      <View style={styles.filterContainer}>
        <FilterButton
          title={t("tradingHistory.all")}
          value="all"
          isActive={activeFilter === "all"}
        />
        <FilterButton
          title={t("tradingHistory.buy")}
          value="buy"
          isActive={activeFilter === "buy"}
        />
        <FilterButton
          title={t("tradingHistory.sell")}
          value="sell"
          isActive={activeFilter === "sell"}
        />
      </View>

      <View style={styles.statsContainer}>
        {theme === "dark" ? (
          <>
            <LinearGradient
              colors={[colors.background.card, colors.background.cardSecondary]}
              style={[styles.statCard, { borderColor: colors.border.card }]}>
              <Text
                style={[styles.statLabel, { color: colors.text.secondary }]}>
                {t("tradingHistory.totalTrades")}
              </Text>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {filteredHistory.length}
              </Text>
            </LinearGradient>
            {activeFilter === "all" && (
              <>
                <LinearGradient
                  colors={[
                    colors.background.card,
                    colors.background.cardSecondary,
                  ]}
                  style={[
                    styles.statCard,
                    { borderColor: colors.border.card },
                  ]}>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: colors.text.secondary },
                    ]}>
                    {t("tradingHistory.buyOrders")}
                  </Text>
                  <Text
                    style={[styles.statValue, { color: colors.text.primary }]}>
                    {buyCount}
                  </Text>
                </LinearGradient>
                <LinearGradient
                  colors={[
                    colors.background.card,
                    colors.background.cardSecondary,
                  ]}
                  style={[
                    styles.statCard,
                    { borderColor: colors.border.card },
                  ]}>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: colors.text.secondary },
                    ]}>
                    {t("tradingHistory.sellOrders")}
                  </Text>
                  <Text
                    style={[styles.statValue, { color: colors.text.primary }]}>
                    {sellCount}
                  </Text>
                </LinearGradient>
              </>
            )}
            {activeFilter === "buy" && (
              <LinearGradient
                colors={[
                  colors.background.card,
                  colors.background.cardSecondary,
                ]}
                style={[styles.statCard, { borderColor: colors.border.card }]}>
                <Text
                  style={[styles.statLabel, { color: colors.text.secondary }]}>
                  {t("tradingHistory.buyOrders")}
                </Text>
                <Text
                  style={[styles.statValue, { color: colors.text.primary }]}>
                  {buyCount}
                </Text>
              </LinearGradient>
            )}
            {activeFilter === "sell" && (
              <LinearGradient
                colors={[
                  colors.background.card,
                  colors.background.cardSecondary,
                ]}
                style={[styles.statCard, { borderColor: colors.border.card }]}>
                <Text
                  style={[styles.statLabel, { color: colors.text.secondary }]}>
                  {t("tradingHistory.sellOrders")}
                </Text>
                <Text
                  style={[styles.statValue, { color: colors.text.primary }]}>
                  {sellCount}
                </Text>
              </LinearGradient>
            )}
          </>
        ) : (
          <>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.card,
                },
              ]}>
              <Text
                style={[styles.statLabel, { color: colors.text.secondary }]}>
                {t("tradingHistory.totalTrades")}
              </Text>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {filteredHistory.length}
              </Text>
            </View>
            {activeFilter === "all" && (
              <>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: colors.border.card,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: colors.text.secondary },
                    ]}>
                    {t("tradingHistory.buyOrders")}
                  </Text>
                  <Text
                    style={[styles.statValue, { color: colors.text.primary }]}>
                    {buyCount}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: colors.border.card,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: colors.text.secondary },
                    ]}>
                    {t("tradingHistory.sellOrders")}
                  </Text>
                  <Text
                    style={[styles.statValue, { color: colors.text.primary }]}>
                    {sellCount}
                  </Text>
                </View>
              </>
            )}
            {activeFilter === "buy" && (
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.background.card,
                    borderColor: colors.border.card,
                  },
                ]}>
                <Text
                  style={[styles.statLabel, { color: colors.text.secondary }]}>
                  {t("tradingHistory.buyOrders")}
                </Text>
                <Text
                  style={[styles.statValue, { color: colors.text.primary }]}>
                  {buyCount}
                </Text>
              </View>
            )}
            {activeFilter === "sell" && (
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.background.card,
                    borderColor: colors.border.card,
                  },
                ]}>
                <Text
                  style={[styles.statLabel, { color: colors.text.secondary }]}>
                  {t("tradingHistory.sellOrders")}
                </Text>
                <Text
                  style={[styles.statValue, { color: colors.text.primary }]}>
                  {sellCount}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {error && (
        <View
          style={[
            styles.errorContainer,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.action.sell,
            },
          ]}>
          <Ionicons
            name="warning-outline"
            size={24}
            color={colors.action.sell}
          />
          <Text style={[styles.errorText, { color: colors.action.sell }]}>
            {error}
          </Text>
        </View>
      )}

      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TradeItem trade={item} />}
        style={styles.historyList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.historyListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.action.accent}
            colors={[colors.action.accent]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="receipt-outline"
              size={48}
              color={colors.text.secondary}
            />
            <Text style={[styles.emptyText, { color: colors.text.primary }]}>
              {t("tradingHistory.noTradingHistoryFound")}
            </Text>
            <Text
              style={[styles.emptySubtext, { color: colors.text.secondary }]}>
              {filteredHistory.length === 0 && transactions.length > 0
                ? t("tradingHistory.tryAdjustingFilters")
                : t("tradingHistory.startTradingToSeeHistory")}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1D2F",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  timeFilterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  timeButton: {
    borderRadius: 20,
    marginRight: 8,
    overflow: "hidden",
  },
  timeButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeTimeButton: {
    borderColor: "#6674CC",
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeTimeButtonText: {
    color: "#FFFFFF",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  filterButtonGradient: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  activeFilterButton: {
    borderColor: "#6674CC",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeFilterButtonText: {
    color: "#FFFFFF",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  historyList: {
    flex: 1,
  },
  historyListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tradeItem: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tradeItemGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  tradeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  symbolContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  symbolIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  symbolIconText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  symbolInfo: {
    flex: 1,
  },
  symbol: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  symbolName: {
    fontSize: 12,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  amountSection: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  amountValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  totalSection: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  feeValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  orderTypeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderTypeText: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
  },
});

export default TradingHistoryModal;
