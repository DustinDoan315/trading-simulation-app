import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LeaderboardService from '@/services/LeaderboardService';
import RealTimeDataService from '@/services/RealTimeDataService';
import scheduler from '@/utils/scheduler';
import Toast from 'react-native-toast-message';
import { createUser, fetchUser } from '@/features/userSlice';
import { LanguageProvider } from '@/context/LanguageContext';
import { NotificationProvider } from '@/components/ui/Notification';
import { Provider } from 'react-redux';
import { SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { store } from '../store';
import { updateDailyBalance } from '@/utils/balanceUpdater';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useEffect } from 'react';
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
    const initializeApp = async () => {
      if (loaded) {
        SplashScreen.hideAsync();

        // Initialize daily balance update at midnight UTC
        scheduler.addDailyTask("daily-balance-update", updateDailyBalance, 0);

        // Check if user exists and initialize if needed
        await initializeUser();

        // Set up deep link handling
        setupDeepLinking();

        return () => {
          scheduler.clear();
          // Stop real-time data services when app is unmounted
          RealTimeDataService.getInstance().stopUpdates();
          LeaderboardService.getInstance().cleanup();
        };
      }
    };
    initializeApp();
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

  const handleDeepLink = (url: string) => {
    try {
      const parsed = Linking.parse(url);

      if (parsed.hostname === "join-collection") {
        const { code, name } = parsed.queryParams || {};
        if (code) {
          // Navigate to join collection modal with parameters
          const router = require("expo-router").router;
          router.push({
            pathname: "/(modals)/join-collection",
            params: { code, name },
          });
        }
      }
    } catch (error) {
      console.error("Error handling deep link:", error);
    }
  };

  const initializeUser = async () => {
    try {
      // Use UUIDService to get or create user
      const { default: UUIDService } = await import("@/services/UUIDService");
      const userId = await UUIDService.getOrCreateUser();

      console.log("🔄 Initializing user with ID:", userId);

      // Store the user ID for Redux compatibility
      await AsyncStorage.setItem("@user_id", userId);

      // Try to fetch user data from Redux store
      try {
        await store.dispatch(fetchUser(userId)).unwrap();
        console.log("✅ User data loaded successfully from Redux");
      } catch (error) {
        console.warn(
          "⚠️ Failed to load user from Redux, user may not exist in database yet:",
          error
        );
        // This is okay - the user exists in UUIDService but may not be in the Redux database yet
        // The app can still function with the UUIDService user
      }
    } catch (error) {
      console.error("❌ Error initializing user:", error);
    }
  };

  const generateUsername = () => {
    const adjectives = [
      "Crypto",
      "Trading",
      "Digital",
      "Smart",
      "Pro",
      "Elite",
      "Master",
      "Legend",
    ];
    const nouns = [
      "Trader",
      "Investor",
      "Hodler",
      "Whale",
      "Shark",
      "Guru",
      "Ninja",
      "Wizard",
    ];
    const randomNum = Math.floor(Math.random() * 1000);

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${adjective}${noun}${randomNum}`;
  };

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
