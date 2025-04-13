import React from 'react';
import { StyleSheet, Text, View } from 'react-native';


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
          {isPositive ? "+" : ""}
          {changePercentage}% ({changeValue})
        </Text>
        <Text style={styles.overallText}>Overall</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
    color: "#6674CC",
  },
  negative: {
    color: "#FF6B6B",
  },
  overallText: {
    fontSize: 18,
    marginLeft: 8,
    color: "white",
  },
});

export default PortfolioHeader;
