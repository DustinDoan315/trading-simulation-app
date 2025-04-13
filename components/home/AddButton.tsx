import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';


interface AddButtonProps {
  onPress?: () => void;
}

export const AddButton: React.FC<AddButtonProps> = ({ onPress }) => {
  return (
    <View style={styles.addButtonContainer}>
      <TouchableOpacity style={styles.addButton} onPress={onPress}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  addButtonContainer: {
    alignSelf: "center",
    marginVertical: 24,
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
});
