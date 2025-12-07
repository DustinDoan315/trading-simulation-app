import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { getColors } from '@/styles/colors';


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
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isPositive = changePercentage >= 0;

  const content = (
    <View style={styles.content}>
      <View style={styles.labelContainer}>
        <Ionicons name="wallet" size={20} color={colors.action.accent} />
        <Text style={[styles.label, { color: colors.action.accent }]}>{t("portfolio.totalValue")}</Text>
      </View>

      <Text style={[styles.totalValue, { color: colors.text.primary }]}>{totalValue}</Text>

      <View style={styles.changeContainer}>
        <View
          style={[
            styles.changeIndicator,
            {
              backgroundColor: isPositive
                ? colors.action.buyLight
                : colors.action.sellLight,
            },
          ]}>
          <Ionicons
            name={isPositive ? "trending-up" : "trending-down"}
            size={16}
            color={isPositive ? colors.action.buy : colors.action.sell}
          />
        </View>
        <Text
          style={[
            styles.changeText,
            { color: isPositive ? colors.action.buy : colors.action.sell },
          ]}>
          {changeValue} ({changePercentage.toFixed(2)}%)
        </Text>
        <Text style={[styles.overallText, { color: colors.text.primary }]}>{t("portfolio.overall")}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background.card,
      borderColor: colors.border.card 
    }]}>
      {theme === 'dark' ? (
        <LinearGradient
          colors={["rgba(140, 158, 255, 0.1)", "rgba(140, 158, 255, 0.05)"]}
          style={styles.gradientBackground}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.gradientBackground, { backgroundColor: colors.background.card }]}>
          {content}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
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
    marginBottom: 12,
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
  },
  negative: {
  },
  overallText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default PortfolioHeader;
