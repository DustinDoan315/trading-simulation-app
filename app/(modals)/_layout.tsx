import React from "react";
import { Stack } from "expo-router";

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "modal",
        animationTypeForReplace: "push",
        animation: "slide_from_bottom",
      }}>
      <Stack.Screen name="create-collection" />
      <Stack.Screen name="join-collection" />
      <Stack.Screen name="collection-detail" />
      <Stack.Screen name="token-search" />
      <Stack.Screen name="token-detail" />
      <Stack.Screen name="transaction-history" />
      <Stack.Screen name="buy-token" />
      <Stack.Screen name="sell-token" />
      <Stack.Screen name="invite-code-input" />
      <Stack.Screen name="invite-code-scanner" />
    </Stack>
  );
}
