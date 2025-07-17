import React from 'react';
import { formatAmount } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import { UserBalance } from '@/features/balanceSlice';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


interface BalanceSectionProps {
  balance: UserBalance;
  isBalanceHidden: boolean;
  onMenuPress?: () => void;
  onResetBalance?: () => void;
}

export const BalanceSection: React.FC<BalanceSectionProps> = ({
  balance,
  isBalanceHidden,
}) => {
  const { t } = useLanguage();

  const moveToPortfolio = () => {
    console.log("moveToPortfolio");

    // router.push("/portfolio" as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundDecorations}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
      </View>

      <LinearGradient
        colors={["#6366F1", "#8B5CF6", "#EC4899"]}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <TouchableOpacity style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <View style={styles.leftHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="wallet" size={20} color="white" />
              </View>
              <Text style={styles.balanceTitle}>
                {t("balance.yourBalance")}
              </Text>
            </View>
          </View>

          <View style={styles.balanceDisplay}>
            <Text style={styles.balanceAmount}>
              {isBalanceHidden
                ? "********"
                : `$${formatAmount(balance.totalPortfolioValue)}`}
            </Text>
            <View style={styles.balanceSubtitle}>
              <Ionicons
                name="trending-up"
                size={14}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.balanceSubtitleText}>
                {t("balance.totalPortfolio")}
              </Text>
            </View>
          </View>
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <View style={styles.metricIcon}>
                <Ionicons name="cash" size={32} color="#FBBF24" />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricValue}>
                  {isBalanceHidden
                    ? "***"
                    : `$${formatAmount(balance.usdtBalance || 0)}`}
                </Text>
                <Text style={styles.metricLabel}>{t("balance.available")}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    width: "90%",
    alignSelf: "center",
    position: "relative",
  },
  backgroundDecorations: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  circle1: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  circle2: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  circle3: {
    position: "absolute",
    top: "50%",
    right: "10%",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  gradientContainer: {
    borderRadius: 24,
    elevation: 12,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    overflow: "hidden",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  leftHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  balanceTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.9,
  },
  balanceDisplay: {
    alignItems: "center",
    marginBottom: 24,
  },
  balanceAmount: {
    color: "white",
    fontSize: 38,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -1,
    marginBottom: 8,
  },
  balanceSubtitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceSubtitleText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  metricContent: {
    alignItems: "center",
  },
  metricValue: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 2,
  },
  metricLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
