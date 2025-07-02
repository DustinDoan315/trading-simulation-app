import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface AddButtonProps {
  onPress?: () => void;
}

const addToken = () => {
  router.navigate("/(subs)/crypto-search");
};

export const AddButton: React.FC<AddButtonProps> = ({ onPress }) => {
  return (
    <View style={styles.addButtonContainer}>
      <LinearGradient
        colors={["#6262D9",  "#A8A8FF", ]}
        start={{ x: 0.25, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.addButton}>
        <TouchableOpacity style={styles.addButton} onPress={addToken}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
        </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  addButtonContainer: {
    alignSelf: "flex-end",
    marginVertical: 24,
    marginHorizontal: 16,
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
