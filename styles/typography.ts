import { StyleSheet } from "react-native";
import Colors from "./colors";
import Dimensions from "./dimensions";

export default StyleSheet.create({
  heading: {
    color: Colors.text.primary,
    fontSize: Dimensions.fontSize.header,
    fontWeight: "bold",
  },

  title: {
    color: Colors.text.primary,
    fontSize: Dimensions.fontSize.xl,
    fontWeight: "bold",
  },

  subtitle: {
    color: Colors.text.primary,
    fontSize: Dimensions.fontSize.lg,
    fontWeight: "600",
  },

  body: {
    color: Colors.text.primary,
    fontSize: Dimensions.fontSize.md,
  },

  bodySmall: {
    color: Colors.text.primary,
    fontSize: Dimensions.fontSize.sm,
  },

  label: {
    color: Colors.text.tertiary,
    fontSize: Dimensions.fontSize.sm,
    fontWeight: "500",
  },

  price: {
    fontSize: Dimensions.fontSize.lg,
    fontWeight: "500",
  },

  priceAsk: {
    color: Colors.action.sell,
    fontSize: Dimensions.fontSize.md,
    fontWeight: "500",
  },

  priceBid: {
    color: Colors.action.buy,
    fontSize: Dimensions.fontSize.md,
    fontWeight: "500",
  },

  amount: {
    color: Colors.text.primary,
    fontSize: Dimensions.fontSize.md,
    textAlign: "right",
  },

  buttonText: {
    color: Colors.text.primary,
    fontSize: Dimensions.fontSize.lg,
    fontWeight: "bold",
    textAlign: "center",
  },

  tabActive: {
    color: Colors.text.primary,
    fontSize: Dimensions.fontSize.md,
    fontWeight: "bold",
  },

  tabInactive: {
    color: Colors.text.tertiary,
    fontSize: Dimensions.fontSize.md,
  },

  currentPrice: {
    color: Colors.action.sell,
    fontSize: Dimensions.fontSize.lg,
    fontWeight: "bold",
  },

  timestamp: {
    color: Colors.text.tertiary,
    fontSize: Dimensions.fontSize.xs,
  },
});
