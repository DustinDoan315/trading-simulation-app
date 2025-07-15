import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';


type PortfolioHeaderProps = {
  totalValue: string;
  changePercentage: number;
  changeValue: string;
};

const PortfolioHeader = ({
  totalValue,
  changePercentage,
  changeValue,
}: PortfolioHeaderProps) => {
  const { t } = useLanguage();
  const isPositive = changePercentage >= 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(140, 158, 255, 0.1)", "rgba(140, 158, 255, 0.05)"]}
        style={styles.gradientBackground}>
        <View style={styles.content}>
          <View style={styles.labelContainer}>
            <Ionicons name="wallet" size={20} color="#8C9EFF" />
            <Text style={styles.label}>{t("portfolio.totalValue")}</Text>
          </View>

          <Text style={styles.totalValue}>{totalValue}</Text>

          <View style={styles.changeContainer}>
            <View
              style={[
                styles.changeIndicator,
                {
                  backgroundColor: isPositive
                    ? "rgba(76, 175, 80, 0.1)"
                    : "rgba(244, 67, 54, 0.1)",
                },
              ]}>
              <Ionicons
                name={isPositive ? "trending-up" : "trending-down"}
                size={16}
                color={isPositive ? "#4CAF50" : "#F44336"}
              />
            </View>
            <Text
              style={[
                styles.changeText,
                isPositive ? styles.positive : styles.negative,
              ]}>
              {changeValue} ({changePercentage.toFixed(2)}%)
            </Text>
            <Text style={styles.overallText}>{t("portfolio.overall")}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 10,
  },
  gradientBackground: {
    padding: 24,
    borderRadius: 20,
  },
  content: {
    alignItems: "center",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#8C9EFF",
    fontWeight: "600",
    marginLeft: 6,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
    textShadowColor: "rgba(140, 158, 255, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  changeIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  changeText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 6,
  },
  positive: {
    color: "#4CAF50",
  },
  negative: {
    color: "#F44336",
  },
  overallText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },
});

export default PortfolioHeader;
