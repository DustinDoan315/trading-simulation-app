import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import Typography from "@/styles/typography";

const ORDER_TYPES = [
  { id: "market", label: "Lệnh thị trường" },
  { id: "limit", label: "Lệnh giới hạn" },
  { id: "stop", label: "Lệnh dừng" },
];

const OrderTypeSelector = ({
  selectedOrderType,
  onOrderTypeChange,
  onShowOrderTypeInfo,
}: any) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showDropdown) {
      Animated.timing(dropdownAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [showDropdown, dropdownAnimation]);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleSelectOrderType = (orderType: string) => {
    onOrderTypeChange(orderType);
    setShowDropdown(false);
  };

  // Get the label for the currently selected order type
  const getSelectedOrderTypeLabel = () => {
    const selected = ORDER_TYPES.find((type) => type.id === selectedOrderType);
    return selected ? selected.label : "Lệnh thị trường";
  };

  // Animation styles
  const dropdownStyle = {
    opacity: dropdownAnimation,
    transform: [
      {
        translateY: dropdownAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={toggleDropdown}
        activeOpacity={0.7}>
        <Text style={styles.selectorText}>{getSelectedOrderTypeLabel()}</Text>
        <View style={styles.iconContainer}>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={onShowOrderTypeInfo}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons
              name="info-outline"
              size={16}
              color={Colors.text.tertiary}
            />
          </TouchableOpacity>
          <Ionicons
            name={showDropdown ? "chevron-up" : "chevron-down"}
            size={16}
            color={Colors.text.tertiary}
          />
        </View>
      </TouchableOpacity>

      {showDropdown && (
        <Modal
          transparent
          visible={showDropdown}
          animationType="none"
          onRequestClose={() => setShowDropdown(false)}>
          <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View style={[styles.dropdown, dropdownStyle]}>
                  {ORDER_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.dropdownItem,
                        selectedOrderType === type.id &&
                          styles.dropdownItemSelected,
                      ]}
                      onPress={() => handleSelectOrderType(type.id)}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedOrderType === type.id &&
                            styles.dropdownItemTextSelected,
                        ]}>
                        {type.label}
                      </Text>
                      {selectedOrderType === type.id && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={Colors.action.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Dimensions.spacing.md,
    zIndex: 1, // Ensure dropdown appears above other elements
  },
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.background.tertiary,
    borderRadius: Dimensions.radius.md,
    borderWidth: Dimensions.border.thin,
    borderColor: Colors.border.light,
    paddingHorizontal: Dimensions.spacing.md,
    paddingVertical: Dimensions.spacing.md,
    height: Dimensions.components.inputHeight,
  },
  selectorText: {
    ...Typography.body,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoButton: {
    marginRight: Dimensions.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 100, // Position where the dropdown appears
  },
  dropdown: {
    width: "90%",
    backgroundColor: Colors.background.secondary,
    borderRadius: Dimensions.radius.md,
    borderWidth: Dimensions.border.thin,
    borderColor: Colors.border.medium,
    overflow: "hidden",
    // Shadow for iOS
    shadowColor: Colors.background.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    // Shadow for Android
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Dimensions.spacing.md,
    paddingHorizontal: Dimensions.spacing.lg,
    borderBottomWidth: Dimensions.border.thin,
    borderBottomColor: Colors.border.medium,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.background.tertiary,
  },
  dropdownItemText: {
    ...Typography.body,
  },
  dropdownItemTextSelected: {
    color: Colors.action.primary,
    fontWeight: "600",
  },
});

export default OrderTypeSelector;
