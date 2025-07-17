import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/context/LanguageContext';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


interface DailyLimitPopupProps {
  visible: boolean;
  onClose: () => void;
  usedTransactions: number;
  dailyLimit: number;
  remainingTransactions: number;
}

const { width: screenWidth } = Dimensions.get("window");

const DailyLimitPopup: React.FC<DailyLimitPopupProps> = ({
  visible,
  onClose,
  usedTransactions,
  dailyLimit,
  remainingTransactions,
}) => {
  const { t } = useLanguage();

  const progressPercentage = (usedTransactions / dailyLimit) * 100;

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.overlayTouchable}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.contentContainer}>
            <LinearGradient
              colors={["#FF6B6B", "#FF8E8E"]}
              style={styles.header}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>⚠️</Text>
              </View>
              <Text style={styles.title}>{t("chart.dailyLimitReached")}</Text>
              <Text style={styles.subtitle}>
                {t("chart.dailyLimitSubtitle")}
              </Text>
            </LinearGradient>

            <View style={styles.content}>
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>
                    {t("chart.transactionsUsed")}
                  </Text>
                  <Text style={styles.progressValue}>
                    {usedTransactions}/{dailyLimit}
                  </Text>
                </View>

                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={["#FF6B6B", "#FF8E8E"]}
                      style={[
                        styles.progressFill,
                        { width: `${progressPercentage}%` },
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{usedTransactions}</Text>
                  <Text style={styles.statLabel}>{t("chart.usedToday")}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{remainingTransactions}</Text>
                  <Text style={styles.statLabel}>{t("chart.remaining")}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{dailyLimit}</Text>
                  <Text style={styles.statLabel}>{t("chart.dailyLimit")}</Text>
                </View>
              </View>

              <View style={styles.messageContainer}>
                <Text style={styles.message}>
                  {t("chart.dailyLimitMessage")}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={onClose}
              activeOpacity={0.8}>
              <LinearGradient
                colors={["#6674CC", "#8B9DFF"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                <Text style={styles.buttonText}>{t("chart.understood")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(54, 48, 48, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20000,
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  container: {
    backgroundColor: "#1A1D2F",
    overflow: "hidden",
    shadowColor: "#FF6B6B",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  content: {
    padding: 24,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    color: "#9DA3B4",
    fontWeight: "500",
  },
  progressValue: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#2A2D3E",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: "#2A2D3E",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9DA3B4",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#3A3D4E",
    marginHorizontal: 8,
  },
  messageContainer: {
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  message: {
    fontSize: 14,
    color: "#FFB3B3",
    lineHeight: 20,
    textAlign: "center",
  },
  actionButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    margin: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

export default DailyLimitPopup;
