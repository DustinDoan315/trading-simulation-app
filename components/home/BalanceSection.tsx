import React, { useState } from 'react';
import { clearSearchHistory } from '@/features/searchHistorySlice';
import { forceRefreshAllData } from '@/utils/resetUtils';
import { formatAmount } from '@/utils/formatters';
import { height } from '@/utils/response';
import { Ionicons } from '@expo/vector-icons';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
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

  return (
    <LinearGradient colors={["#6366F1", "#8B5CF6"]} style={styles.container}>
      <TouchableOpacity onPress={moveToPortfolio}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            <LanguageSwitcher />
          </TouchableOpacity>
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
            }}>
            <TouchableOpacity
              style={[
                styles.resetButton,
                isResetting && styles.resetButtonDisabled,
              ]}
              onPress={handleResetPress}
              disabled={isResetting}>
              <Ionicons
                name={isResetting ? "hourglass" : "refresh"}
                size={18}
                color="white"
              />
              <Text style={styles.resetText}>
                {isResetting
                  ? t("balance.resetting") || "Resetting..."
                  : t("balance.reset")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.balanceTitle}>{t("balance.yourBalance")}</Text>
        <Text style={styles.balanceAmount}>
          {isBalanceHidden
            ? "********"
            : `$${formatAmount(balance.totalPortfolioValue)}`}
        </Text>
      </TouchableOpacity>

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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    width: "90%",
    alignSelf: "center",
    elevation: 12,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    gap: 6,
  },
  resetButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    opacity: 0.7,
  },
  resetText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
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
  menuButton: {
    marginBottom: 0,
  },
  balanceTitle: {
    color: "white",
    fontSize: 18,
    opacity: 0.9,
    marginBottom: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  balanceAmount: {
    color: "white",
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
});
