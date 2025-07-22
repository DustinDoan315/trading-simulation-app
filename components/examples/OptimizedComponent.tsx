import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

// React 19 automatically optimizes this component
// No need for React.memo() - the compiler handles it
interface OptimizedComponentProps {
  title: string;
  value: number;
  onPress?: () => void;
}

export const OptimizedComponent: React.FC<OptimizedComponentProps> = ({
  title,
  value,
  onPress,
}) => {
  // React 19 automatically memoizes this calculation
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText style={styles.value}>{formattedValue}</ThemedText>
      {onPress && (
        <Text style={styles.button} onPress={onPress}>
          View Details
        </Text>
      )}
    </ThemedView>
  );
};

// React 19 automatically optimizes this component too
export const OptimizedList: React.FC<{ items: string[] }> = ({ items }) => {
  // React 19 automatically memoizes this filtered list
  const filteredItems = items.filter((item) => item.length > 0);

  return (
    <View style={styles.listContainer}>
      {filteredItems.map((item, index) => (
        <Text key={index} style={styles.listItem}>
          {item}
        </Text>
      ))}
    </View>
  );
};

// React 19 automatically optimizes expensive calculations
export const OptimizedCalculator: React.FC<{
  principal: number;
  rate: number;
  time: number;
}> = ({ principal, rate, time }) => {
  // React 19 automatically memoizes this expensive calculation
  const interest = principal * (rate / 100) * time;
  const total = principal + interest;

  return (
    <View style={styles.calculatorContainer}>
      <Text style={styles.calculatorLabel}>Principal: ${principal}</Text>
      <Text style={styles.calculatorLabel}>
        Interest: ${interest.toFixed(2)}
      </Text>
      <Text style={styles.calculatorTotal}>Total: ${total.toFixed(2)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: "600",
    color: "#007AFF",
  },
  button: {
    color: "#007AFF",
    marginTop: 8,
    textDecorationLine: "underline",
  },
  listContainer: {
    padding: 16,
  },
  listItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  calculatorContainer: {
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  calculatorLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  calculatorTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#28A745",
    marginTop: 8,
  },
});
