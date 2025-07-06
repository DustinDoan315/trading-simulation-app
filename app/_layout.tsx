import * as SplashScreen from "expo-splash-screen";
import scheduler from "@/utils/scheduler";
import Toast from "react-native-toast-message";
import UUIDService from "@/services/UUIDService";
import { initializeUserProfile } from "@/services/UUIDService";
import { LanguageProvider } from "@/context/LanguageContext";
import { loadBalance } from "@/features/balanceSlice";
import { NotificationProvider } from "@/components/ui/Notification";
import { Provider } from "react-redux";
import { SafeAreaView } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { store } from "../store";
import { SyncService } from "@/services/SupabaseService";
import { updateDailyBalance } from "@/utils/balanceUpdater";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { UserProvider } from "@/context/UserContext";
import "react-native-reanimated";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    const initializeApp = async () => {
      if (loaded) {
        SplashScreen.hideAsync();

        // Initialize daily balance update at midnight UTC
        scheduler.addDailyTask("daily-balance-update", updateDailyBalance, 0);

        // Ensure user exists in both local storage and Supabase
        await initializeUserProfile();

        // Get user UUID for sync operations
        const uuid = await UUIDService.getOrCreateUser();

        // Note: Portfolio clearing is no longer needed with MERGE strategy
        // The sync will now preserve existing cloud data and only update what's changed

        // Sync from cloud to get latest data
        try {
          console.log("🔄 Syncing data from cloud...");
          const syncResult = await SyncService.syncFromCloud(uuid);
          if (syncResult.success) {
            console.log("✅ Successfully synced data from cloud");
          } else {
            console.warn("⚠️ Cloud sync failed:", syncResult.error);
          }
        } catch (error) {
          console.error("❌ Error during cloud sync:", error);
        }

        // Process any offline queue operations
        try {
          console.log("🔄 Processing offline queue...");
          const queueResult = await SyncService.processOfflineQueue();
          if (queueResult.success) {
            console.log("✅ Successfully processed offline queue");
          } else {
            console.warn(
              "⚠️ Offline queue processing failed:",
              queueResult.error
            );
          }
        } catch (error) {
          console.error("❌ Error processing offline queue:", error);
        }

        // Load user balance from AsyncStorage (now with synced data)
        store.dispatch(loadBalance());

        return () => {
          scheduler.clear();
        };
      }
    };
    initializeApp();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <NotificationProvider>
          <UserProvider>
            <LanguageProvider>
              <SafeAreaView
                style={{
                  flex: 1,
                  backgroundColor:
                    colorScheme === "dark"
                      ? DarkTheme.colors.background
                      : DefaultTheme.colors.background,
                }}>
                <Stack>
                  <Stack.Screen
                    name="(subs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(onboarding)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
              </SafeAreaView>
            </LanguageProvider>
          </UserProvider>
          <Toast />
        </NotificationProvider>
      </ThemeProvider>
    </Provider>
  );
}
