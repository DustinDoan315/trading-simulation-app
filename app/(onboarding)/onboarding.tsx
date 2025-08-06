import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '@/styles/colors';
import GradientText from '@/components/GradientText';
import UUIDService from '@/services/UUIDService';
import { createUser, fetchUser } from '@/features/userSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '@/utils/logger';
import { router } from 'expo-router';
import { store, useAppDispatch } from '@/store';
import { useCallback, useRef, useState } from 'react';
import {
  ASYNC_STORAGE_KEYS,
  DEFAULT_USER,
  ONBOARDING_SCREENS,
  USERNAME_GENERATION,
} from "@/utils/constant";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";


const { width } = Dimensions.get("window");

const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const dispatch = useAppDispatch();

  const screens = ONBOARDING_SCREENS;

  const renderItem = ({
    item,
  }: {
    item: { id: string; title: string; content: string; image: any };
  }) => (
    <View style={styles.screen}>
      <Image
        source={item.image}
        style={{
          width: "80%",
          height: 295,
        }}
        resizeMode="contain"
      />
      <GradientText text={item.title} />
      <Text style={styles.content}>{item.content}</Text>
    </View>
  );

  const generateUsername = () => {
    const adjectives = USERNAME_GENERATION.ADJECTIVES;
    const nouns = USERNAME_GENERATION.NOUNS;
    const randomNum = Math.floor(Math.random() * 1000);

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${adjective}${noun}${randomNum}`;
  };

  const markOnboardingCompleted = useCallback(async (userId: string) => {
    try {
      await AsyncStorage.setItem(
        ASYNC_STORAGE_KEYS.ONBOARDING_COMPLETED,
        "true"
      );
      logger.info("Onboarding marked as completed");

      const saved = await AsyncStorage.getItem(
        ASYNC_STORAGE_KEYS.ONBOARDING_COMPLETED
      );
      logger.info("Verification - onboarding status saved:", "Onboarding", {
        saved,
        userId,
      });
    } catch (error) {
      logger.error(
        "Error marking onboarding as completed",
        "Onboarding",
        error
      );
      Alert.alert("Error", "Failed to mark onboarding as completed", [
        { text: "OK" },
      ]);
    }
  }, []);

  const handleCreateAccount = useCallback(async () => {
    if (isCreating) return;

    setIsCreating(true);

    try {
      // Get the existing user ID from UUIDService instead of creating a new one
      const existingUserId = await UUIDService.getOrCreateUser();

      logger.info("Starting account creation process", "Onboarding", {
        existingUserId,
      });

      // Check if user already exists in Redux store
      const userData = store.getState().user;

      if (userData?.currentUser) {
        logger.info(
          "User already exists in Redux store, skipping creation",
          "Onboarding",
          {
            userId: userData.currentUser.id,
            username: userData.currentUser.username,
          }
        );
        await markOnboardingCompleted(userData.currentUser.id);
        router.replace("/(tabs)");
        return;
      }

      // Try to fetch existing user from database
      try {
        await store.dispatch(fetchUser(existingUserId)).unwrap();
        logger.info(
          "Existing user fetched successfully from database",
          "Onboarding",
          {
            userId: existingUserId,
          }
        );
        await markOnboardingCompleted(existingUserId);
        router.replace("/(tabs)");
        return;
      } catch (error) {
        logger.info(
          "User not found in database, creating new user",
          "Onboarding",
          {
            userId: existingUserId,
          }
        );
      }

      // Create user with the existing UUID
      const username = generateUsername();
      logger.info("Creating new user with existing UUID", "Onboarding", {
        userId: existingUserId,
        username,
      });

      const newUser = await dispatch(
        createUser({
          id: existingUserId, // Use the existing UUID
          username,
          display_name: username,
          avatar_emoji: DEFAULT_USER.AVATAR_EMOJI,
          usdt_balance: DEFAULT_USER.INITIAL_BALANCE,
        })
      ).unwrap();

      if (newUser) {
        await markOnboardingCompleted(newUser.id);

        logger.info(
          "New user created successfully with existing UUID",
          "Onboarding",
          {
            username: newUser.username,
            userId: newUser.id,
          }
        );

        router.replace("/(tabs)");
      } else {
        throw new Error("Failed to create user - no user returned");
      }
    } catch (error) {
      logger.error("Error creating user", "Onboarding", { error });
      Alert.alert("Error", "Failed to create account. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsCreating(false);
    }
  }, [dispatch, isCreating, markOnboardingCompleted]);

  const handleNext = useCallback(async () => {
    if (currentIndex < screens.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * width,
        animated: true,
      });
    } else {
      // Always use the existing user ID from UUIDService
      const existingUserId = await UUIDService.getOrCreateUser();

      logger.info("Handling onboarding completion", "Onboarding", {
        currentIndex,
        existingUserId,
        isLastScreen: currentIndex === screens.length - 1,
      });

      // Check if user already exists in Redux store
      const userData = store.getState().user;

      if (userData?.currentUser) {
        logger.info(
          "User already exists in Redux store, completing onboarding",
          "Onboarding",
          {
            userId: userData.currentUser.id,
          }
        );
        await markOnboardingCompleted(userData.currentUser.id);
        router.replace("/(tabs)");
      } else {
        // Create account with existing UUID
        logger.info("Creating account with existing UUID", "Onboarding", {
          existingUserId,
        });
        handleCreateAccount();
      }
    }
  }, [
    currentIndex,
    screens.length,
    handleCreateAccount,
    markOnboardingCompleted,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={screens}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        // scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      <View style={styles.dotContainer}>
        {screens.map((_, index) => (
          <Pressable
            key={index}
            style={[styles.dot, currentIndex === index && styles.activeDot]}
            onPress={() => {
              flatListRef.current?.scrollToOffset({
                offset: index * width,
                animated: true,
              });
              setCurrentIndex(index);
            }}
          />
        ))}
      </View>

      <View
        style={{
          width: "100%",
          alignItems: "center",
          backgroundColor: colors.background.primary,
        }}>
        <LinearGradient
          style={styles.createBtnLinear}
          colors={["#6366F1", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, 0.22, 0.54, 0.85, 1]}>
          <Pressable
            onPress={handleNext}
            style={[styles.createBtn, isCreating && styles.createBtnDisabled]}
            disabled={isCreating}>
            <Text style={styles.buttonText}>
              {isCreating
                ? "Creating Account..."
                : currentIndex === screens.length - 1
                ? "Get Started"
                : "Next"}
            </Text>
          </Pressable>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.primary,
  },
  screen: {
    width,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  content: {
    fontSize: 14,
    textAlign: "center",
    color: "#d3d3d3",
    marginTop: 20,
    marginBottom: 5,
    paddingHorizontal: 40,
  },
  dotContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 120,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#d3d3d3",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#6F62D9",
  },
  createBtnLinear: {
    borderRadius: 80,
    marginVertical: 10,
    width: "85%",
  },
  createBtn: {
    padding: 15,
    alignItems: "center",
  },
  createBtnDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default OnboardingScreen;
