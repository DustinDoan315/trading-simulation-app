import { Ionicons } from "@expo/vector-icons";
import { logger } from "@/utils/logger";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { getColors } from "@/styles/colors";
import {
  Alert,
  Animated,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface LanguageOption {
  code: "en" | "vi";
  name: string;
  nativeName: string;
  flag: string;
  description: string;
}

const languages: LanguageOption[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    description: "International English",
  },
  {
    code: "vi",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    flag: "🇻🇳",
    description: "Vietnamese language",
  },
];

const LanguageScreen = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, isDark } = useTheme();
  const colors = getColors(theme);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isChanging, setIsChanging] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  const handleLanguageSelect = async (langCode: "en" | "vi") => {
    if (langCode === selectedLanguage) return;

    setIsChanging(true);

    try {
      const selectedScale = new Animated.Value(1);
      Animated.sequence([
        Animated.timing(selectedScale, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(selectedScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      setLanguage(langCode);
      setSelectedLanguage(langCode);

      logger.info(`Language changed to ${langCode}`, "LanguageScreen");

      Alert.alert(
        t("success.title") || "Success",
        t("language.languageChanged") || "Language changed successfully!",
        [
          {
            text: t("language.ok") || "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      logger.error("Error changing language,LanguageScreen", error);
      Alert.alert(
        t("error.title") || "Error",
        t("language.languageChangeFailed") ||
          "Failed to change language. Please try again."
      );
    } finally {
      setIsChanging(false);
    }
  };

  const LanguageCard = ({
    lang,
    isSelected,
  }: {
    lang: LanguageOption;
    isSelected: boolean;
  }) => {
    const [cardScale] = useState(new Animated.Value(1));
    const [borderOpacity] = useState(new Animated.Value(1));

    useEffect(() => {
      Animated.parallel([
        Animated.timing(cardScale, {
          toValue: isSelected ? 1.05 : 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(borderOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, [isSelected, cardScale, borderOpacity]);

    return (
      <Animated.View
        style={[
          styles.languageCard,
          {
            transform: [{ scale: cardScale }],
            backgroundColor: colors.background.card,
            borderColor: isSelected ? colors.action.accent : colors.border.card,
          },
        ]}>
        <TouchableOpacity
          style={styles.languageCardContent}
          onPress={() => handleLanguageSelect(lang.code)}
          disabled={isChanging}>
          <View style={styles.languageHeader}>
            <Text style={styles.languageFlag}>{lang.flag}</Text>
            <View style={styles.languageInfo}>
              <Text style={[styles.languageName, { color: colors.text.primary }]}>{lang.name}</Text>
              <Text style={[styles.languageNativeName, { color: colors.text.secondary }]}>{lang.nativeName}</Text>
            </View>
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={24} color={colors.action.accent} />
              </View>
            )}
          </View>
          <Text style={[styles.languageDescription, { color: colors.text.tertiary }]}>{lang.description}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background.primary} />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.background.card, borderColor: colors.border.card }]}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {t("language.title") || "Language Settings"}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.descriptionContainer}>
          <Ionicons name="language" size={32} color={colors.action.accent} />
          <Text style={[styles.descriptionTitle, { color: colors.text.primary }]}>
            {t("language.chooseLanguage") || "Choose Your Language"}
          </Text>
          <Text style={[styles.descriptionText, { color: colors.text.secondary }]}>
            {t("language.description") ||
              "Select your preferred language for the app interface. You can change this anytime from your profile settings."}
          </Text>
        </View>

        <View style={styles.languagesContainer}>
          {languages.map((lang) => (
            <LanguageCard
              key={lang.code}
              lang={lang}
              isSelected={selectedLanguage === lang.code}
            />
          ))}
        </View>

        <View style={styles.currentLanguageInfo}>
          <View style={[styles.infoCard, { backgroundColor: colors.background.card, borderColor: colors.border.card }]}>
            <Ionicons name="information-circle" size={20} color={colors.action.accent} />
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              {t("language.currentLanguage") || "Current Language"}:{" "}
              {languages.find((l) => l.code === selectedLanguage)?.name}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text.tertiary }]}>
            {t("language.changesApplyImmediately") ||
              "Changes apply immediately"}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 600,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 44,
  },
  descriptionContainer: {
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  descriptionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  descriptionText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  languagesContainer: {
    gap: 16,
    marginBottom: 32,
  },
  languageCard: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
  },
  languageCardContent: {
    padding: 20,
  },
  languageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 2,
  },
  languageNativeName: {
    fontSize: 14,
  },
  selectedIndicator: {
    marginLeft: "auto",
  },
  languageDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  currentLanguageInfo: {
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
  },
});

export default LanguageScreen;
