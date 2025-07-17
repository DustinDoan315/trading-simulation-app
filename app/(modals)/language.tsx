import { Ionicons } from '@expo/vector-icons';
import { logger } from '@/utils/logger';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  Alert,
  Animated,
  Dimensions,
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
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isChanging, setIsChanging] = useState(false);

  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.9);

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
  }, []);

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
    } catch (error) {
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
    const cardScale = new Animated.Value(isSelected ? 1.5 : 1);
    const borderOpacity = new Animated.Value(isSelected ? 1 : 0.3);

    useEffect(() => {
      Animated.parallel([
        Animated.timing(cardScale, {
          toValue: isSelected ? 1.05 : 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(borderOpacity, {
          toValue: isSelected ? 1 : 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, [isSelected]);

    return (
      <Animated.View
        style={[
          styles.languageCard,
          {
            transform: [{ scale: cardScale }],
            borderColor: isSelected ? "#66742e" : "#2A2E42",
            opacity: borderOpacity,
          },
        ]}>
        <TouchableOpacity
          style={styles.languageCardContent}
          onPress={() => handleLanguageSelect(lang.code)}
          disabled={isChanging}>
          <View style={styles.languageHeader}>
            <Text style={styles.languageFlag}>{lang.flag}</Text>
            <View style={styles.languageInfo}>
              <Text style={styles.languageName}>{lang.name}</Text>
              <Text style={styles.languageNativeName}>{lang.nativeName}</Text>
            </View>
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={24} color="#6674CC" />
              </View>
            )}
          </View>
          <Text style={styles.languageDescription}>{lang.description}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131523" />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("language.title") || "Language Settings"}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.descriptionContainer}>
          <Ionicons name="language" size={32} color="#6674CC" />
          <Text style={styles.descriptionTitle}>
            {t("language.chooseLanguage") || "Choose Your Language"}
          </Text>
          <Text style={styles.descriptionText}>
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
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#6674CC" />
            <Text style={styles.infoText}>
              {t("language.currentLanguage") || "Current Language"}:{" "}
              {languages.find((l) => l.code === selectedLanguage)?.name}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t("language.changesApplyImmediately") ||
              "Changes apply immediately"}
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131523",
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
    backgroundColor: "#1A1D2F",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#FFFFFF",
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
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  descriptionText: {
    fontSize: 16,
    color: "#9DA3B4",
    textAlign: "center",
    lineHeight: 24,
  },
  languagesContainer: {
    gap: 16,
    marginBottom: 32,
  },
  languageCard: {
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#2A2E42",
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
    color: "#FFFFFF",
    marginBottom: 2,
  },
  languageNativeName: {
    fontSize: 14,
    color: "#9DA3B4",
  },
  selectedIndicator: {
    marginLeft: "auto",
  },
  languageDescription: {
    fontSize: 14,
    color: "#8F95B2",
    lineHeight: 20,
  },
  currentLanguageInfo: {
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  infoText: {
    fontSize: 14,
    color: "#9DA3B4",
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: "#8F95B2",
    textAlign: "center",
  },
});

export default LanguageScreen;
