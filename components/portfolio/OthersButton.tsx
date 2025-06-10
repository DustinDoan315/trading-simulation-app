import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Asset } from "@/app/types/crypto";
import { styles } from "./styles";

interface OthersButtonProps {
  asset: Asset;
  onPress: (asset: Asset) => void;
}

export const OthersButton = memo<OthersButtonProps>(({ asset, onPress }) => {
  const handlePress = () => onPress(asset);

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Text style={styles.name}>{asset.name}</Text>
      <Text style={styles.amount}>{asset.amount} assets</Text>
    </TouchableOpacity>
  );
});
