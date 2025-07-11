import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import Typography from "@/styles/typography";
import { formatAmount } from "@/utils/formatters";

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
      <View style={[styles.inputWrapper, !editable && styles.inputDisabled]}>
        <TextInput
          style={styles.input}
          value={isFocused ? rawValue : formatAmount(rawValue, 2)}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.tertiary}
          selectionColor={Colors.action.primary}
          editable={editable}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
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
  },
  inputWrapper: {
    backgroundColor: Colors.background.primary,
    borderRadius: Dimensions.radius.md,
    borderWidth: Dimensions.border.thin,
    borderColor: Colors.border.light,
    height: Dimensions.components.inputHeight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Dimensions.spacing.md,
  },
  inputDisabled: {
    backgroundColor: Colors.background.secondary,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: Dimensions.fontSize.md,
    height: Dimensions.components.inputHeight,
    padding: 0,
  },
  suffix: {
    color: Colors.text.tertiary,
    fontSize: Dimensions.fontSize.sm,
    marginLeft: Dimensions.spacing.xs,
  },
});

export default PriceInput;
