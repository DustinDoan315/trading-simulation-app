import React from "react";
import { Stack } from "expo-router";
import { Colors } from "../../constants/Colors";

/**
 * Onboarding Navigation Layout
 * @description Manages screen transitions and styling for onboarding process
 */
export default function SubLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.background,
        },
        headerTintColor: Colors.dark.background,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerBackTitle: "Back",
        headerShadowVisible: false,
      }}>
      <Stack.Screen
        name="crypto-search"
        options={{
          headerShown: false,
          presentation: "card",
          title: "crypto-search",
        }}
      />
      <Stack.Screen
        name="crypto-detail"
        options={{
          headerShown: false,
          presentation: "card",
          title: "crypto-detail",
        }}
      />
      <Stack.Screen
        name="crypto-chart"
        options={{
          headerShown: false,
          presentation: "card",
          title: "crypto-chart",
        }}
      />
    </Stack>
  );
}
