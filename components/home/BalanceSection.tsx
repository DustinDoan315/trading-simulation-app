import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { UserBalance } from "@/services/CryptoService";

// components/home/BalanceSection.tsx

interface BalanceSectionProps {
  balance: UserBalance;
  isBalanceHidden: boolean;
  onMenuPress?: () => void;
}

export const BalanceSection: React.FC<BalanceSectionProps> = ({
  balance,
  isBalanceHidden,
  onMenuPress,
}) => {
  const moveToPortfolio = () => {
    router.navigate("/portfolio");
  };

  return (
    <LinearGradient
      colors={["#6262D9", "#9D62D9"]}
      style={styles.balanceSection}>
      <TouchableOpacity onPress={moveToPortfolio}>
        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.balanceTitle}>Your balance</Text>
        <Text style={styles.balanceAmount}>
          {isBalanceHidden ? "********" : `$${balance.totalInUSD.toFixed(2)}`}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
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
