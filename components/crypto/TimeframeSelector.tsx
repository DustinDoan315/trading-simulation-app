import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { TimeframeOption } from "../../app/types/crypto";
import { useLanguage } from "../../context/LanguageContext";
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
  const getTimeframeButtonStyle = (tf: TimeframeOption) => {
    return [
      styles.timeframeButton,
      timeframe === tf ? styles.timeframeButtonActive : null,
    ];
  };

  const getTimeframeTextStyle = (tf: TimeframeOption) => {
    return [
      styles.timeframeText,
      timeframe === tf ? styles.timeframeTextActive : null,
    ];
  };

  return (
    <View style={styles.timeframeContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={getTimeframeButtonStyle("15m")}
          onPress={() => switchTimeframe("15m")}>
          <Text style={getTimeframeTextStyle("15m")}>
            {t("chart.timeframes.15m")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={getTimeframeButtonStyle("1h")}
          onPress={() => switchTimeframe("1h")}>
          <Text style={getTimeframeTextStyle("1h")}>
            {t("chart.timeframes.1h")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={getTimeframeButtonStyle("4h")}
          onPress={() => switchTimeframe("4h")}>
          <Text style={getTimeframeTextStyle("4h")}>
            {t("chart.timeframes.4h")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={getTimeframeButtonStyle("1d")}
          onPress={() => switchTimeframe("1d")}>
          <Text style={getTimeframeTextStyle("1d")}>
            {t("chart.timeframes.1d")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={getTimeframeButtonStyle("3m")}
          onPress={() => switchTimeframe("3m")}>
          <Text style={getTimeframeTextStyle("3m")}>
            {t("chart.timeframes.3m")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={styles.indicatorButton}
        onPress={toggleIndicators}>
        <Text style={styles.indicatorText}>
          {showIndicators ? t("common.hide") : t("common.show")}
        </Text>
        <Ionicons
          name={showIndicators ? "chevron-down" : "chevron-up"}
          size={16}
          color="white"
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
    borderBottomColor: "#111",
    paddingBottom: 8,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  timeframeButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#0078FF",
  },
  timeframeText: {
    color: "#777",
    fontSize: 14,
  },
  timeframeTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  indicatorButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicatorText: {
    color: "white",
    fontSize: 14,
    marginRight: 4,
  },
});

export default TimeframeSelector;
