import React from "react";
import { Stack } from "expo-router";
import { Colors } from "../../constants/Colors";

/**
 * Onboarding Navigation Layout
 * @description Manages screen transitions and styling for onboarding process
 */
export default function OnboardingLayout() {
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
        name="index"
        options={{
          headerShown: false,
          title: "Welcome",
        }}
      />

      <Stack.Screen
        name="wallet-setup"
        options={{
          title: "Create Wallet",
          presentation: "card",
        }}
      />

      <Stack.Screen
        name="security-options"
        options={{
          title: "Secure Your Wallet",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
