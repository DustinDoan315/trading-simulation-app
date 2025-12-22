import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LeaderboardService from "@/services/LeaderboardService";
import RealTimeDataService from "@/services/RealTimeDataService";
import scheduler from "@/utils/scheduler";
import Toast from "react-native-toast-message";
import UUIDService from "@/services/UUIDService";
import { BackgroundDataSyncService } from "@/services/BackgroundDataSyncService";
import { createUser, fetchUser } from "@/features/userSlice";
import { getColors } from "@/styles/colors";
import { initializeApp } from "@/utils/initializeApp";
import { initSentry, setSentryUser } from "@/utils/sentry";
import { LanguageProvider } from "@/context/LanguageContext";
import { logger } from "@/utils/logger";
import { NotificationProvider } from "@/components/ui/Notification";
import { Provider } from "react-redux";
import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { store } from "../store";
import { updateDailyBalance } from "@/utils/balanceUpdater";
import { useCallback, useEffect } from "react";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useFonts } from "expo-font";
import { useOTAUpdates } from "@/hooks/useOTAUpdates";
import { UserProvider } from "@/context/UserContext";
import { UserService } from "@/services/UserService";
import "react-native-reanimated";

import {
  ASYNC_STORAGE_KEYS,
  BACKGROUND_SYNC_CONFIG,
  DEFAULT_USER,
} from "@/utils/constant";
import {
  ThemeProvider as AppThemeProvider,
  useTheme,
} from "@/context/ThemeContext";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

SplashScreen.preventAutoHideAsync();

function ThemedLayoutContent() {
  const { theme, isDark } = useTheme();
  const colors = getColors(theme);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <NotificationProvider>
        <UserProvider>
          <LanguageProvider>
            <SafeAreaView
              style={{
                flex: 1,
                backgroundColor: colors.background.primary,
              }}>
              <Stack>
                <Stack.Screen name="(subs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="(onboarding)"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="(modals)"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style={isDark ? "light" : "dark"} />
            </SafeAreaView>
          </LanguageProvider>
        </UserProvider>
        <Toast />
      </NotificationProvider>
    </ThemeProvider>
  );
}

initSentry();

if (typeof (global as any).ErrorUtils !== "undefined") {
  const ErrorUtils = (global as any).ErrorUtils;
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    if (__DEV__) {
      console.error("Global error handler:", error, { isFatal });
    }
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

if (typeof global !== "undefined") {
  const originalUnhandledRejection = (global as any).onunhandledrejection;
  (global as any).onunhandledrejection = (event: { reason?: any }) => {
    if (__DEV__) {
      console.error("Unhandled promise rejection:", event.reason);
    }

    if (originalUnhandledRejection) {
      originalUnhandledRejection(event);
    }
  };
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Initialize OTA updates
  const {
    isEnabled: otaEnabled,
    channel: otaChannel,
    error: otaError,
    isExpoGo,
  } = useOTAUpdates({
    checkOnMount: true,
    showUpdateAvailableAlert: true,
    autoRestart: false,
    checkInterval: 300000,
  });

  useEffect(() => {
    const initializeAppAsync = async () => {
      if (loaded) {
        SplashScreen.hideAsync();

        await initializeApp();

        scheduler.addDailyTask("daily-balance-update", updateDailyBalance, 0);
        scheduler.addDailyTask(
          "daily-transaction-limits-reset",
          async () => {
            try {
              await UserService.resetAllDailyTransactionLimits();
            } catch (error) {
              console.error("Failed to reset daily transaction limits:", error);
            }
          },
          0
        );

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

        // Log OTA update information
        if (isExpoGo) {
          logger.info(
            "Running in Expo Go - OTA updates not available",
            "AppLayout"
          );
        } else if (otaEnabled) {
          logger.info("OTA Updates enabled", "AppLayout", {
            channel: otaChannel,
            isEnabled: otaEnabled,
          });
        } else {
          logger.info("OTA Updates disabled", "AppLayout");
        }

        if (otaError && !isExpoGo) {
          logger.error("OTA Update error", "AppLayout", { error: otaError });
        }

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
          logger.info("User data loaded successfully from Redux", "AppLayout", {
            userId: userData.currentUser.id,
            username: userData.currentUser.username,
          });

          // Set Sentry user context
          setSentryUser(
            userData.currentUser.id,
            userData.currentUser.username || userData.currentUser.display_name
          );
        } else {
          logger.warn(
            "No user data found in Redux store, checking database",
            "AppLayout",
            { userId }
          );

          try {
            // Try to fetch existing user from database
            const fetchedUser = await store
              .dispatch(fetchUser(userId))
              .unwrap();
            logger.info(
              "Existing user fetched successfully from database",
              "AppLayout",
              { userId }
            );

            // Set Sentry user context for fetched user
            if (fetchedUser) {
              setSentryUser(
                fetchedUser.id || userId,
                fetchedUser.username || fetchedUser.display_name
              );
            }
          } catch (error) {
            // Log the error for debugging, but proceed with user creation
            logger.warn(
              "User not found in database or fetch failed, creating new user",
              "AppLayout",
              { userId, error }
            );
            isNewUser = true;
            const timestamp = Date.now().toString().slice(-6);
            const username = `user_${userId.slice(0, 8)}_${timestamp}`;

            try {
              const newUser = await store
                .dispatch(
                  createUser({
                    id: userId, // Use the existing UUID from UUIDService
                    username,
                    display_name: username,
                    avatar_emoji: DEFAULT_USER.AVATAR_EMOJI,
                    usdt_balance: DEFAULT_USER.INITIAL_BALANCE,
                  })
                )
                .unwrap();
              logger.info(
                "New user created successfully in database",
                "AppLayout",
                {
                  userId: newUser?.id || userId,
                  username: newUser?.username || username,
                }
              );

              // Set Sentry user context for new user
              setSentryUser(
                newUser?.id || userId,
                newUser?.username || username
              );
            } catch (createError) {
              logger.error("Failed to create user in database", "AppLayout", {
                userId,
                error: createError,
              });
              // If creation fails, still proceed with onboarding
              isNewUser = true;
            }
          }
        }

        const hasCompletedOnboarding = await checkOnboardingStatus(userId);

        logger.info("User initialization completed", "AppLayout", {
          userId,
          isNewUser,
          hasCompletedOnboarding,
          userExistsInRedux: !!userData?.currentUser,
        });

        if (isNewUser || !hasCompletedOnboarding) {
          logger.info("Redirecting to onboarding", "AppLayout", {
            isNewUser,
            hasCompletedOnboarding,
          });
          router.replace("/(onboarding)/onboarding");
        } else {
          logger.info(
            "User has completed onboarding, going to main app",
            "AppLayout",
            { userId }
          );
          router.replace("/(tabs)");
        }
      } catch (error) {
        logger.error("Error initializing user", "AppLayout", { userId, error });
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
      <AppThemeProvider>
        <ThemedLayoutContent />
      </AppThemeProvider>
    </Provider>
  );
}
