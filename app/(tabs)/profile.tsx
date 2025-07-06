import AsyncStorage from "@react-native-async-storage/async-storage";
import colors from "@/styles/colors";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ResetService } from "@/services/ResetService";
import { updateUser } from "@/features/userSlice";
import { useAppDispatch } from "@/store";
import { UserService } from "@/services/UserService";
import { useUser } from "@/context/UserContext";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ProfileScreen = () => {
  const dispatch = useAppDispatch();
  const { user, userStats, userSettings, loading, error, logout, refreshUser } =
    useUser();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(true);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Initialize settings when component mounts
  useEffect(() => {
    if (userSettings) {
      setNotificationsEnabled(userSettings.notifications_enabled);
      setPriceAlertsEnabled(userSettings.price_alerts_enabled);
      setBalanceHidden(userSettings.balance_hidden);
    }
  }, [userSettings]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => logout() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => console.log("Delete account"),
        },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      "Reset App & Create New User",
      "This will completely reset the app and create a new user with fresh data. All current data will be lost. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset App",
          style: "destructive",
          onPress: async () => {
            try {
              setIsResetting(true);
              console.log("🔄 Starting app reset...");

              const result = await ResetService.resetAppAndCreateNewUser();

              if (result.success) {
                Alert.alert(
                  "Reset Complete",
                  "App has been reset successfully! A new user has been created. Please restart the app to see the changes.",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        // Force app restart by clearing navigation state
                        // In a real app, you might want to restart the entire app
                        console.log("App reset completed successfully");
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  "Reset Failed",
                  `Failed to reset app: ${result.error}`,
                  [{ text: "OK" }]
                );
              }
            } catch (error) {
              console.error("Reset error:", error);
              Alert.alert(
                "Reset Error",
                `An error occurred during reset: ${error}`,
                [{ text: "OK" }]
              );
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleSettingChange = async (setting: string, value: boolean) => {
    if (!user || !userSettings) return;

    try {
      const updates: any = {};

      switch (setting) {
        case "notifications":
          updates.notifications_enabled = value;
          setNotificationsEnabled(value);
          break;
        case "priceAlerts":
          updates.price_alerts_enabled = value;
          setPriceAlertsEnabled(value);
          break;
        case "balanceHidden":
          updates.balance_hidden = value;
          setBalanceHidden(value);
          break;
      }

      // For now, just update local state
      // TODO: Implement user settings update when available
      console.log("Setting updated:", setting, value);
    } catch (error) {
      console.error("Error updating setting:", error);
    }
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    console.log("Edit profile");
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showChevron = true,
    rightComponent,
  }: any) => (
    <TouchableOpacity
      style={styles.settingItem}
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
        {rightComponent}
        {showChevron && !rightComponent && (
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
  }: any) => (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={async () => {
              try {
                const userId = await AsyncStorage.getItem("@user_id");
                if (userId) {
                  await refreshUser(userId);
                }
              } catch (error) {
                console.error("Failed to reload user:", error);
              }
            }}>
            <Text style={styles.retryButtonText}>Retry</Text>
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
        showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.avatar_emoji || "🚀"}</Text>
          </View>
          <Text style={styles.name}>{user.display_name || user.username}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.joinDate}>
            Member since {new Date(user.join_date).toLocaleDateString()}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatsCard
            title="Total Trades"
            value={user.total_trades}
            subtitle="trades"
          />
          <StatsCard
            title="Win Rate"
            value={`${parseFloat(user.win_rate).toFixed(1)}%`}
            subtitle="success rate"
            color="#10BA68"
          />
          <StatsCard
            title="Total P&L"
            value={`$${parseFloat(user.total_pnl).toLocaleString()}`}
            subtitle="profit"
            color={parseFloat(user.total_pnl) >= 0 ? "#10BA68" : "#F9335D"}
          />
          <StatsCard
            title="Global Rank"
            value={user.global_rank ? `#${user.global_rank}` : "N/A"}
            subtitle="position"
            color="#6674CC"
          />
        </View>

        {/* Portfolio Value */}
        {userStats && (
          <View style={styles.portfolioCard}>
            <Text style={styles.portfolioTitle}>Portfolio Value</Text>
            <Text style={styles.portfolioValue}>
              ${parseFloat(userStats.portfolio_value || "0").toLocaleString()}
            </Text>
            <Text style={styles.portfolioSubtitle}>
              {userStats.total_assets || 0} assets
            </Text>
          </View>
        )}

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="person-outline"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={handleEditProfile}
            />
            <SettingItem
              icon="card-outline"
              title="Balance"
              subtitle={
                balanceHidden
                  ? "Hidden"
                  : `$${parseFloat(user.balance).toLocaleString()}`
              }
              onPress={() =>
                handleSettingChange("balanceHidden", !balanceHidden)
              }
            />
            <SettingItem
              icon="shield-outline"
              title="Security"
              subtitle="Two-factor authentication, password"
              onPress={() => console.log("Security")}
            />
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="notifications-outline"
              title="Push Notifications"
              subtitle="Get notified about price changes"
              showChevron={false}
              rightComponent={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(value) =>
                    handleSettingChange("notifications", value)
                  }
                  trackColor={{ false: "#333", true: "#6674CC" }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <SettingItem
              icon="alarm-outline"
              title="Price Alerts"
              subtitle="Get alerts when prices hit targets"
              showChevron={false}
              rightComponent={
                <Switch
                  value={priceAlertsEnabled}
                  onValueChange={(value) =>
                    handleSettingChange("priceAlerts", value)
                  }
                  trackColor={{ false: "#333", true: "#6674CC" }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <SettingItem
              icon="eye-outline"
              title="Hide Balance"
              subtitle="Keep your balance private"
              showChevron={false}
              rightComponent={
                <Switch
                  value={balanceHidden}
                  onValueChange={(value) =>
                    handleSettingChange("balanceHidden", value)
                  }
                  trackColor={{ false: "#333", true: "#6674CC" }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>
        </View>

        {/* Trading Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trading</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="trending-up-outline"
              title="Trading History"
              subtitle="View your past trades"
              onPress={() => console.log("Trading history")}
            />
            <SettingItem
              icon="trophy-outline"
              title="Leaderboard"
              subtitle="See your ranking"
              onPress={() => console.log("Leaderboard")}
            />
            <SettingItem
              icon="people-outline"
              title="Collections"
              subtitle="Manage your trading groups"
              onPress={() => console.log("Collections")}
            />
          </View>
        </View>

        {/* Support & Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="Get help with the app"
              onPress={() => console.log("Help")}
            />
            <SettingItem
              icon="document-text-outline"
              title="Terms of Service"
              subtitle="Read our terms"
              onPress={() => console.log("Terms")}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              subtitle="How we protect your data"
              onPress={() => console.log("Privacy")}
            />
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <View style={styles.settingsGroup}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#F9335D" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}>
              <Ionicons name="trash-outline" size={20} color="#F9335D" />
              <Text style={styles.deleteText}>Delete Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetApp}
              disabled={isResetting}>
              <Ionicons name="refresh-outline" size={20} color="#6674CC" />
              <Text style={styles.resetText}>
                {isResetting ? "Resetting..." : "Reset App & New User"}
              </Text>
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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A1D2F",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: "#9DA3B4",
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: "#8F95B2",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statTitle: {
    fontSize: 12,
    color: "#9DA3B4",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  statSubtitle: {
    fontSize: 10,
    color: "#8F95B2",
    marginTop: 2,
  },
  portfolioCard: {
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  portfolioTitle: {
    fontSize: 16,
    color: "#9DA3B4",
    marginBottom: 8,
  },
  portfolioValue: {
    fontSize: 28,
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
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  settingsGroup: {
    backgroundColor: "#1A1D2F",
    marginHorizontal: 20,
    borderRadius: 12,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  settingLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#131523",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
    fontSize: 12,
    color: "#9DA3B4",
    marginTop: 2,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#262A3F",
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#F9335D",
    marginLeft: 10,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#262A3F",
    marginBottom: 12,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#F9335D",
    marginLeft: 10,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#262A3F",
    marginBottom: 12,
  },
  resetText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6674CC",
    marginLeft: 10,
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
});

export default ProfileScreen;
