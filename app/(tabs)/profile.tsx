import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '@/styles/colors';
import React, { useEffect, useState } from 'react';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import { ASYNC_STORAGE_KEYS } from '@/utils/constant';
import { clearSearchHistory } from '@/features/searchHistorySlice';
import { forceRefreshAllData } from '@/utils/resetUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '@/utils/logger';
import { persistor } from '@/store';
import { resetBalance } from '@/features/balanceSlice';
import { resetFavorites } from '@/features/favoritesSlice';
import { router } from 'expo-router';
import { updateUser } from '@/features/userSlice';
import { useAppDispatch } from '@/store';
import { useLanguage } from '@/context/LanguageContext';
import { useRealTimeBalance } from '@/hooks/useRealTimeBalance';
import { UserService } from '@/services/UserService';
import { useTransactionCount } from '@/hooks/useTransactionCount';
import { useUser } from '@/context/UserContext';
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


const ProfileScreen = () => {
  const dispatch = useAppDispatch();
  const { user, userStats, loading, error, refreshUser } = useUser();
  const { t } = useLanguage();
  const {
    totalBalance,
    totalPnL,
    totalPnLPercentage,
    formattedTotalBalance,
    formattedTotalPnL,
    formattedTotalPnLPercentage,
    userRank,
    isLoading: realTimeLoading,
    refresh: refreshRealTimeData,
  } = useRealTimeBalance();

  const { transactionCount, loading: transactionCountLoading } =
    useTransactionCount(user?.id);

  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (user && !lastUpdated) {
      setLastUpdated(new Date());
    }
  }, [user, lastUpdated]);

  const handleRefresh = async () => {
    if (!user?.id) return;

    setRefreshing(true);
    try {
      await refreshRealTimeData();

      await refreshUser(user.id);

      setLastUpdated(new Date());

      logger.info("Profile data refreshed successfully", "Profile");
    } catch (error) {
      logger.error("Error refreshing profile data", "Profile", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditProfile = () => {
    if (!user) return;
    
    // Navigate to dedicated edit profile screen
    router.push({
      pathname: "/(modals)/edit-profile" as any,
      params: {
        userId: user.id,
        display_name: user.display_name || "",
        avatar_emoji: user.avatar_emoji || "🚀",
      },
    });
  };



  const handleResetData = async () => {
    if (!user?.id) return;
    Alert.alert(
      t("balance.resetConfirmTitle") || "Reset All Data",
      t("balance.resetConfirmMessage") ||
        "Are you sure you want to reset your balance to $100,000?",
      [
        {
          text: t("common.cancel") || "Cancel",
          style: "cancel",
        },
        {
          text: t("common.confirm") || "Confirm",
          style: "destructive",
          onPress: async () => {
            setResetting(true);
            try {
              // Reset Redux state
              dispatch(resetBalance());
              dispatch(resetFavorites());
              dispatch(clearSearchHistory());

              // Reset cloud data but preserve user identity
              const resetResult = await UserService.resetUserDataToDefault(
                user.id
              );

              if (resetResult.success) {
                try {
                  // Refresh local data without clearing user ID
                  await forceRefreshAllData(user.id, dispatch, refreshUser);
                } catch (refreshError) {
                  logger.warn(
                    "Error refreshing data after reset",
                    "Profile",
                    refreshError
                  );
                }
                // Purge persisted state after successful reset
                await persistor.purge();
                Alert.alert(
                  t("balance.resetSuccess") || "Reset Successful",
                  t("balance.resetSuccessMessage") ||
                    "Your balance has been reset to $100,000"
                );
              } else {
                logger.error("Reset failed", "Profile", resetResult.error);
                Alert.alert(
                  t("balance.resetError") || "Reset Failed",
                  resetResult.error ||
                    t("balance.resetErrorMessage") ||
                    "An error occurred during reset"
                );
              }
            } catch (error) {
              logger.error("Error during user data reset", "Profile", error);
              Alert.alert(
                t("balance.resetError") || "Reset Failed",
                t("balance.resetErrorMessage") ||
                  "An unexpected error occurred during reset"
              );
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showChevron = true,
    isBottom = false,
  }: any) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        {
          borderBottomWidth: isBottom ? 0 : 1,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {showChevron && (
          <Ionicons name="chevron-forward" size={16} color="#9DA3B4" />
        )}
      </View>
    </TouchableOpacity>
  );

  const StatsCard = ({
    title,
    value,
    subtitle,
    color = colors.text.primary,
    icon,
    isLoading = false,
    isCenter = false,
  }: any) => (
    <View
      style={[
        styles.statCard,
        {
          alignItems: isCenter ? "center" : "flex-start",
        },
      ]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={[styles.statTitle, { color }]}>{title}</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={color}
          style={styles.statLoading}
        />
      ) : (
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      )}
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading || realTimeLoading || transactionCountLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <ShimmerPlaceHolder
              LinearGradient={LinearGradient}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                marginBottom: 16,
              }}
            />
          </View>
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{ width: 120, height: 28, borderRadius: 8, marginBottom: 8 }}
          />
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{ width: 80, height: 16, borderRadius: 6, marginBottom: 8 }}
          />
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{
              width: 100,
              height: 14,
              borderRadius: 6,
              marginBottom: 16,
            }}
          />
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statsHeader}>
            <ShimmerPlaceHolder
              LinearGradient={LinearGradient}
              style={{
                width: 160,
                height: 20,
                borderRadius: 8,
                marginBottom: 16,
              }}
            />
          </View>
          <View style={styles.statsGrid}>
            {[1, 2, 3].map((_, idx) => (
              <View key={idx} style={styles.statCard}>
                <ShimmerPlaceHolder
                  LinearGradient={LinearGradient}
                  style={{
                    width: 60,
                    height: 16,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                />
                <ShimmerPlaceHolder
                  LinearGradient={LinearGradient}
                  style={{
                    width: 40,
                    height: 24,
                    borderRadius: 8,
                    marginBottom: 4,
                  }}
                />
                <ShimmerPlaceHolder
                  LinearGradient={LinearGradient}
                  style={{ width: 60, height: 12, borderRadius: 6 }}
                />
              </View>
            ))}
          </View>
        </View>
        <View style={styles.portfolioCard}>
          <View style={styles.portfolioHeader}>
            <ShimmerPlaceHolder
              LinearGradient={LinearGradient}
              style={{ width: 24, height: 20, borderRadius: 8, marginRight: 8 }}
            />
            <ShimmerPlaceHolder
              LinearGradient={LinearGradient}
              style={{ width: 100, height: 16, borderRadius: 8 }}
            />
          </View>
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{
              width: 120,
              height: 32,
              borderRadius: 12,
              marginBottom: 4,
            }}
          />
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{ width: 100, height: 14, borderRadius: 6 }}
          />
        </View>
        <View style={styles.section}>
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{
              width: 180,
              height: 20,
              borderRadius: 8,
              marginBottom: 16,
            }}
          />
          <View style={styles.settingsGroup}>
            {[1, 2, 3, 4].map((_, idx) => (
              <View key={idx} style={styles.settingItem}>
                <ShimmerPlaceHolder
                  LinearGradient={LinearGradient}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    marginRight: 14,
                  }}
                />
                <View style={styles.settingContent}>
                  <ShimmerPlaceHolder
                    LinearGradient={LinearGradient}
                    style={{
                      width: 100,
                      height: 16,
                      borderRadius: 8,
                      marginBottom: 4,
                    }}
                  />
                  <ShimmerPlaceHolder
                    LinearGradient={LinearGradient}
                    style={{ width: 120, height: 13, borderRadius: 6 }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{
              width: 180,
              height: 20,
              borderRadius: 8,
              marginBottom: 16,
            }}
          />
          <View style={styles.settingsGroup}>
            {[1, 2, 3, 4].map((_, idx) => (
              <View key={idx} style={styles.settingItem}>
                <ShimmerPlaceHolder
                  LinearGradient={LinearGradient}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    marginRight: 14,
                  }}
                />
                <View style={styles.settingContent}>
                  <ShimmerPlaceHolder
                    LinearGradient={LinearGradient}
                    style={{
                      width: 100,
                      height: 16,
                      borderRadius: 8,
                      marginBottom: 4,
                    }}
                  />
                  <ShimmerPlaceHolder
                    LinearGradient={LinearGradient}
                    style={{ width: 120, height: 13, borderRadius: 6 }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t("profile.userNotFound")}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={async () => {
              try {
                const userId = await AsyncStorage.getItem(
                  ASYNC_STORAGE_KEYS.USER_ID
                );
                if (userId) {
                  await refreshUser(userId);
                }
              } catch (error) {
                logger.error("Failed to reload user", "Profile", error);
              }
            }}>
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6674CC"
            colors={["#6674CC"]}
          />
        }>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.avatar_emoji || "🚀"}</Text>
            </View>
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={handleEditProfile}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{user.display_name || user.username}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.joinDate}>
            {t("profile.memberSince", {
              date: new Date(user.join_date).toLocaleDateString(),
            })}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsSectionTitle}>
              {t("profile.tradingStatistics")}
            </Text>
          </View>
          <View style={styles.statsGrid}>
            <StatsCard
              title={t("profile.totalTrades")}
              value={transactionCount}
              subtitle={t("profile.trades")}
              color="#6674CC"
              icon="trending-up"
            />
            <StatsCard
              title={t("profile.globalRank")}
              value={userRank ? `#${userRank}` : "N/A"}
              subtitle={t("profile.position")}
              color="#FF9500"
              icon="star"
              isLoading={refreshing}
            />

            <StatsCard
              title={t("profile.totalPnL")}
              value={formattedTotalPnL}
              subtitle={formattedTotalPnLPercentage}
              color={totalPnL >= 0 ? "#10BA68" : "#F9335D"}
              icon="wallet"
              isCenter={true}
            />
          </View>
        </View>

        <View style={styles.portfolioCard}>
          <View style={styles.portfolioHeader}>
            <Ionicons name="pie-chart" size={20} color="#6674CC" />
            <Text style={styles.portfolioTitle}>
              {t("profile.portfolioValue")}
            </Text>
          </View>
          <Text style={styles.portfolioValue}>{formattedTotalBalance}</Text>
          <Text style={styles.portfolioSubtitle}>
            {t("profile.realTimePortfolioValue")}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("profile.accountInformation")}
          </Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="trending-up-outline"
              title={t("profile.tradingHistory")}
              subtitle={t("profile.viewYourPastTrades")}
              onPress={() => router.push("/trading-history" as any)}
            />
            <SettingItem
              icon="trophy-outline"
              title={t("profile.leaderboard")}
              subtitle={t("profile.seeYourRanking")}
              onPress={() => router.push("/leaderboard" as any)}
            />

          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("profile.accountManagement")}
          </Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="language-outline"
              title={t("profile.language")}
              subtitle={t("profile.changeLanguage")}
              onPress={() => router.push("/language" as any)}
            />
            <SettingItem
              isBottom={true}
              icon="refresh-outline"
              title={t("profile.resetData")}
              subtitle={t("profile.resetToDefault")}
              onPress={handleResetData}
            />
          </View>
        </View>
        {lastUpdated && (
          <Text style={styles.lastUpdatedText}>
            {t("profile.lastUpdated", {
              time: lastUpdated.toLocaleTimeString(),
            })}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131523",
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1A1D2F",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#6674CC",
  },
  avatarText: {
    fontSize: 48,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6674CC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#131523",
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  username: {
    fontSize: 16,
    color: "#9DA3B4",
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: "#8F95B2",
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#1A1D2F",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#6674CC",
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6674CC",
    marginLeft: 6,
  },

  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statsSectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  refreshButton: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "47%",
    maxWidth: "75%",
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    alignSelf: "center",
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 11,
    color: "#8F95B2",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  portfolioCard: {
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  portfolioHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  portfolioTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9DA3B4",
    marginLeft: 8,
  },
  portfolioValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  portfolioSubtitle: {
    fontSize: 14,
    color: "#8F95B2",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  settingsGroup: {
    backgroundColor: "#1A1D2F",
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2E42",
  },
  settingLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#131523",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  settingSubtitle: {
    fontSize: 13,
    color: "#9DA3B4",
    marginTop: 2,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#131523",
  },
  loadingText: {
    fontSize: 18,
    color: "#FFFFFF",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#131523",
  },
  errorText: {
    fontSize: 18,
    color: "#F9335D",
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#6674CC",
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  statLoading: {
    marginTop: 8,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: "#8F95B2",
    textAlign: "center",
    marginTop: 12,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2E42",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginLeft: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default ProfileScreen;
