import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useLearningData } from '@/hooks/useLearningData';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


const LearningModuleScreen = () => {
  const { t } = useLanguage();
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const { modules, updateProgress, completeModule } = useLearningData();

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const module = modules.find((m) => m.id === moduleId);

  useEffect(() => {
    if (module) {
      setProgress(module.progress);
    }
  }, [module]);

  const handleBackPress = () => {
    router.back();
  };

  const handleNextStep = async () => {
    if (!module) return;

    const newStep = currentStep + 1;
    const newProgress = Math.min(100, (newStep / 3) * 100);

    setCurrentStep(newStep);
    setProgress(newProgress);

    try {
      await updateProgress(module.id, newProgress);

      if (newProgress >= 100) {
        Alert.alert(
          "Module Completed!",
          "Congratulations! You've completed this module.",
          [{ text: "Continue", onPress: () => router.back() }]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update progress. Please try again.");
    }
  };

  const handleCompleteModule = async () => {
    if (!module) return;

    setIsLoading(true);
    try {
      await completeModule(module.id, 90);
      Alert.alert(
        "Module Completed!",
        "Great job! You've successfully completed this module.",
        [{ text: "Continue", onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to complete module. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!module) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading module...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const steps = [
    {
      title: "Introduction",
      content:
        "Welcome to this learning module. Let's get started with the fundamentals.",
      icon: "book",
    },
    {
      title: "Core Concepts",
      content:
        "Here we'll explore the key concepts and principles you need to understand.",
      icon: "bulb",
    },
    {
      title: "Practice",
      content:
        "Time to put your knowledge to the test with some practical exercises.",
      icon: "fitness",
    },
  ];

  const currentStepData = steps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{module.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.moduleHeader}>
          <LinearGradient
            colors={module.gradientColors}
            style={styles.moduleCard}>
            <View style={styles.moduleContent}>
              <View style={styles.iconContainer}>
                <Ionicons name={module.icon as any} size={48} color="white" />
              </View>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <Text style={styles.moduleDescription}>{module.description}</Text>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>
              Step {currentStep + 1} of {steps.length}
            </Text>
            <Text style={styles.stepSubtitle}>{currentStepData.title}</Text>
          </View>

          <View style={styles.stepContent}>
            <View style={styles.stepIconContainer}>
              <Ionicons
                name={currentStepData.icon as any}
                size={32}
                color="#6366F1"
              />
            </View>
            <Text style={styles.stepContentText}>
              {currentStepData.content}
            </Text>
          </View>
        </View>

        <View style={styles.navigationSection}>
          {currentStep < steps.length - 1 ? (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextStep}>
              <LinearGradient
                colors={module.gradientColors}
                style={styles.nextButtonGradient}>
                <Text style={styles.nextButtonText}>Next Step</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteModule}
              disabled={isLoading}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.completeButtonGradient}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Text style={styles.completeButtonText}>
                      Complete Module
                    </Text>
                    <Ionicons name="checkmark" size={20} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
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
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  moduleHeader: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  moduleCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  moduleContent: {
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  moduleTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
  },
  moduleDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    minWidth: 40,
  },
  stepSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  stepHeader: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepContent: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  stepIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  stepContentText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 24,
  },
  navigationSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  nextButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  completeButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  completeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
});

export default LearningModuleScreen;
