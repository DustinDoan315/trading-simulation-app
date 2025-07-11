import React, { useState } from 'react';
import { clearSearchHistory } from '@/features/searchHistorySlice';
import { formatAmount } from '@/utils/formatters';
import { height } from '@/utils/response';
import { Ionicons } from '@expo/vector-icons';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '@/utils/logger';
import { persistor } from '@/store';
import { resetBalance } from '@/features/balanceSlice';
import { resetFavorites } from '@/features/favoritesSlice';
import { ResetService } from '@/services/ResetService';
import { useAppDispatch } from '@/store';
import { useLanguage } from '@/context/LanguageContext';
import { UserBalance } from '@/services/CryptoService';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


// components/home/BalanceSection.tsx

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
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetPress = () => {
    setShowResetModal(true);
  };

  const dispatch = useAppDispatch();

  const confirmReset = async () => {
    setIsResetting(true);
    try {
      logger.info("Starting comprehensive reset", "BalanceSection");

      // Step 1: Reset Redux state
      dispatch(resetBalance());
      dispatch(resetFavorites());
      dispatch(clearSearchHistory());

      // Step 2: Clear Redux persist storage
      await persistor.purge();

      // Step 3: Comprehensive data reset using ResetService
      const resetResult = await ResetService.resetAppAndCreateNewUser();

      if (resetResult.success) {
        logger.info(
          "Comprehensive reset completed successfully",
          "BalanceSection",
          resetResult.details
        );
        // Call the callback if provided
        onResetBalance?.();

        setShowResetModal(false);

        // Show success message with details
        const successMessage =
          `Details:\n` +
          `• Local storage: ${
            resetResult.details.localStorage ? "✅" : "❌"
          }\n` +
          `• Cloud data: ${resetResult.details.cloudData ? "✅" : "⚠️"}\n` +
          `• User profile: ${resetResult.details.userProfile ? "✅" : "❌"}`;

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
      logger.error("Error during comprehensive reset", "BalanceSection", error);
      Alert.alert(
        t("balance.resetError") || "Reset Failed",
        t("balance.resetErrorMessage") ||
          "An unexpected error occurred during reset"
      );
    } finally {
      setIsResetting(false);
    }
  };

  const moveToPortfolio = () => {
    // router.navigate("/portfolio");
  };

  return (
    <LinearGradient colors={["#6262D9", "#9D62D9"]} style={styles.container}>
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
            : `$${formatAmount(balance.totalInUSD)}`}
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
    marginTop: height * 0.025,
    width: "94%",
    marginVertical: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 20,
    alignSelf: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  resetButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    opacity: 0.7,
  },
  resetText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  modalText: {
    color: "#9DA3B4",
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#2A2D3E",
  },
  confirmButton: {
    backgroundColor: "#6262D9",
  },
  confirmButtonDisabled: {
    backgroundColor: "#6262D9",
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },

  menuButton: {
    marginBottom: 20,
  },
  balanceTitle: {
    color: "white",
    fontSize: 18,
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
  },
});
