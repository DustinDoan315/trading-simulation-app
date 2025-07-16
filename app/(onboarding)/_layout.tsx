import React from 'react';
import { Colors } from '../../constants/Colors';
import { Stack } from 'expo-router';

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
        name="onboarding"
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
