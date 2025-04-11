import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  AppState,
  FlatList,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { generateSeedPhrase } from "@/utils/helper";
import HeaderProgressBar from "@/components/ui/HeaderProgressBar";
import { BlurView } from "expo-blur";
import { router } from "expo-router";

const SecureWalletGenSeedPhraseScreen = () => {
  const navigation = useNavigation();
  const [appState, setAppState] = useState("active");
  const [seedPhases, setSeedPhases] = useState<string[]>([]);
  const [isBlurred, setIsBlurred] = useState(true);

  useEffect(() => {
    const appStateListener = AppState.addEventListener("change", setAppState);
    generateSeedPhrase().then((seed) => {
      if (seed) setSeedPhases(seed.split(" "));
    });
    return () => appStateListener.remove();
  }, []);

  const handleNextPress = () => {
    router.navigate("/validate-seed-phrase");
  };
  const toggleBlur = () => setIsBlurred((prev) => !prev);

  const _renderSeedPhrases = useCallback(
    (item: any, index: number) => (
      <View style={styles.seedPhraseContainer}>
        <Text style={styles.seedPhraseText}>{`${index + 1}. ${item}`}</Text>
      </View>
    ),
    []
  );

  const splitSeedPhrases = useMemo(
    () => ({
      left: seedPhases.slice(0, 6),
      right: seedPhases.slice(6, 12),
    }),
    [seedPhases]
  );

  return (
    <View style={styles.flexContainer}>
      {appState !== "active" ? (
        <View style={styles.inactiveAppState} />
      ) : (
        <View style={styles.container}>
          <HeaderProgressBar
            icon={require("../../assets/icons/progressSecond.png")}
          />

          <View style={styles.textContent}>
            <Text style={styles.title}>Write Down Your Seed Phrase</Text>
            <Text style={styles.description}>
              This is your seed phrase. Write it down on a paper and keep it
              safe. You’ll need to re-enter it in the next step.
            </Text>
          </View>

          <View style={styles.seedPhraseColumns}>
            {(["left", "right"] as const).map((side, columnIndex) => (
              <FlatList
                key={side}
                data={splitSeedPhrases[side]}
                renderItem={({ item, index }) =>
                  _renderSeedPhrases(item, index + columnIndex * 6)
                }
                keyExtractor={(item, index) =>
                  (index + columnIndex * 6).toString()
                }
                scrollEnabled={false}
              />
            ))}
          </View>

          {isBlurred && (
            <Pressable onPress={toggleBlur} style={styles.blurOverlay}>
              <BlurView intensity={20} style={styles.blurView} />
              <View style={styles.blurContent}>
                <Image
                  source={require("../../assets/icons/eyeVisible.png")}
                  style={styles.blurIcon}
                />
                <Text style={styles.blurText}>Tap to reveal</Text>
              </View>
            </Pressable>
          )}

          <View style={styles.buttonContainer}>
            <LinearGradient
              style={styles.createBtnLinear}
              colors={["#8AD4EC", "#EF96FF", "#FF56A9", "#FFAA6C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <Pressable onPress={handleNextPress} style={styles.createBtn}>
                <Text style={styles.buttonText}>Next</Text>
              </Pressable>
            </LinearGradient>
          </View>
        </View>
      )}
    </View>
  );
};

export default SecureWalletGenSeedPhraseScreen;

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  inactiveAppState: {
    flex: 1,
    backgroundColor: "pink",
  },
  container: {
    flex: 1,
    backgroundColor: "#080A0B",
    paddingVertical: 10,
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
    textAlign: "center",
    fontWeight: "bold",
  },
  description: {
    fontSize: 16,
    color: "#8ea0b6",
    textAlign: "center",
    marginBottom: 20,
  },
  seedPhraseColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  seedPhraseContainer: {
    width: "97.5%",
    backgroundColor: "#202832",
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  seedPhraseText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
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
  },
  remindMeText: {
    color: "#4A90E2",
    fontSize: 18,
    fontWeight: "bold",
  },
  createBtnLinear: {
    borderRadius: 50,
    overflow: "hidden",
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
  blurOverlay: {
    position: "absolute",
    top: 160,
    left: 0,
    right: 0,
    bottom: 200,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  blurView: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  blurContent: {
    alignItems: "center",
    zIndex: 3,
  },
  blurIcon: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  blurText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
