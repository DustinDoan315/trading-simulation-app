import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  AppState,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import HeaderProgressBar from "@/components/ui/HeaderProgressBar";
import { router } from "expo-router";

const WalletSecuritySuccess = () => {
  const [currentAppState, setCurrentAppState] = useState("active");

  useEffect(() => {
    const appStateListener = AppState.addEventListener(
      "change",
      setCurrentAppState
    );
    return () => appStateListener.remove();
  }, []);

  const handleNextPress = useCallback(() => {
    router.replace("/(tabs)");
  }, []);

  if (currentAppState !== "active") {
    return <View style={styles.inactiveStateContainer} />;
  }

  return (
    <View style={styles.mainContainer}>
      <HeaderProgressBar
        icon={require("../../assets/icons/progressBarFull.png")}
      />

      <View style={styles.contentWrapper}>
        <Image
          source={require("../../assets/images/success.png")}
          style={styles.successIcon}
          resizeMode="contain"
        />
        <View style={styles.textContainer}>
          <Text style={styles.heading}>Success</Text>
          <Text style={styles.infoText}>
            You've successfully protected your wallet. Remember to keep your
            seed phrase safe, it's your responsibility!
          </Text>
          <Text style={styles.infoText}>
            DefiSquid cannot recover your wallet should you lose it. You can
            find your seed phrase in Settings - Security & Privacy.
          </Text>
        </View>
      </View>

      <View style={styles.buttonWrapper}>
        <LinearGradient
          style={styles.gradientButton}
          colors={["#8AD4EC", "#EF96FF", "#FF56A9", "#FFAA6C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}>
          <Pressable onPress={handleNextPress} style={styles.nextButton}>
            <Text style={styles.buttonLabel}>Next</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
};

export default WalletSecuritySuccess;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#080A0B",
    paddingVertical: 10,
  },
  inactiveStateContainer: {
    flex: 1,
    backgroundColor: "pink",
  },
  contentWrapper: {
    alignItems: "center",
    marginTop: 50,
  },
  successIcon: {
    width: "75%",
    height: 200,
  },
  textContainer: {
    marginTop: 30,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 24,
    color: "#ffffff",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: "#8ea0b6",
    textAlign: "center",
    marginBottom: 5,
  },
  buttonWrapper: {
    position: "absolute",
    bottom: 12,
    width: "100%",
    paddingHorizontal: 20,
  },
  reminderButton: {
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  reminderText: {
    color: "#4A90E2",
    fontSize: 18,
    fontWeight: "bold",
  },
  gradientButton: {
    borderRadius: 80,
    marginVertical: 10,
  },
  nextButton: {
    padding: 15,
    alignItems: "center",
  },
  buttonLabel: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
