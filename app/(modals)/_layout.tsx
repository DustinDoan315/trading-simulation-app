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
      <Stack.Screen name="collections" />
      <Stack.Screen name="collection-detail" />
      <Stack.Screen name="create-collection" />
      <Stack.Screen name="discover-collections" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="invite-code-scanner" />
      <Stack.Screen name="join-collection" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="token-search" />
      <Stack.Screen name="trading-history" />
      <Stack.Screen name="transaction-history" />
    </Stack>
  );
}
