import Colors from "@/styles/colors";
import Dimensions from "@/styles/dimensions";
import React from "react";
import Typography from "@/styles/typography";
import { formatAmount } from "@/utils/formatters";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { getColors } from "@/styles/colors";

const PriceInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "numeric",
  suffix,
  editable = true,
}: any) => {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [rawValue, setRawValue] = React.useState(value?.toString() || "");
  const [isFocused, setIsFocused] = React.useState(false);

  const cleanInput = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return `${parts[0]}.${parts.slice(1).join("")}`;
    }
    return cleaned;
  };

  const safeParseAndFormat = (val: string | number): string => {
    if (typeof val === "number") {
      if (!Number.isFinite(val) || val < 0) return "0.00";
      return val.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    const cleaned = val.replace(/,/g, "").replace(/[^0-9.]/g, "");
    const parsed = Number.parseFloat(cleaned);
    if (!Number.isFinite(parsed) || parsed < 0) return "0.00";
    return parsed.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleChange = (text: string) => {
    const cleaned = cleanInput(text);
    setRawValue(cleaned);
    onChangeText?.(cleaned);
  };

  React.useEffect(() => {
    if (value === undefined || value === null) {
      setRawValue("0");
      return;
    }
    const valueStr = value.toString();
    const cleanValue = valueStr.replace(/,/g, "").replace(/[^0-9.]/g, "");
    const parsed = Number.parseFloat(cleanValue);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed < 1000000000) {
      setRawValue(cleanValue);
    } else if (cleanValue === "" || cleanValue === "0") {
      setRawValue("0");
    }
  }, [value]);

  const getGradientColors = () => {
    if (theme === 'dark') {
      return isFocused
        ? ["rgba(102, 116, 204, 0.15)", "rgba(102, 116, 204, 0.08)"]
        : ["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.03)"];
    } else {
      return isFocused
        ? [colors.action.accent + "15", colors.action.accent + "08"]
        : [colors.background.cardSecondary, colors.background.cardSecondary];
    }
  };

  const inputWrapperStyle = theme === 'dark' 
    ? [styles.inputWrapper, { borderColor: isFocused ? colors.action.accent + "40" : colors.border.card }, !editable && styles.inputDisabled]
    : [styles.inputWrapper, {
        backgroundColor: colors.background.cardSecondary,
        borderColor: isFocused ? colors.action.accent : colors.border.card,
      }, !editable && styles.inputDisabled];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text.secondary }]}>{label}</Text>
      {theme === 'dark' ? (
        <LinearGradient
          colors={getGradientColors()}
          style={inputWrapperStyle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <TextInput
            style={[styles.input, { color: colors.text.primary }]}
            value={isFocused ? rawValue : safeParseAndFormat(rawValue)}
            onChangeText={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            keyboardType={keyboardType}
            placeholder={placeholder}
            placeholderTextColor={colors.text.tertiary}
            selectionColor={colors.action.accent}
            editable={editable}
          />
          {suffix && <Text style={[styles.suffix, { color: colors.text.secondary }]}>{suffix}</Text>}
        </LinearGradient>
      ) : (
        <View style={inputWrapperStyle}>
          <TextInput
            style={[styles.input, { color: colors.text.primary }]}
            value={isFocused ? rawValue : safeParseAndFormat(rawValue)}
            onChangeText={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            keyboardType={keyboardType}
            placeholder={placeholder}
            placeholderTextColor={colors.text.tertiary}
            selectionColor={colors.action.accent}
            editable={editable}
          />
          {suffix && <Text style={[styles.suffix, { color: colors.text.secondary }]}>{suffix}</Text>}
        </View>
      )}
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
    fontSize: Dimensions.fontSize.sm,
    fontWeight: "500",
  },
  inputWrapper: {
    borderRadius: Dimensions.radius.md,
    borderWidth: 1,
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
    fontSize: Dimensions.fontSize.md,
    height: Dimensions.components.inputHeight,
    padding: 0,
    fontWeight: "500",
  },
  suffix: {
    fontSize: Dimensions.fontSize.sm,
    marginLeft: Dimensions.spacing.xs,
    fontWeight: "500",
  },
});

export default PriceInput;
