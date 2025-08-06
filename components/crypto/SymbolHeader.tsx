import React from 'react';
import { ChartType } from '../../types/crypto';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
  } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';


interface SymbolHeaderProps {
  priceChange: string;
  symbol: string;
  chartType: ChartType;
  toggleChartType: () => void;
  toggleIndicators: () => void;
  onBackPress?: () => void;
}

const SymbolHeader = ({
  priceChange,
  chartType,
  symbol,
  toggleChartType,
  toggleIndicators,
  onBackPress,
}: SymbolHeaderProps) => {
  const { t } = useLanguage();
  const showListCrypto = () => {
    router.push("/(subs)/crypto-list");
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.symbolContainer}>
      <View style={styles.symbolLeft}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={showListCrypto} style={styles.symbolSection}>
          <Text style={styles.symbolText}>{`${symbol}`}</Text>
          <TouchableOpacity>
            <Ionicons name="chevron-down" size={16} color="white" />
          </TouchableOpacity>
          <Text
            style={[
              styles.priceChangeText,
              { color: priceChange.includes("+") ? "#4ADE80" : "#FF4D4F" },
            ]}>
            {priceChange}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.symbolRight}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={toggleChartType}
          accessibilityLabel={t("chart.types." + chartType)}>
          <Feather
            name={chartType === "candlestick" ? "bar-chart-2" : "trending-up"}
            size={22}
            color="white"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={toggleIndicators}
          accessibilityLabel={t("chart.indicators")}>
          <Feather name="layers" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          accessibilityLabel={t("common.moreOptions")}>
          <Feather name="more-vertical" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  symbolContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  symbolLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  symbolSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  symbolText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 8,
  },
  priceChangeText: {
    color: "#4ADE80",
    fontSize: 14,
    marginLeft: 8,
  },
  symbolRight: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 16,
    padding: 4,
  },
});

export default SymbolHeader;
