import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Alert,
} from "react-native";
import { UserBalance } from "@/services/CryptoService";
import { formatAmount } from "@/utils/formatters";

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
  const [showResetModal, setShowResetModal] = useState(false);

  const handleResetPress = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    onResetBalance?.();
    setShowResetModal(false);
    Alert.alert("Success", "Balance has been reset to $100,000");
  };
  const moveToPortfolio = () => {
    router.navigate("/portfolio");
  };

  return (
    <LinearGradient
      colors={["#6262D9", "#9D62D9"]}
      style={styles.balanceSection}>
      <TouchableOpacity onPress={moveToPortfolio}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            <Ionicons name="menu-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetPress}>
            <Ionicons name="refresh" size={18} color="white" />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.balanceTitle}>Your balance</Text>
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
        onRequestClose={() => setShowResetModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Balance</Text>
            <Text style={styles.modalText}>
              Are you sure you want to reset your balance to $100,000?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowResetModal(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmReset}>
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  balanceSection: {
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 30,
    borderRadius: 20,
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
