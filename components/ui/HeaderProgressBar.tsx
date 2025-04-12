import { Image, Pressable, StyleSheet, View } from "react-native";
import React from "react";
import { router } from "expo-router";
import { width } from "@/utils/response";

type HeaderProgressBarComponent = {
  handleGoHome?: () => void;
  icon?: string;
};

const HeaderProgressBar: React.FC<HeaderProgressBarComponent> = ({ icon }) => {
  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.header}>
      <Pressable onPress={handleGoBack} style={styles.backButton}>
        <Image
          style={styles.backButtonImage}
          source={require("../../assets/icons/arrow_back.png")}
        />
      </Pressable>

      <View
        style={{
          position: "absolute",
          alignItems: "center",
          width: width * 1.09,
        }}>
        <Image
          resizeMode="stretch"
          source={icon ? icon : require("../../assets/icons/arrow_back.png")}
        />
      </View>
    </View>
  );
};

export default HeaderProgressBar;

const styles = StyleSheet.create({
  header: {
    width: width,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  backButton: {
    zIndex: 1,
  },
  backButtonImage: {
    width: 30,
    height: 30,
  },
});
