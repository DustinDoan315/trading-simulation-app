import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  Alert,
  AppState,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { generateSeedPhrase } from "@/utils/helper";
import HeaderProgressBar from "@/components/ui/HeaderProgressBar";
import { width } from "@/utils/response";
import { router } from "expo-router";

const SecureWalletScreen = () => {
  const [appState, setAppState] = useState<string>("active");
  const [seedPhases, setSeedPhases] = useState<string[]>([]);

  useEffect(() => {
    const appStateListener = AppState.addEventListener(
      "change",
      (nextAppState) => {
        setAppState(nextAppState);
      }
    );

    return () => {
      appStateListener.remove();
    };
  }, []);

  const handleSeedPhrasePress = async () => {
    Alert.alert("Seed Phrase", "This is your Seed Phrase. Keep it safe!");
    const seedPhrase = await generateSeedPhrase();

    if (seedPhrase) {
      console.log("Your seed phrase:", seedPhrase.split(" "));
      setSeedPhases(seedPhrase.split(" "));
    }
  };

  const handleStartPress = () => {
    router.navigate("/wallet-info");
  };

  const _renderSeedPhrases = ({ item, index }: any) => {
    return (
      <View style={styles.seedPhraseContainer} key={index}>
        <Text style={styles.seedPhraseText}>{`${index}. ${item}`}</Text>
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
      }}>
      {appState !== "active" ? (
        <View
          style={{
            flex: 1,
            backgroundColor: "pink",
          }}
        />
      ) : (
        <View style={styles.container}>
          {/* Header Section */}
          <HeaderProgressBar
            icon={require("../../assets/icons/progressBar.png")}
          />

          {/* Content Section */}
          <View style={styles.content}>
            <Image
              source={require("../../assets/images/shield.png")}
              style={styles.shieldImage}
              resizeMode="contain"
            />
            <View style={styles.textContent}>
              <Text style={styles.title}>Secure Your Wallet</Text>
              <Text style={styles.description}>
                Don't risk losing your funds. Protect your wallet by saving your
                <Text style={styles.highlight} onPress={handleSeedPhrasePress}>
                  {" Seed phrase "}
                </Text>
                in a place you trust.
              </Text>
              <Text style={styles.description}>
                It's the only way to recover your wallet if you get locked out
                of the app or get a new device.
              </Text>
            </View>
          </View>

          <FlatList
            data={seedPhases}
            renderItem={_renderSeedPhrases}
            keyExtractor={(item, index) => index.toString()}
            style={{ marginTop: 20, paddingHorizontal: 20 }}
          />

          {/* Button Section */}
          <View style={styles.buttonContainer}>
            <Pressable style={styles.remindMeButton}>
              <Text style={styles.remindMeText}>Remind Me Later</Text>
            </Pressable>
            <LinearGradient
              style={styles.createBtnLinear}
              colors={["#8AD4EC", "#EF96FF", "#FF56A9", "#FFAA6C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              locations={[0, 0.22, 0.54, 0.85, 1]}>
              <Pressable onPress={handleStartPress} style={styles.createBtn}>
                <Text style={styles.buttonText}>Start</Text>
              </Pressable>
            </LinearGradient>
          </View>
        </View>
      )}
    </View>
  );
};

export default SecureWalletScreen;

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
    marginTop: 12,
    marginLeft: 12,
  },
  backButtonImage: {
    width: 30,
    height: 30,
  },
  content: {
    width: "100%",
    alignItems: "center",
    marginTop: 35,
  },
  shieldImage: {
    width: "80%",
    height: 295,
  },
  textContent: {
    marginTop: 20,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    color: "#ffffff",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#8ea0b6",
    textAlign: "center",
    marginBottom: 5,
  },
  highlight: {
    color: "#4A90E2",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 12,
    width: "100%",
    paddingHorizontal: 20,
  },
  remindMeButton: {
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  remindMeText: {
    color: "#4A90E2",
    fontSize: 18,
    fontWeight: "bold",
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
  seedPhraseContainer: {
    backgroundColor: "#202832",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  seedPhraseText: {
    color: "#ffffff",
  },
});
