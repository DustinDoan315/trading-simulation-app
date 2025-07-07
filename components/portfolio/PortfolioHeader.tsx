import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLanguage } from "@/context/LanguageContext";

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
      <Text style={styles.totalValue}>{totalValue}</Text>
      <View style={styles.changeContainer}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  totalValue: {
    fontSize: 40,
    fontWeight: "bold",
    color: "white",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  changeText: {
    fontSize: 18,
    fontWeight: "600",
  },
  positive: {
    color: "#4CAF50",
  },
  negative: {
    color: "#F44336",
  },
  overallText: {
    fontSize: 18,
    marginLeft: 8,
    color: "white",
  },
});

export default PortfolioHeader;
