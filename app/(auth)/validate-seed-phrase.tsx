import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  AppState,
  FlatList,
  Pressable,
  Image,
} from "react-native";
import HeaderProgressBar from "@/components/ui/HeaderProgressBar";
import { LinearGradient } from "expo-linear-gradient";
import { generateSeedPhrase } from "@/utils/helper";
import { router } from "expo-router";

const SecureWalletValidScreen = () => {
  const [appState, setAppState] = useState("active");
  const [seedPhrases, setSeedPhrases] = useState<string[]>([]);
  const [step, setStep] = useState<number>(1);
  const [randomNum, setRandomNum] = useState<number>(1);
  const [choiceKey, setChoiceKey] = useState<string>("");

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      setAppState(nextAppState);
    };
    const appStateListener = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    handleRandomSeedPhrase();

    return () => appStateListener.remove();
  }, []);

  const renderSeedPhrase = ({
    item,
    index,
  }: {
    item: string;
    index: number;
  }) => (
    <Pressable
      onPress={() => handleChoiceKey(item)}
      style={styles.seedPhraseContainer}>
      <Text style={styles.seedPhraseText}>{`${index + 1}. ${item}`}</Text>
    </Pressable>
  );

  const handleRandomSeedPhrase = async () => {
    const phrase = await generateSeedPhrase();
    if (phrase) {
      const shuffledPhrases = phrase.split(" ").sort(() => Math.random() - 0.5);
      setSeedPhrases(shuffledPhrases.slice(0, 6));
    }
  };

  const handleChoiceKey = (text: string) => {
    setChoiceKey(text);
  };

  const handleNextPress = () => {
    if (step >= 1 && step < 3) setStep(step + 1);
    else {
      router.navigate("/validate-success");
    }
    setChoiceKey("");
    handleRandomSeedPhrase();
    setRandomNum(Math.floor(Math.random() * 12) + 1);
  };

  return (
    <View style={styles.flexContainer}>
      {appState !== "active" ? (
        <View style={styles.inactiveAppState} />
      ) : (
        <View style={styles.container}>
          <HeaderProgressBar
            icon={require("../../assets/icons/progressBarFull.png")}
          />
          <View style={styles.textContent}>
            <Text style={styles.title}>Confirm Seed Phrase</Text>
            <Text style={styles.description}>
              Select each word in the order it was presented to you
            </Text>
          </View>
          <View
            style={{
              paddingVertical: 50,
            }}>
            <Text style={styles.title}>{`${randomNum}. ${choiceKey}`}</Text>
          </View>

          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
            }}>
            <Image
              style={{
                width: "40%",
              }}
              resizeMode="stretch"
              source={
                step == 1
                  ? require("../../assets/icons/progress_1.png")
                  : step == 2
                  ? require("../../assets/icons/progress_2.png")
                  : require("../../assets/icons/progress_3.png")
              }
            />
          </View>

          <FlatList
            data={seedPhrases}
            renderItem={renderSeedPhrase}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            contentContainerStyle={styles.seedPhraseList}
          />
        </View>
      )}

      <View style={styles.buttonContainer}>
        <LinearGradient
          style={styles.createBtnLinear}
          colors={
            choiceKey
              ? ["#8AD4EC", "#EF96FF", "#FF56A9", "#FFAA6C"]
              : ["#d3d3d3", "#d3d3d3"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}>
          <Pressable
            disabled={!choiceKey}
            onPress={handleNextPress}
            style={styles.createBtn}>
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
};

export default SecureWalletValidScreen;

const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
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
  },
  description: {
    fontSize: 16,
    color: "#8ea0b6",
    width: "80%",
    textAlign: "center",
    marginBottom: 20,
  },
  seedPhraseList: {
    alignItems: "center",
  },
  seedPhraseContainer: {
    backgroundColor: "#202832",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    margin: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  seedPhraseText: {
    color: "#ffffff",
    fontSize: 16,
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
});
