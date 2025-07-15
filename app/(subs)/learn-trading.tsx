import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { TradingEducationCard } from '@/components/home/TradingEducationCard';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const LearnTradingScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState<
    "basics" | "technical" | "advanced"
  >("basics");

  const handleBackPress = () => {
    router.back();
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "practice":
        // router.push("/(subs)/crypto-search");
        break;
      case "portfolio":
        router.push("/(tabs)/portfolio");
        break;
      case "watchlist":
        router.push("/(tabs)/watchlist");
        break;
    }
  };

  const learningModules = {
    basics: [
      {
        title: "Crypto Trading Basics",
        description:
          "Learn the fundamentals of cryptocurrency trading, including market orders, limit orders, and risk management.",
        icon: "school",
        gradientColors: ["#6366F1", "#8B5CF6"],
        difficulty: "Beginner",
        duration: "10 min",
        progress: 0,
        isCompleted: false,
      },
      {
        title: "Understanding Market Orders",
        description:
          "Master the different types of market orders and when to use each one for optimal trading.",
        icon: "trending-up",
        gradientColors: ["#8B5CF6", "#EC4899"],
        difficulty: "Beginner",
        duration: "8 min",
        progress: 0,
        isCompleted: false,
      },
      {
        title: "Risk Management Fundamentals",
        description:
          "Learn essential risk management strategies to protect your capital and maximize returns.",
        icon: "shield-checkmark",
        gradientColors: ["#EC4899", "#F59E0B"],
        difficulty: "Beginner",
        duration: "12 min",
        progress: 0,
        isCompleted: false,
      },
    ],
    technical: [
      {
        title: "Technical Analysis",
        description:
          "Master chart patterns, indicators, and technical analysis tools to make informed trading decisions.",
        icon: "analytics",
        gradientColors: ["#6366F1", "#8B5CF6"],
        difficulty: "Intermediate",
        duration: "15 min",
        progress: 0,
        isCompleted: false,
      },
      {
        title: "Chart Patterns & Trends",
        description:
          "Identify key chart patterns and trend analysis techniques for better entry and exit points.",
        icon: "bar-chart",
        gradientColors: ["#8B5CF6", "#EC4899"],
        difficulty: "Intermediate",
        duration: "18 min",
        progress: 0,
        isCompleted: false,
      },
      {
        title: "Trading Indicators",
        description:
          "Learn to use popular trading indicators like RSI, MACD, and moving averages effectively.",
        icon: "speedometer",
        gradientColors: ["#EC4899", "#F59E0B"],
        difficulty: "Intermediate",
        duration: "20 min",
        progress: 0,
        isCompleted: false,
      },
    ],
    advanced: [
      {
        title: "Advanced Trading Strategies",
        description:
          "Explore advanced trading strategies including scalping, swing trading, and position sizing.",
        icon: "rocket",
        gradientColors: ["#6366F1", "#8B5CF6"],
        difficulty: "Advanced",
        duration: "25 min",
        progress: 0,
        isCompleted: false,
      },
      {
        title: "Portfolio Management",
        description:
          "Learn advanced portfolio management techniques and diversification strategies.",
        icon: "pie-chart",
        gradientColors: ["#8B5CF6", "#EC4899"],
        difficulty: "Advanced",
        duration: "22 min",
        progress: 0,
        isCompleted: false,
      },
      {
        title: "Psychology of Trading",
        description:
          "Master the psychological aspects of trading and develop emotional discipline.",
        icon: "brain",
        gradientColors: ["#EC4899", "#F59E0B"],
        difficulty: "Advanced",
        duration: "30 min",
        progress: 0,
        isCompleted: false,
      },
    ],
  };

  const categories = [
    { key: "basics", title: "Basics", icon: "school" },
    { key: "technical", title: "Technical", icon: "analytics" },
    { key: "advanced", title: "Advanced", icon: "rocket" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learn Trading</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <LinearGradient
            colors={["#1F2937", "#374151"]}
            style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <Ionicons name="school" size={48} color="#6366F1" />
              <Text style={styles.welcomeTitle}>Master Crypto Trading</Text>
              <Text style={styles.welcomeDescription}>
                Build your trading skills with our comprehensive learning
                modules designed for all experience levels.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Category Tabs */}
        <View style={styles.categorySection}>
          <View style={styles.categoryTabs}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryTab,
                  selectedCategory === category.key && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(category.key as any)}>
                <Ionicons
                  name={category.icon as any}
                  size={20}
                  color={
                    selectedCategory === category.key ? "#6366F1" : "#9CA3AF"
                  }
                />
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === category.key &&
                      styles.categoryTabTextActive,
                  ]}>
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Learning Modules */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === "basics" && "Beginner Modules"}
            {selectedCategory === "technical" && "Technical Analysis"}
            {selectedCategory === "advanced" && "Advanced Strategies"}
          </Text>

          {learningModules[selectedCategory].map((module, index) => (
            <TradingEducationCard
              key={index}
              title={module.title}
              description={module.description}
              icon={module.icon}
              gradientColors={module.gradientColors}
              difficulty={module.difficulty}
              duration={module.duration}
              onPress={() => handleQuickAction("practice")}
            />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Ready to Practice?</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => handleQuickAction("practice")}>
              <LinearGradient
                colors={["#6366F1", "#8B5CF6"]}
                style={styles.quickActionGradient}>
                <Ionicons name="play" size={24} color="white" />
                <Text style={styles.quickActionTitle}>Start Trading</Text>
                <Text style={styles.quickActionSubtitle}>
                  Practice what you learned
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => handleQuickAction("portfolio")}>
              <LinearGradient
                colors={["#8B5CF6", "#EC4899"]}
                style={styles.quickActionGradient}>
                <Ionicons name="pie-chart" size={24} color="white" />
                <Text style={styles.quickActionTitle}>View Portfolio</Text>
                <Text style={styles.quickActionSubtitle}>
                  Track your progress
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(99, 102, 241, 0.2)",
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  welcomeCard: {
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
    elevation: 12,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  welcomeContent: {
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  welcomeDescription: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
  },
  categorySection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  categoryTabs: {
    flexDirection: "row",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 16,
    padding: 4,
  },
  categoryTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  categoryTabActive: {
    backgroundColor: "#6366F1",
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  categoryTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  modulesSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  quickActionsSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  quickActionCard: {
    flex: 1,
    height: 100,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quickActionGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "white",
    marginTop: 8,
    textAlign: "center",
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default LearnTradingScreen;
