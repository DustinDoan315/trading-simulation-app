import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch } from "react-native";
import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import Typography from "@/styles/typography";

const TabSelector = ({
  selectedTab,
  onSelectTab,
  marginEnabled = false,
  onToggleMargin,
}: any) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "buy" ? styles.buyTabActive : null,
          ]}
          onPress={() => onSelectTab("buy")}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.tabText,
              selectedTab === "buy" ? styles.buyTabTextActive : null,
            ]}>
            Mua
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "sell" ? styles.sellTabActive : null,
          ]}
          onPress={() => onSelectTab("sell")}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.tabText,
              selectedTab === "sell" ? styles.sellTabTextActive : null,
            ]}>
            Bán
          </Text>
        </TouchableOpacity>
      </View>

      {/* <View style={styles.marginContainer}>
        <Text style={styles.marginText}>Ký quỹ</Text>
        <Switch
          value={marginEnabled}
          onValueChange={onToggleMargin}
          trackColor={{
            false: Colors.ui.toggleBackground,
            true: Colors.action.primary,
          }}
          thumbColor={marginEnabled ? Colors.text.primary : Colors.ui.toggle}
          ios_backgroundColor={Colors.ui.toggleBackground}
        />
      </View> */}
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
  },
  tabButton: {
    paddingVertical: Dimensions.spacing.md,
    paddingHorizontal: Dimensions.spacing.xl,
    borderRadius: Dimensions.radius.sm,
    marginRight: Dimensions.spacing.md,
  },
  buyTabActive: {
    backgroundColor: Colors.action.buyLight,
    borderWidth: Dimensions.border.thin,
    borderColor: Colors.action.buyBorder,
  },
  sellTabActive: {
    backgroundColor: Colors.action.sellLight,
    borderWidth: Dimensions.border.thin,
    borderColor: Colors.action.sellBorder,
  },
  tabText: {
    ...Typography.tabInactive,
  },
  buyTabTextActive: {
    color: Colors.action.buy,
    fontWeight: "bold",
  },
  sellTabTextActive: {
    color: Colors.action.sell,
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
