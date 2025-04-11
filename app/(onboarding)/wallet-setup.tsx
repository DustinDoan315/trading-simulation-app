import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";

export default function WalletSetupScreen() {
  const [walletName, setWalletName] = useState("");
  const router = useRouter();

  const handleCreateWallet = () => {
    if (walletName.trim()) {
      // TODO: Implement wallet creation logic
      router.push("/security-options");
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
        placeholderTextColor={Colors.secondText}
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
    color: Colors.primaryText,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: Colors.secondText,
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: Colors.highlight,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: Colors.primaryBorder,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});
