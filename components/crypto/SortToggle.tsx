import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type SortDirection = "none" | "asc" | "desc";

interface SortToggleProps {
  label: string;
  onToggle: (direction: SortDirection) => void;
  initialDirection?: SortDirection;
}

const SortToggle: React.FC<SortToggleProps> = ({
  label,
  onToggle,
  initialDirection = "none",
}) => {
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(initialDirection);

  const handleToggle = () => {
    let newDirection: SortDirection;

    if (sortDirection === "none") {
      newDirection = "asc";
    } else if (sortDirection === "asc") {
      newDirection = "desc";
    } else {
      newDirection = "none";
    }

    setSortDirection(newDirection);
    onToggle(newDirection);
  };

  const renderIcon = () => {
    if (sortDirection === "none") {
      return null;
    }

    return (
      <Ionicons
        name={sortDirection === "asc" ? "chevron-up" : "chevron-down"}
        size={16}
        color="#8E8E93"
      />
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleToggle}>
      <Text style={styles.label}>{label}</Text>
      {sortDirection !== "none" && (
        <View style={styles.iconContainer}>{renderIcon()}</View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  label: {
    color: "#8E8E93",
    fontSize: 14,
    marginRight: 4,
  },
  iconContainer: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SortToggle;
