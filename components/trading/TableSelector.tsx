import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import React from "react";
import Typography from "@/styles/typography";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { getColors } from "@/styles/colors";

const TabSelector = ({
  selectedTab,
  onSelectTab,
  marginEnabled = false,
  onToggleMargin,
}: any) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const colors = getColors(theme);

  const getBuyColors = () => {
    if (selectedTab === "buy") {
      return [colors.action.buy, colors.action.buy];
    }
    return theme === 'dark'
      ? ["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.03)"]
      : [colors.background.cardSecondary, colors.background.cardSecondary];
  };

  const getSellColors = () => {
    if (selectedTab === "sell") {
      return [colors.action.sell, colors.action.sell];
    }
    return theme === 'dark'
      ? ["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.03)"]
      : [colors.background.cardSecondary, colors.background.cardSecondary];
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabButtonsContainer}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onSelectTab("buy")}
          activeOpacity={0.8}>
          {theme === 'dark' ? (
            <LinearGradient
              colors={getBuyColors()}
              style={[
                styles.tabGradient,
                { borderColor: selectedTab === "buy" ? colors.action.buy : colors.border.card },
                selectedTab === "buy" && styles.buyTabActive,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === "buy" ? colors.text.primary : colors.text.secondary },
                  selectedTab === "buy" ? styles.buyTabTextActive : null,
                ]}>
                {t("trading.buy")}
              </Text>
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.tabGradient,
                {
                  backgroundColor: selectedTab === "buy" ? colors.action.buy : colors.background.cardSecondary,
                  borderColor: selectedTab === "buy" ? colors.action.buy : colors.border.card,
                },
                selectedTab === "buy" && styles.buyTabActive,
              ]}>
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === "buy" ? colors.text.primary : colors.text.secondary },
                  selectedTab === "buy" ? styles.buyTabTextActive : null,
                ]}>
                {t("trading.buy")}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onSelectTab("sell")}
          activeOpacity={0.8}>
          {theme === 'dark' ? (
            <LinearGradient
              colors={getSellColors()}
              style={[
                styles.tabGradient,
                { borderColor: selectedTab === "sell" ? colors.action.sell : colors.border.card },
                selectedTab === "sell" && styles.sellTabActive,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === "sell" ? colors.text.primary : colors.text.secondary },
                  selectedTab === "sell" ? styles.sellTabTextActive : null,
                ]}>
                {t("trading.sell")}
              </Text>
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.tabGradient,
                {
                  backgroundColor: selectedTab === "sell" ? colors.action.sell : colors.background.cardSecondary,
                  borderColor: selectedTab === "sell" ? colors.action.sell : colors.border.card,
                },
                selectedTab === "sell" && styles.sellTabActive,
              ]}>
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === "sell" ? colors.text.primary : colors.text.secondary },
                  selectedTab === "sell" ? styles.sellTabTextActive : null,
                ]}>
                {t("trading.sell")}
              </Text>
            </View>
          )}
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
    alignItems: "center",
    justifyContent: "center",
  },
  buyTabActive: {
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sellTabActive: {
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabText: {
    fontSize: Dimensions.fontSize.md,
    fontWeight: "600",
  },
  buyTabTextActive: {
    fontWeight: "bold",
  },
  sellTabTextActive: {
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
