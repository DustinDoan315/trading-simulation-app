import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaView } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor:
            colorScheme === "dark"
              ? DarkTheme.colors.background
              : DefaultTheme.colors.background,
        }}>
        <Stack>
          <Stack.Screen name="(subs)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />

          <Stack.Screen
            name="add-token"
            options={{
              headerShown: false,
              presentation: "transparentModal",
              title: "Add Token",
              animation: "slide_from_bottom",
              contentStyle: { backgroundColor: "transparent" },
              gestureEnabled: true,
              gestureDirection: "vertical",
            }}
          />

          <Stack.Screen
            name="add-account"
            options={{
              headerShown: false,
              presentation: "transparentModal",
              title: "Add Account",
              animation: "slide_from_bottom",
              contentStyle: { backgroundColor: "transparent" },
              gestureEnabled: true,
              gestureDirection: "vertical",
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaView>
    </ThemeProvider>
  );
}
