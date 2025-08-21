import React from 'react';
import { Colors } from '../../constants/Colors';
import { Stack } from 'expo-router';

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
      <Stack.Screen
        name="crypto-list"
        options={{
          headerShown: false,
          presentation: "modal",
          contentStyle: { backgroundColor: "transparent" },
          title: "crypto-list",
        }}
      />

    </Stack>
  );
}
