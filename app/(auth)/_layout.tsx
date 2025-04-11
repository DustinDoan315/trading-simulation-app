import React from "react";
import { Stack } from "expo-router";
import { Colors } from "../../constants/Colors";

/**
 *  Auth Navigation Layout
 * @description Manages screen transitions and styling for Authentication process
 */
export default function AuthLayout() {
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
        name="import-wallet"
        options={{
          headerShown: false,
          title: "Import Wallet",
          presentation: "card",
        }}
      />

      <Stack.Screen
        name="create-wallet"
        options={{
          headerShown: false,
          title: "Create Wallet",
          presentation: "card",
        }}
      />

      <Stack.Screen
        name="secure-wallet"
        options={{
          headerShown: false,
          title: "Secure Wallet",
          presentation: "card",
        }}
      />

      <Stack.Screen
        name="wallet-info"
        options={{
          headerShown: false,
          title: "Wallet Info",
          presentation: "card",
        }}
      />

      <Stack.Screen
        name="generate-seed-phrase"
        options={{
          headerShown: false,
          title: "Generate Seed Phrase",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="validate-seed-phrase"
        options={{
          headerShown: false,
          title: "Validate Seed Phrase",
          presentation: "card",
        }}
      />

      <Stack.Screen
        name="validate-success"
        options={{
          headerShown: false,
          title: "Validate Success",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
