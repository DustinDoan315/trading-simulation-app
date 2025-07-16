import React, { useState } from 'react';
import { clearSearchHistory } from '@/features/searchHistorySlice';
import { forceRefreshAllData } from '@/utils/resetUtils';
import { formatAmount } from '@/utils/formatters';
import { height } from '@/utils/response';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { loadBalance, resetBalance } from '@/features/balanceSlice';
import { logger } from '@/utils/logger';
import { persistor } from '@/store';
import { resetFavorites } from '@/features/favoritesSlice';
import { useAppDispatch } from '@/store';
import { useLanguage } from '@/context/LanguageContext';
import { UserBalance } from '@/features/balanceSlice';
import { UserService } from '@/services/UserService';
import { useUser } from '@/context/UserContext';
import {
  Alert,
  Modal,
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
  onMenuPress,
  onResetBalance,
}) => {
  const { t } = useLanguage();
  const { user, refreshUserData } = useUser();
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetPress = () => {
    setShowResetModal(true);
  };

  const dispatch = useAppDispatch();

  const confirmReset = async () => {
    setIsResetting(true);
    try {
      logger.info("Starting user data reset", "BalanceSection");

      if (!user?.id) {
        throw new Error("No user ID available for reset");
      }

      dispatch(resetBalance());
      dispatch(resetFavorites());
      dispatch(clearSearchHistory());

      await persistor.purge();

      const resetResult = await UserService.resetUserDataToDefault(user.id);

      if (resetResult.success) {
        logger.info(
          "User data reset completed successfully",
          "BalanceSection",
          resetResult.details
        );

        try {
          await forceRefreshAllData(user.id, dispatch, refreshUserData);
        } catch (refreshError) {
          logger.warn(
            "Error refreshing data after reset",
            "BalanceSection",
            refreshError
          );
        }

        onResetBalance?.();

        setShowResetModal(false);

        const successMessage =
          `Reset Details:\n` +
          `• Portfolio: ${resetResult.details.portfolio ? "✅" : "❌"}\n` +
          `• Transactions: ${
            resetResult.details.transactions ? "✅" : "❌"
          }\n` +
          `• Favorites: ${resetResult.details.favorites ? "✅" : "❌"}\n` +
          `• Leaderboard: ${resetResult.details.leaderboard ? "✅" : "❌"}\n` +
          `• User Profile: ${
            resetResult.details.userProfile ? "✅" : "❌"
          }\n\n` +
          `Local data has been refreshed.`;

        Alert.alert(
          t("balance.resetSuccess") || "Reset Successful",
          successMessage
        );
      } else {
        logger.error("Reset failed", "BalanceSection", resetResult.error);
        Alert.alert(
          t("balance.resetError") || "Reset Failed",
          resetResult.error || "An error occurred during reset"
        );
      }
    } catch (error) {
      logger.error("Error during user data reset", "BalanceSection", error);
      Alert.alert(
        t("balance.resetError") || "Reset Failed",
        t("balance.resetErrorMessage") ||
          "An unexpected error occurred during reset"
      );
    } finally {
      setIsResetting(false);
    }
  };

  const moveToPortfolio = () => {};

  // Calculate portfolio metrics
  const totalPnL =
    balance.totalPortfolioValue - (balance.usdtBalance || 100000);
  const pnLPercentage = (totalPnL / (balance.usdtBalance || 100000)) * 100;
  const isPositivePnL = totalPnL >= 0;

  return (
    <View style={styles.container}>
      {/* Background decorative elements */}
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
        <TouchableOpacity
          onPress={moveToPortfolio}
          style={styles.contentContainer}>
          {/* Header with icons and actions */}
          <View style={styles.headerRow}>
            <View style={styles.leftHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="wallet" size={20} color="white" />
              </View>
              <Text style={styles.balanceTitle}>
                {t("balance.yourBalance")}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.resetButton,
                isResetting && styles.resetButtonDisabled,
              ]}
              onPress={handleResetPress}
              disabled={isResetting}>
              <Ionicons
                name={isResetting ? "hourglass" : "refresh"}
                size={16}
                color="white"
              />
            </TouchableOpacity>
          </View>

          {/* Main balance display */}
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

          {/* Portfolio metrics */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <View style={styles.metricIcon}>
                <Ionicons
                  name={isPositivePnL ? "trending-up" : "trending-down"}
                  size={16}
                  color={isPositivePnL ? "#4ADE80" : "#F87171"}
                />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricValue}>
                  {isBalanceHidden
                    ? "***"
                    : `${isPositivePnL ? "+" : ""}${formatAmount(totalPnL)}`}
                </Text>
                <Text style={styles.metricLabel}>{t("balance.totalPnL")}</Text>
              </View>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <View style={styles.metricIcon}>
                <Ionicons name="analytics" size={16} color="#60A5FA" />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricValue}>
                  {isBalanceHidden
                    ? "***"
                    : `${isPositivePnL ? "+" : ""}${pnLPercentage.toFixed(2)}%`}
                </Text>
                <Text style={styles.metricLabel}>
                  {t("balance.percentage")}
                </Text>
              </View>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <View style={styles.metricIcon}>
                <Ionicons name="cash" size={16} color="#FBBF24" />
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

          {/* Quick action indicator */}
          <View style={styles.quickAction}>
            <Ionicons
              name="chevron-forward"
              size={16}
              color="rgba(255,255,255,0.7)"
            />
            <Text style={styles.quickActionText}>
              {t("balance.viewPortfolio")}
            </Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isResetting && setShowResetModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("balance.resetBalance")}</Text>
            <Text style={styles.modalText}>
              {isResetting
                ? t("balance.resettingMessage") ||
                  "Resetting all data to default values. This may take a moment..."
                : t("balance.resetConfirmation") ||
                  "This will reset ALL your data including:\n\n• Portfolio and balance\n• Transaction history\n• Favorites and search history\n• Local and cloud data\n\nThis action cannot be undone."}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => !isResetting && setShowResetModal(false)}
                disabled={isResetting}>
                <Text style={styles.buttonText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  isResetting && styles.confirmButtonDisabled,
                ]}
                onPress={confirmReset}
                disabled={isResetting}>
                <Text style={styles.buttonText}>
                  {isResetting
                    ? t("balance.resetting") || "Resetting..."
                    : t("common.confirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 24,
    paddingVertical: 24,
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
  resetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  resetButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    opacity: 0.7,
  },
  balanceDisplay: {
    alignItems: "center",
    marginBottom: 24,
  },
  balanceAmount: {
    color: "white",
    fontSize: 42,
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
    marginBottom: 20,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricIcon: {
    width: 32,
    height: 32,
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
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  metricLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
  },
  quickActionText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#1F2937",
    borderRadius: 20,
    padding: 24,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
  },
  modalText: {
    color: "#9CA3AF",
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#374151",
  },
  confirmButton: {
    backgroundColor: "#6366F1",
  },
  confirmButtonDisabled: {
    backgroundColor: "#6366F1",
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
