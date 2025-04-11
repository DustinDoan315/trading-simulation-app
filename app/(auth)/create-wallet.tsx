import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import SignWithFaceID from "@/components/SignupWithBiometric";
import { width } from "@/utils/response";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

const CreateNewWalletScreen = () => {
  const navigation = useNavigation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSecureEntry, setIsSecureEntry] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState("Weak");
  const [showStrength, setShowStrength] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const evaluatePasswordStrength = (password: string) => {
    if (password.length < 8) {
      return "Weak";
    }
    if (
      password.match(/[a-z]/) &&
      password.match(/[A-Z]/) &&
      password.match(/\d/) &&
      password.match(/[^a-zA-Z\d]/)
    ) {
      return "Strong";
    }
    if (password.match(/[a-zA-Z]/) && password.match(/\d/)) {
      return "Medium";
    }
    return "Weak";
  };

  const handlePasswordChange = (password: string) => {
    setPassword(password);
    setShowStrength(password.length >= 8);
    setPasswordStrength(evaluatePasswordStrength(password));
  };

  const handleCreateWallet = () => {
    router.navigate("./secure-wallet");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleGoBack} style={styles.backButton}>
          <Image
            style={styles.backButtonImage}
            source={require("../../assets/icons/arrow_back.png")}
          />
        </Pressable>
      </View>

      <View style={styles.intro}>
        <Text style={styles.introTitle}>Create Password</Text>
        <Text style={styles.introText}>
          This password will unlock your Metamask wallet only on this service
        </Text>
      </View>

      <View style={styles.passwordContainer}>
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>New Password</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="*******"
            placeholderTextColor="#6A849F"
            secureTextEntry={isSecureEntry}
            value={password}
            onChangeText={handlePasswordChange}
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => setIsSecureEntry(!isSecureEntry)}>
            {/* <Image
              style={styles.eyeIcon}
              source={require("@/assets/icons/eyeVisible.png")}
            /> */}
          </Pressable>
        </View>

        {showStrength && (
          <View style={styles.strengthContainer}>
            <Text style={styles.strengthLabel}>Password strength: </Text>
            <Text
              style={[
                styles.strengthText,
                passwordStrength === "Strong"
                  ? styles.strong
                  : passwordStrength === "Medium"
                  ? styles.medium
                  : styles.weak,
              ]}>
              {passwordStrength}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.passwordContainer}>
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Confirm Password</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="*******"
            placeholderTextColor="#6A849F"
            secureTextEntry={isSecureEntry}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => setIsSecureEntry(!isSecureEntry)}>
            {/* <Image
              style={styles.eyeIcon}
              source={require("@/assets/icons/eyeVisible.png")}
            /> */}
          </Pressable>
        </View>

        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Must be at least 8 characters</Text>
        </View>
      </View>

      <SignWithFaceID />

      <View style={styles.buttonContainer}>
        <LinearGradient
          style={styles.createBtnLinear}
          colors={["#8AD4EC", "#EF96FF", "#FF56A9", "#FFAA6C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          locations={[0, 0.22, 0.54, 0.85, 1]}>
          <Pressable onPress={handleCreateWallet} style={styles.createBtn}>
            <Text style={styles.buttonText}>Create New Wallet</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
};

export default CreateNewWalletScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080A0B",
    paddingVertical: 10,
  },
  header: {
    width: width,
    flexDirection: "row",
  },
  backButton: {
    marginLeft: 12,
  },
  backButtonImage: {
    width: 30,
    height: 30,
  },
  progressBar: {
    width: "75%",
    height: 56,
    marginTop: 12,
    marginLeft: 12,
  },
  intro: {
    marginHorizontal: 32,
    marginTop: 42,
    alignItems: "center",
  },
  introTitle: {
    color: "#5ed2e3",
    marginBottom: 12,
    fontSize: 24,
  },
  introText: {
    color: "#8ea0b6",
    textAlign: "center",
    fontSize: 16,
  },
  passwordContainer: {
    width: "100%",
    padding: 16,
  },
  inputContainer: {
    backgroundColor: "#080A0B",
    borderRadius: 16,
    padding: 1,
    borderWidth: 1,
    borderColor: "#6A849F",
    flexDirection: "row",
    alignItems: "center",
  },
  labelContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 1,
  },
  label: {
    color: "#6A849F",
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    paddingHorizontal: 12,
    marginTop: 16,
    backgroundColor: "#080A0B",
    color: "#ffffff",
    fontSize: 24,
  },
  eyeButton: {
    padding: 16,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 0,
    zIndex: 1,
  },
  eyeIcon: {
    width: 24,
    height: 24,
  },
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 12,
  },
  strengthLabel: {
    color: "#6A849F",
    fontSize: 16,
  },
  strengthText: {
    fontSize: 16,
  },
  strong: {
    color: "green",
  },
  medium: {
    color: "orange",
  },
  weak: {
    color: "red",
  },
  hintContainer: {
    margin: 12,
  },
  hintText: {
    color: "#6A849F",
    fontSize: 16,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 12,
    width: "100%",
    paddingHorizontal: 20,
  },
  createBtnLinear: {
    borderRadius: 80,
    marginVertical: 10,
  },
  createBtn: {
    padding: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
