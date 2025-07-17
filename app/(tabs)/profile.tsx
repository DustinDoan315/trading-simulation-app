import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '@/styles/colors';
import React, { useEffect, useState } from 'react';
import { clearSearchHistory } from '@/features/searchHistorySlice';
import { forceRefreshAllData } from '@/utils/resetUtils';
import { Ionicons } from '@expo/vector-icons';
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
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [editForm, setEditForm] = useState({
    display_name: "",
    avatar_emoji: "",
  });
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (user) {
      setEditForm({
        display_name: user.display_name || "",
        avatar_emoji: user.avatar_emoji || "🚀",
      });
      if (!lastUpdated) {
        setLastUpdated(new Date());
      }
    }
  }, [user]);

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
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setEditLoading(true);

      const updateParams = {
        id: user.id,
        display_name: editForm.display_name.trim() || undefined,
        avatar_emoji: editForm.avatar_emoji.trim() || "🚀",
      };

      await dispatch(
        updateUser({ id: user.id, params: updateParams })
      ).unwrap();

      await UserService.updateUser(user.id, updateParams);

      setEditModalVisible(false);
      Alert.alert(t("success.title"), t("profile.profileUpdatedSuccessfully"));
    } catch (error) {
      logger.error("Error updating profile", "Profile", error);
      Alert.alert(t("error.title"), t("profile.failedToUpdateProfile"));
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      display_name: user?.display_name || "",
      avatar_emoji: user?.avatar_emoji || "🚀",
    });
    setEditModalVisible(false);
    setEditLoading(false); // Ensure loading state is reset when modal closes
  };

  const handleWaiting = () => {
    Alert.alert(t("profile.comingSoon"), t("profile.comingSoonDescription"));
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
        {showChevron && !isBottom && (
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6674CC" />
          <Text style={styles.loadingText}>{t("profile.loadingProfile")}</Text>
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
                const userId = await AsyncStorage.getItem("@user_id");
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
            <SettingItem
              icon="settings-outline"
              title={t("profile.settings")}
              subtitle={t("profile.appPreferences")}
              onPress={handleWaiting}
            />
            <SettingItem
              isBottom={true}
              icon="help-circle-outline"
              title={t("profile.helpSupport")}
              subtitle={t("profile.getHelp")}
              onPress={handleWaiting}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("profile.accountManagement")}
          </Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="shield-outline"
              title={t("profile.privacySecurity")}
              subtitle={t("profile.managePrivacy")}
              onPress={handleWaiting}
            />
            <SettingItem
              icon="notifications-outline"
              title={t("profile.notifications")}
              subtitle={t("profile.manageAlerts")}
              onPress={handleWaiting}
            />
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

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelEdit}
        statusBarTranslucent={true}
        hardwareAccelerated={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("profile.editProfile")}</Text>
              <TouchableOpacity
                onPress={handleCancelEdit}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color="#9DA3B4" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t("profile.displayName")}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.display_name}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, display_name: text })
                  }
                  placeholder={t("profile.enterDisplayName")}
                  placeholderTextColor="#8F95B2"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t("profile.avatarEmoji")}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.avatar_emoji}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, avatar_emoji: text })
                  }
                  placeholder="🚀"
                  placeholderTextColor="#8F95B2"
                  maxLength={2}
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  editLoading && styles.disabledButton,
                ]}
                onPress={handleCancelEdit}
                disabled={editLoading}>
                <Text style={styles.cancelButtonText}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  editLoading && styles.disabledButton,
                ]}
                onPress={handleSaveProfile}
                disabled={editLoading}>
                {editLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>{t("profile.save")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1A1D2F",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalBody: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9DA3B4",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#131523",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#262A3F",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#9DA3B4",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#6674CC",
    alignItems: "center",
  },
  saveButtonText: {
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
