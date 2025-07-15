import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LeaderboardService from '@/services/LeaderboardService';
import RealTimeDataService from '@/services/RealTimeDataService';
import scheduler from '@/utils/scheduler';
import Toast from 'react-native-toast-message';
import UUIDService from '@/services/UUIDService';
import { BackgroundDataSyncService } from '@/services/BackgroundDataSyncService';
import { createUser, fetchUser } from '@/features/userSlice';
import { initializeApp } from '@/utils/initializeApp';
import { LanguageProvider } from '@/context/LanguageContext';
import { logger } from '@/utils/logger';
import { NotificationProvider } from '@/components/ui/Notification';
import { Provider } from 'react-redux';
import { SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { store } from '../store';
import { updateDailyBalance } from '@/utils/balanceUpdater';
import { useCallback, useEffect } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFonts } from 'expo-font';
import { UserProvider } from '@/context/UserContext';
import { UserService } from '@/services/UserService';
import 'react-native-reanimated';


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
    const initializeAppAsync = async () => {
      if (loaded) {
        SplashScreen.hideAsync();

        // Initialize app configuration and services
        await initializeApp();

        // Initialize daily balance update at midnight UTC
        scheduler.addDailyTask("daily-balance-update", updateDailyBalance, 0);

        // Check if user exists and initialize if needed
        const userId = await UUIDService.getOrCreateUser();
        await initializeUser(userId);

        // Initialize background data sync service
        await initializeBackgroundSync();

        // Set up deep link handling
        setupDeepLinking();

        return () => {
          scheduler.clear();
          // Stop real-time data services when app is unmounted
          RealTimeDataService.getInstance().stopUpdates();
          LeaderboardService.getInstance().cleanup();
          BackgroundDataSyncService.getInstance().stop();
        };
      }
    };
    initializeAppAsync();
  }, [loaded]);

  const setupDeepLinking = () => {
    // Handle deep links when app is already running
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    // Handle deep links when app is opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => subscription?.remove();
  };

  const handleDeepLink = useCallback((url: string) => {
    try {
      // Handle deep link logic here
      logger.info("Deep link handled", "AppLayout", { url });
    } catch (error) {
      logger.error("Error handling deep link", "AppLayout", error);
    }
  }, []);

  const initializeUser = useCallback(async (userId: string) => {
    try {
      logger.info("Initializing user with ID", "AppLayout", { userId });

      // Load user data from Redux store
      const userData = store.getState().user;

      if (userData?.currentUser) {
        logger.info("User data loaded successfully from Redux", "AppLayout");
      } else {
        logger.warn(
          "No user data found in Redux store, initializing user",
          "AppLayout"
        );

        // Try to fetch existing user first
        try {
          await store.dispatch(fetchUser(userId)).unwrap();
          logger.info("Existing user fetched successfully", "AppLayout");
        } catch (error) {
          // If user doesn't exist, create a new one
          logger.info("User not found, creating new user", "AppLayout");
          const timestamp = Date.now().toString().slice(-6); // Get last 6 digits of timestamp
          const username = `user_${userId.slice(0, 8)}_${timestamp}`;
          await store
            .dispatch(
              createUser({
                username,
                display_name: username,
                avatar_emoji: "🚀",
                usdt_balance: "100000.00",
              })
            )
            .unwrap();
        }
      }
    } catch (error) {
      logger.error("Error initializing user", "AppLayout", error);
    }
  }, []);

  const initializeBackgroundSync = useCallback(async () => {
    try {
      logger.info("Initializing background data sync service", "AppLayout");

      const syncService = BackgroundDataSyncService.getInstance();

      // Configure the sync service
      syncService.updateConfig({
        intervalMs: 30000, // 30 seconds
        maxConcurrentUpdates: 5,
        retryAttempts: 3,
        retryDelayMs: 5000,
      });

      // Start the sync service
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
