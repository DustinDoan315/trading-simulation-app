import "react-native-reanimated";

import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";

import {
  ASYNC_STORAGE_KEYS,
  BACKGROUND_SYNC_CONFIG,
  DEFAULT_USER,
} from "@/utils/constant";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, router } from "expo-router";
import { createUser, fetchUser } from "@/features/userSlice";
import { useCallback, useEffect } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { BackgroundDataSyncService } from "@/services/BackgroundDataSyncService";
import { LanguageProvider } from "@/context/LanguageContext";
import LeaderboardService from "@/services/LeaderboardService";
import { NotificationProvider } from "@/components/ui/Notification";
import { Provider } from "react-redux";
import RealTimeDataService from "@/services/RealTimeDataService";
import { SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import UUIDService from "@/services/UUIDService";
import { UserProvider } from "@/context/UserContext";
import { UserService } from "@/services/UserService";
import { initializeApp } from "@/utils/initializeApp";
import { logger } from "@/utils/logger";
import scheduler from "@/utils/scheduler";
import { store } from "../store";
import { updateDailyBalance } from "@/utils/balanceUpdater";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useFonts } from "expo-font";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    const initializeAppAsync = async () => {
      if (loaded) {
        SplashScreen.hideAsync();

        await initializeApp();

        scheduler.addDailyTask("daily-balance-update", updateDailyBalance, 0);

        const userId = await UUIDService.getOrCreateUser();
        await initializeUser(userId);

        try {
          await UserService.updateUserActivity(userId, true);
          logger.info("User activity set to active on app start", "AppLayout", {
            userId,
          });
        } catch (error) {
          logger.warn(
            "Failed to update user activity on app start",
            "AppLayout",
            { userId, error }
          );
        }

        await initializeBackgroundSync();

        setupDeepLinking();

        return () => {
          scheduler.clear();
          RealTimeDataService.getInstance().stopUpdates();
          LeaderboardService.getInstance().cleanup();
          BackgroundDataSyncService.getInstance().stop();
        };
      }
    };
    initializeAppAsync();
  }, [loaded]);

  const setupDeepLinking = () => {
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => subscription?.remove();
  };

  const handleDeepLink = useCallback((url: string) => {
    try {
      logger.info("Deep link handled", "AppLayout", { url });
    } catch (error) {
      logger.error("Error handling deep link", "AppLayout", error);
    }
  }, []);

  const checkOnboardingStatus = useCallback(async (userId: string) => {
    try {
      const onboardingCompleted = await AsyncStorage.getItem(
        ASYNC_STORAGE_KEYS.ONBOARDING_COMPLETED
      );
      logger.info("Checking onboarding status", "AppLayout", {
        userId,
        onboardingCompleted,
        isCompleted: onboardingCompleted === "true",
      });
      return onboardingCompleted == "true";
    } catch (error) {
      logger.error("Error checking onboarding status", "AppLayout", error);
      return false;
    }
  }, []);

  const initializeUser = useCallback(
    async (userId: string) => {
      try {
        logger.info("Initializing user with ID", "AppLayout", { userId });

        const userData = store.getState().user;
        let isNewUser = false;

        if (userData?.currentUser) {
          logger.info("User data loaded successfully from Redux", "AppLayout");
        } else {
          logger.warn(
            "No user data found in Redux store, initializing user",
            "AppLayout"
          );

          try {
            await store.dispatch(fetchUser(userId)).unwrap();
            logger.info("Existing user fetched successfully", "AppLayout");
          } catch (error) {
            logger.info("User not found, creating new user", "AppLayout");
            isNewUser = true;
            const timestamp = Date.now().toString().slice(-6);
            const username = `user_${userId.slice(0, 8)}_${timestamp}`;
            await store
              .dispatch(
                createUser({
                  id: userId,
                  username,
                  display_name: username,
                  avatar_emoji: DEFAULT_USER.AVATAR_EMOJI,
                  usdt_balance: DEFAULT_USER.INITIAL_BALANCE,
                })
              )
              .unwrap();
          }
        }

        const hasCompletedOnboarding = await checkOnboardingStatus(userId);

        if (isNewUser || !hasCompletedOnboarding) {
          logger.info("Redirecting to onboarding", "AppLayout", {
            isNewUser,
            hasCompletedOnboarding,
          });
          router.replace("/(onboarding)/onboarding");
        } else {
          logger.info(
            "User has completed onboarding, going to main app",
            "AppLayout"
          );
          router.replace("/(tabs)");
        }
      } catch (error) {
        logger.error("Error initializing user", "AppLayout", error);
        router.replace("/(onboarding)/onboarding");
      }
    },
    [checkOnboardingStatus]
  );

  const initializeBackgroundSync = useCallback(async () => {
    try {
      logger.info("Initializing background data sync service", "AppLayout");

      const syncService = BackgroundDataSyncService.getInstance();

      syncService.updateConfig({
        intervalMs: BACKGROUND_SYNC_CONFIG.INTERVAL_MS,
        maxConcurrentUpdates: BACKGROUND_SYNC_CONFIG.MAX_CONCURRENT_UPDATES,
        retryAttempts: BACKGROUND_SYNC_CONFIG.RETRY_ATTEMPTS,
        retryDelayMs: BACKGROUND_SYNC_CONFIG.RETRY_DELAY_MS,
      });

      await syncService.start();

      logger.info(
        "Background data sync service initialized successfully",
        "AppLayout"
      );
    } catch (error) {
      logger.error(
        "Error initializing background sync service",
        "AppLayout",
        error
      );
    }
  }, []);

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
                  backgroundColor: DarkTheme.colors.background,
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
                  <Stack.Screen
                    name="(modals)"
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
