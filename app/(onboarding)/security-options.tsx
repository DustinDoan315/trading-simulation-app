import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";

export default function SecurityOptionsScreen() {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const router = useRouter();

  const handleContinue = () => {
    // TODO: Save security preferences
    // router.push("/onboarding/backup-phrase");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Secure Your Wallet</Text>
      <Text style={styles.subtitleText}>
        Choose additional security measures to protect your assets
      </Text>

      <View style={styles.securityOptionContainer}>
        <View style={styles.optionRow}>
          <Text style={styles.optionText}>Enable Biometric Authentication</Text>
          <Switch
            trackColor={{
              false: Colors.primaryBorder,
              true: Colors.highlight,
            }}
            thumbColor={Colors.white}
            onValueChange={setBiometricEnabled}
            value={biometricEnabled}
          />
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionText}>Set PIN Code</Text>
          <Switch
            trackColor={{
              false: Colors.primaryBorder,
              true: Colors.highlight,
            }}
            thumbColor={Colors.white}
            onValueChange={setPinEnabled}
            value={pinEnabled}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={handleContinue}>
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
  securityOptionContainer: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  optionText: {
    fontSize: 16,
    color: Colors.primaryText,
  },
  actionButton: {
    backgroundColor: Colors.highlight,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});
