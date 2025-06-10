import { Provider } from "react-redux";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { UserProvider } from "@/context/UserContext";
import { store } from "../store";
import { loadBalance } from "@/features/balanceSlice";
import { NotificationProvider } from "@/components/ui/Notification";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import scheduler from "@/utils/scheduler";
import { updateDailyBalance } from "@/utils/balanceUpdater";

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

      // Initialize daily balance update at midnight UTC
      scheduler.addDailyTask("daily-balance-update", updateDailyBalance, 0);

      // Load user balance from database
      store.dispatch(loadBalance());

      return () => {
        scheduler.clear();
      };
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <NotificationProvider>
          <UserProvider>
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
                <Stack.Screen
                  name="(onboarding)"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </SafeAreaView>
          </UserProvider>
          <Toast />
        </NotificationProvider>
      </ThemeProvider>
    </Provider>
  );
}
