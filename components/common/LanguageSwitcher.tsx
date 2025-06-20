import React from "react";
import { Pressable, Text, View } from "react-native";
import { useLanguage } from "@/context/LanguageContext";

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "vi" : "en");
  };

  return (
    <Pressable
      style={{
        padding: 10,
        backgroundColor: "#f0f0f0",
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
      }}
      onPress={toggleLanguage}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ marginRight: 8 }}>
          {language === "en" ? "English" : "Tiếng Việt"}
        </Text>
        <Text>{language === "en" ? "🇺🇸" : "🇻🇳"}</Text>
      </View>
    </Pressable>
  );
};
