import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  Image,
} from "react-native";
import GradientText from "@/components/GradientText";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const screens = [
    {
      id: "1",
      title: "Property",
      content: "Diversity",
      image: require("../../assets/images/candle.png"),
    },
    {
      id: "2",
      title: "Safe",
      content: "Security",
      image: require("../../assets/images/shield.png"),
    },
    {
      id: "3",
      title: "Convenient",
      content: "Transaction",
      image: require("../../assets/images/rocket.png"),
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

      <Text style={styles.content}>{item.title}</Text>

      <GradientText text={item.content} />
    </View>
  );

  const handleNext = useCallback(() => {
    if (currentIndex === screens.length - 1) {
      router.replace("/(auth)/import-wallet");
    }
  }, [currentIndex]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={screens}
        renderItem={renderItem}
        horizontal
        pagingEnabled
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
          backgroundColor: "#000000",
        }}>
        <LinearGradient
          style={styles.createBtnLinear}
          colors={
            currentIndex == 2
              ? ["#8AD4EC", "#EF96FF", "#FF56A9", "#FFAA6C"]
              : ["#d3d3d3", "#d3d3d3"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          locations={[0, 0.22, 0.54, 0.85, 1]}>
          <Pressable onPress={handleNext} style={styles.createBtn}>
            <Text style={styles.buttonText}>Create New Wallet</Text>
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
  },
  screen: {
    width,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  content: {
    fontSize: 28,
    textAlign: "center",
    color: "#FFFFFF",
    marginTop: 40,
    marginBottom: 5,
  },
  dotContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 100,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#d3d3d3",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#007BFF",
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
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default OnboardingScreen;
