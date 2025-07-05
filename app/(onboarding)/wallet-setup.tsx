import React, { useState } from "react";
import UUIDService from "../../services/UUIDService";
import { Colors } from "../../constants/Colors";
import { logger } from "../../utils/logger";
import { useRouter } from "expo-router";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function WalletSetupScreen() {
  const [walletName, setWalletName] = useState("");
  const router = useRouter();

  const handleCreateWallet = async () => {
    if (walletName.trim()) {
      try {
        // Create user
        const userId = await UUIDService.getOrCreateUser();

        logger.info("Wallet created successfully", "WalletSetup", {
          walletName: walletName.trim(),
          userId: userId,
        });

        router.push("/security-options");
      } catch (error) {
        logger.error("Failed to create wallet", "WalletSetup", { error });
        Alert.alert("Error", "Failed to create wallet. Please try again.", [
          { text: "OK" },
        ]);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Create Your Wallet</Text>
      <Text style={styles.subtitleText}>
        Choose a name for your new cryptocurrency wallet
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Wallet Name (e.g., Personal Crypto)"
        value={walletName}
        onChangeText={setWalletName}
        placeholderTextColor={Colors.light.icon}
      />

      <TouchableOpacity
        style={[
          styles.actionButton,
          !walletName.trim() && styles.disabledButton,
        ]}
        onPress={handleCreateWallet}
        disabled={!walletName.trim()}>
        <Text style={styles.actionButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 20,
    justifyContent: "center",
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.icon,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: Colors.light.icon,
  },
  actionButtonText: {
    color: Colors.light.background,
    fontSize: 18,
    fontWeight: "bold",
  },
});
