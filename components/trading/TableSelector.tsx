import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import React from "react";
import Typography from "@/styles/typography";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "@/context/LanguageContext";

const TabSelector = ({
  selectedTab,
  onSelectTab,
  marginEnabled = false,
  onToggleMargin,
}: any) => {
  const { t } = useLanguage();
  return (
    <View style={styles.container}>
      <View style={styles.tabButtonsContainer}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onSelectTab("buy")}
          activeOpacity={0.8}>
          <LinearGradient
            colors={
              selectedTab === "buy"
                ? ["#10B981", "#059669"]
                : ["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.03)"]
            }
            style={[
              styles.tabGradient,
              selectedTab === "buy" && styles.buyTabActive,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Text
              style={[
                styles.tabText,
                selectedTab === "buy" ? styles.buyTabTextActive : null,
              ]}>
              {t("trading.buy")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onSelectTab("sell")}
          activeOpacity={0.8}>
          <LinearGradient
            colors={
              selectedTab === "sell"
                ? ["#EF4444", "#DC2626"]
                : ["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.03)"]
            }
            style={[
              styles.tabGradient,
              selectedTab === "sell" && styles.sellTabActive,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Text
              style={[
                styles.tabText,
                selectedTab === "sell" ? styles.sellTabTextActive : null,
              ]}>
              {t("trading.sell")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Dimensions.spacing.md,
  },
  tabButtonsContainer: {
    flexDirection: "row",
    flex: 1,
    gap: Dimensions.spacing.sm,
  },
  tabButton: {
    flex: 1,
    borderRadius: Dimensions.radius.md,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabGradient: {
    paddingVertical: Dimensions.spacing.md,
    paddingHorizontal: Dimensions.spacing.xl,
    borderRadius: Dimensions.radius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  buyTabActive: {
    borderColor: "#10B981",
    shadowColor: "#10B981",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sellTabActive: {
    borderColor: "#EF4444",
    shadowColor: "#EF4444",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabText: {
    fontSize: Dimensions.fontSize.md,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
  },
  buyTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  sellTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  marginContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  marginText: {
    ...Typography.label,
    marginRight: Dimensions.spacing.sm,
  },
});

export default TabSelector;
