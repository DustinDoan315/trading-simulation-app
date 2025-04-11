import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";

const TradingSessionBox = ({
  currentPairSelected = true,
  onToggleCurrentPair,
  onClearAll,
}: any) => {
  return (
    <View style={styles.container}>
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            currentPairSelected && styles.checkboxSelected,
          ]}
          onPress={onToggleCurrentPair}
          activeOpacity={0.7}>
          {currentPairSelected && (
            <Ionicons name="checkmark" size={16} color={Colors.text.primary} />
          )}
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}>Cặp giao dịch hiện tại</Text>
      </View>

      <TouchableOpacity
        onPress={onClearAll}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.clearAllButton}>Huỷ tất cả</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Dimensions.spacing.md,
    paddingHorizontal: Dimensions.spacing.lg,
    borderTopWidth: Dimensions.border.thin,
    borderTopColor: Colors.border.dark,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Dimensions.radius.xs,
    borderWidth: Dimensions.border.thin,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Dimensions.spacing.sm,
  },
  checkboxSelected: {
    backgroundColor: Colors.action.primary,
    borderColor: Colors.action.primary,
  },
  checkboxLabel: {
    color: Colors.text.primary,
    fontSize: Dimensions.fontSize.md,
  },
  clearAllButton: {
    color: Colors.text.tertiary,
    fontSize: Dimensions.fontSize.md,
  },
});

export default TradingSessionBox;
