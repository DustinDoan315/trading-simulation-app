import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { TradingEducationCard } from '@/components/home/TradingEducationCard';
import { useLanguage } from '@/context/LanguageContext';
import { useLearningData } from '@/hooks/useLearningData';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


const LearnTradingScreen = () => {
  const { t } = useLanguage();
  const {
    modules,
    categories,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    error,
    overallProgress,
    completedModulesCount,
    startModule,
    completeModule,
    refreshData,
  } = useLearningData();

  const [refreshing, setRefreshing] = useState(false);

  const handleBackPress = () => {
    router.back();
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "practice":
        router.push("/(subs)/crypto-search");
        break;
      case "portfolio":
        router.push("/(tabs)/portfolio");
        break;
      case "watchlist":
        router.push("/(tabs)/watchlist");
        break;
    }
  };

  const handleModulePress = async (moduleId: string) => {
    try {
      await startModule(moduleId);

      router.push({
        pathname: "/(subs)/learning-module",
        params: { moduleId },
      });
    } catch (error) {
      Alert.alert("Error", "Failed to start module. Please try again.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getFilteredModules = () => {
    return modules.filter((module) => module.category === selectedCategory);
  };

  const getSectionTitle = () => {
    switch (selectedCategory) {
      case "basics":
        return t("learning.sections.beginnerModules");
      case "technical":
        return t("learning.sections.technicalAnalysis");
      case "advanced":
        return t("learning.sections.advancedStrategies");
      default:
        return "";
    }
  };

  const getCategoryTitle = (key: string) => {
    return t(`learning.categories.${key}`);
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading learning modules...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("learning.title")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={["#6366F1"]}
          />
        }>
        <View style={styles.welcomeSection}>
          <LinearGradient
            colors={["#1F2937", "#374151"]}
            style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <Ionicons name="school" size={48} color="#6366F1" />
              <Text style={styles.welcomeTitle}>
                {t("learning.masterCrypto")}
              </Text>
              <Text style={styles.welcomeDescription}>
                {t("learning.buildSkills")}
              </Text>

              <View style={styles.progressStats}>
                <View style={styles.progressItem}>
                  <Text style={styles.progressValue}>{overallProgress}%</Text>
                  <Text style={styles.progressLabel}>
                    {t("learning.stats.overallProgress")}
                  </Text>
                </View>
                <View style={styles.progressDivider} />
                <View style={styles.progressItem}>
                  <Text style={styles.progressValue}>
                    {completedModulesCount}
                  </Text>
                  <Text style={styles.progressLabel}>
                    {t("learning.stats.modulesCompleted")}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.categorySection}>
          <View style={styles.categoryTabs}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryTab,
                  selectedCategory === category.key && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(category.key)}>
                <Ionicons
                  name={category.icon as any}
                  size={20}
                  color={
                    selectedCategory === category.key ? "#FFFFFF" : "#9CA3AF"
                  }
                />
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === category.key &&
                      styles.categoryTabTextActive,
                  ]}>
                  {getCategoryTitle(category.key)}
                </Text>
                {category.completedCount > 0 && (
                  <View style={styles.completionBadge}>
                    <Text style={styles.completionBadgeText}>
                      {category.completedCount}/{category.moduleCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Learning Modules */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>

          {getFilteredModules().length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No modules available</Text>
            </View>
          ) : (
            getFilteredModules().map((module) => (
              <TradingEducationCard
                key={module.id}
                title={module.title}
                description={module.description}
                icon={module.icon}
                gradientColors={module.gradientColors}
                difficulty={module.difficulty}
                duration={module.duration}
                progress={module.progress}
                isCompleted={module.isCompleted}
                onPress={() => handleModulePress(module.id)}
              />
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>
            {t("learning.readyToPractice")}
          </Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => handleQuickAction("practice")}>
              <LinearGradient
                colors={["#6366F1", "#8B5CF6"]}
                style={styles.quickActionGradient}>
                <Ionicons name="play" size={24} color="white" />
                <Text style={styles.quickActionTitle}>
                  {t("learning.startTrading")}
                </Text>
                <Text style={styles.quickActionSubtitle}>
                  {t("learning.practiceWhatYouLearned")}
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
                <Text style={styles.quickActionTitle}>
                  {t("learning.viewPortfolio")}
                </Text>
                <Text style={styles.quickActionSubtitle}>
                  {t("learning.trackYourProgress")}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 16,
    marginTop: 16,
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
    marginBottom: 24,
  },
  progressStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  progressItem: {
    flex: 1,
    alignItems: "center",
  },
  progressValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#6366F1",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(99, 102, 241, 0.3)",
    marginHorizontal: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: "#EF4444",
    fontSize: 14,
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
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
    position: "relative",
  },
  categoryTabActive: {
    backgroundColor: "#6366F1",
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  categoryTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  completionBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#10B981",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
  },
  completionBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  modulesSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: "#9CA3AF",
    fontSize: 16,
    marginTop: 16,
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
    minHeight: 100,
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
    fontWeight: "600",
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
