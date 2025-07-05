import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import { Colors } from "../../constants/Colors";
import { logger } from "../../utils/logger";
import { useRouter } from "expo-router";

import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SecurityOptionsScreen() {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    try {
      // Save security preferences to secure storage
      const securityPrefs = {
        biometricEnabled,
        pinEnabled,
        timestamp: new Date().toISOString(),
      };

      await SecureStore.setItemAsync(
        "security_preferences",
        JSON.stringify(securityPrefs)
      );

      logger.info(
        "Security preferences saved",
        "SecurityOptions",
        securityPrefs
      );

      // Navigate to next screen
      router.push("/onboarding");
    } catch (error) {
      logger.error("Failed to save security preferences", "SecurityOptions", {
        error,
      });
      Alert.alert(
        "Error",
        "Failed to save security preferences. Please try again.",
        [{ text: "OK" }]
      );
    }
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
              false: Colors.light.icon,
              true: Colors.light.primary,
            }}
            thumbColor={Colors.light.background}
            onValueChange={setBiometricEnabled}
            value={biometricEnabled}
          />
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionText}>Set PIN Code</Text>
          <Switch
            trackColor={{
              false: Colors.light.icon,
              true: Colors.light.primary,
            }}
            thumbColor={Colors.light.background}
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
  securityOptionContainer: {
    backgroundColor: Colors.light.background,
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
    color: Colors.light.text,
  },
  actionButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  actionButtonText: {
    color: Colors.light.background,
    fontSize: 18,
    fontWeight: "bold",
  },
});
