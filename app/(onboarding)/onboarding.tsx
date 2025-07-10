import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '@/styles/colors';
import GradientText from '@/components/GradientText';
import React, { useCallback, useRef, useState } from 'react';
import { createUser } from '@/features/userSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '@/utils/logger';
import { router } from 'expo-router';
import { useAppDispatch } from '@/store';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Pressable,
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

  const screens = [
    {
      id: "1",
      title: "Welcome to Trading Simulator",
      content:
        "Practice trading with virtual money in a risk-free environment.",
      image: require("../../assets/images/onboarding.png"),
    },
    {
      id: "2",
      title: "Learn & Compete",
      content: "Join trading competitions and climb the leaderboard.",
      image: require("../../assets/images/rocket.png"),
    },
    {
      id: "3",
      title: "Track Your Progress",
      content: "Monitor your portfolio performance and trading statistics.",
      image: require("../../assets/images/shield.png"),
    },
  ];

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

  const handleCreateAccount = useCallback(async () => {
    if (isCreating) return;

    setIsCreating(true);

    try {
      const username = generateUsername();
      const newUser = await dispatch(
        createUser({
          username,
          display_name: username,
          avatar_emoji: "🚀",
          usdt_balance: "100000.00",
        })
      ).unwrap();

      if (newUser) {
        // Store the user ID for future use
        await AsyncStorage.setItem("@user_id", newUser.id);
        logger.info("New user created successfully", "Onboarding", {
          username: newUser.username,
        });

        // Navigate to main app
        router.replace("/(tabs)");
      }
    } catch (error) {
      logger.error("Error creating user", "Onboarding", error);
      Alert.alert("Error", "Failed to create account. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsCreating(false);
    }
  }, [dispatch, isCreating]);

  const handleNext = useCallback(() => {
    if (currentIndex < screens.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * width,
        animated: true,
      });
    } else {
      handleCreateAccount();
    }
  }, [currentIndex, screens.length, handleCreateAccount]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={screens}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        scrollEnabled={false}
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
          colors={["#6F62D9", "#9462D9", "#7E62D9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
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
    </View>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  content: {
    fontSize: 18,
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
