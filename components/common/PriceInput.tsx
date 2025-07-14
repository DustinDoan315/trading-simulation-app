import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import React from "react";
import Typography from "@/styles/typography";
import { formatAmount } from "@/utils/formatters";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TextInput, View } from "react-native";

const PriceInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "numeric",
  suffix,
  editable = true,
}: any) => {
  const [rawValue, setRawValue] = React.useState(value?.toString() || "");
  const [isFocused, setIsFocused] = React.useState(false);

  const cleanInput = (text: string) => {
    // Remove all non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, "");
    // Ensure only one decimal point
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return `${parts[0]}.${parts.slice(1).join("")}`;
    }
    return cleaned;
  };

  const handleChange = (text: string) => {
    const cleaned = cleanInput(text);
    setRawValue(cleaned);
    onChangeText?.(cleaned);
  };

  React.useEffect(() => {
    setRawValue(value?.toString() || "");
  }, [value]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <LinearGradient
        colors={
          isFocused
            ? ["rgba(102, 116, 204, 0.15)", "rgba(102, 116, 204, 0.08)"]
            : ["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.03)"]
        }
        style={[styles.inputWrapper, !editable && styles.inputDisabled]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <TextInput
          style={styles.input}
          value={isFocused ? rawValue : formatAmount(rawValue, 2)}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          selectionColor="#6674CC"
          editable={editable}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Dimensions.spacing.md,
  },
  label: {
    ...Typography.longLabel,
    marginBottom: Dimensions.spacing.xs,
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: Dimensions.fontSize.sm,
    fontWeight: "500",
  },
  inputWrapper: {
    borderRadius: Dimensions.radius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    height: Dimensions.components.inputHeight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Dimensions.spacing.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: Dimensions.fontSize.md,
    height: Dimensions.components.inputHeight,
    padding: 0,
    fontWeight: "500",
  },
  suffix: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: Dimensions.fontSize.sm,
    marginLeft: Dimensions.spacing.xs,
    fontWeight: "500",
  },
});

export default PriceInput;
