import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { TimeframeOption } from "../../types/crypto";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { getColors } from "../../styles/colors";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TimeframeSelectorProps {
  timeframe: TimeframeOption;
  switchTimeframe: (newTimeframe: TimeframeOption) => void;
  showIndicators: boolean;
  toggleIndicators: () => void;
}

const TimeframeSelector = ({
  timeframe,
  switchTimeframe,
  showIndicators,
  toggleIndicators,
}: TimeframeSelectorProps) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const colors = getColors(theme);
  
  const getTimeframeButtonStyle = (tf: TimeframeOption) => {
    return [
      styles.timeframeButton,
      timeframe === tf ? [styles.timeframeButtonActive, { borderBottomColor: colors.action.primary }] : null,
    ];
  };

  const getTimeframeTextStyle = (tf: TimeframeOption) => {
    return [
      styles.timeframeText,
      { color: timeframe === tf ? colors.text.primary : colors.text.tertiary },
      timeframe === tf ? styles.timeframeTextActive : null,
    ];
  };

  return (
    <View style={[styles.timeframeContainer, { borderBottomColor: colors.border.medium }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {["1m", "3m", "15m", "1h", "4h", "1d"].map((tf: any) => (
          <TouchableOpacity
            key={tf}
            style={getTimeframeButtonStyle(tf)}
            onPress={() => switchTimeframe(tf)}>
            <Text style={getTimeframeTextStyle(tf)}>
              {t(`chart.timeframes.${tf}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.indicatorButton}
        onPress={toggleIndicators}>
        <Text style={[styles.indicatorText, { color: colors.text.primary }]}>
          {showIndicators ? t("common.hide") : t("common.show")}
        </Text>
        <Ionicons
          name={showIndicators ? "chevron-down" : "chevron-up"}
          size={16}
          color={colors.text.primary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  timeframeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  timeframeButtonActive: {
    borderBottomWidth: 2,
  },
  timeframeText: {
    fontSize: 14,
  },
  timeframeTextActive: {
    fontWeight: "bold",
  },
  indicatorButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicatorText: {
    fontSize: 14,
    marginRight: 4,
  },
});

export default TimeframeSelector;
