import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

const ImportWalletScreen = () => {
  const createNewWallet = () => {
    router.navigate("/create-wallet");
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/wallet.png")}
        style={styles.image}
      />
      <Text style={styles.title}>Wallet Setup</Text>
      <View style={styles.buttonContainer}>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Import Using Seed Phrase</Text>
        </Pressable>
        <LinearGradient
          style={styles.createBtnLinear}
          colors={["#8AD4EC", "#EF96FF", "#FF56A9", "#FFAA6C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          locations={[0, 0.22, 0.54, 0.85, 1]}>
          <Pressable onPress={createNewWallet} style={styles.createBtn}>
            <Text style={styles.buttonText}>Create New Wallet</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  image: {
    width: "80%",
    height: 295,
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontFamily: "Montserrat-Semibold",
    marginTop: 50,
    color: "#ffffff",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 12,
    width: "100%",
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#202832",
    padding: 15,
    borderRadius: 80,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
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
});

export default ImportWalletScreen;
