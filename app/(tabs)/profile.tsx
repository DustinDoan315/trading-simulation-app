import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/styles/colors";

const ProfileScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(true);
  const [balanceHidden, setBalanceHidden] = useState(false);

  const userStats = {
    name: "CryptoTrader",
    email: "trader@example.com",
    joinDate: "January 2024",
    totalTrades: 156,
    winRate: 68.5,
    totalPnL: 28450,
    portfolioValue: 184000,
    rank: 4,
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => console.log("Logout") },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => console.log("Delete account") },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, showChevron = true, rightComponent }: any) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={colors.text.primary} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showChevron && !rightComponent && (
          <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const StatsCard = ({ title, value, subtitle, color = colors.text.primary }: any) => (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131523" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🚀</Text>
          </View>
          <Text style={styles.name}>{userStats.name}</Text>
          <Text style={styles.email}>{userStats.email}</Text>
          <Text style={styles.joinDate}>Member since {userStats.joinDate}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatsCard
            title="Total Trades"
            value={userStats.totalTrades}
            subtitle="trades"
          />
          <StatsCard
            title="Win Rate"
            value={`${userStats.winRate}%`}
            subtitle="success rate"
            color={colors.action.buy}
          />
          <StatsCard
            title="Total P&L"
            value={`$${userStats.totalPnL.toLocaleString()}`}
            subtitle="profit"
            color={userStats.totalPnL >= 0 ? colors.action.buy : colors.action.sell}
          />
          <StatsCard
            title="Global Rank"
            value={`#${userStats.rank}`}
            subtitle="position"
            color={colors.ui.highlight}
          />
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="person-outline"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => console.log("Edit profile")}
            />
            <SettingItem
              icon="card-outline"
              title="Payment Methods"
              subtitle="Manage your payment options"
              onPress={() => console.log("Payment methods")}
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
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.border.light, true: colors.ui.highlight }}
                  thumbColor={colors.text.primary}
                />
              }
            />
            <SettingItem
              icon="finger-print-outline"
              title="Biometric Authentication"
              subtitle="Use fingerprint or face recognition"
              showChevron={false}
              rightComponent={
                <Switch
                  value={biometricsEnabled}
                  onValueChange={setBiometricsEnabled}
                  trackColor={{ false: colors.border.light, true: colors.ui.highlight }}
                  thumbColor={colors.text.primary}
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
                  onValueChange={setPriceAlertsEnabled}
                  trackColor={{ false: colors.border.light, true: colors.ui.highlight }}
                  thumbColor={colors.text.primary}
                />
              }
            />
            <SettingItem
              icon="eye-off-outline"
              title="Hide Balance"
              subtitle="Hide portfolio balance on home screen"
              showChevron={false}
              rightComponent={
                <Switch
                  value={balanceHidden}
                  onValueChange={setBalanceHidden}
                  trackColor={{ false: colors.border.light, true: colors.ui.highlight }}
                  thumbColor={colors.text.primary}
                />
              }
            />
          </View>
        </View>

        {/* Support & About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & About</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="help-circle-outline"
              title="Help Center"
              subtitle="Get help and support"
              onPress={() => console.log("Help center")}
            />
            <SettingItem
              icon="document-text-outline"
              title="Terms of Service"
              subtitle="Read our terms and conditions"
              onPress={() => console.log("Terms")}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              subtitle="Learn about how we protect your data"
              onPress={() => console.log("Privacy")}
            />
            <SettingItem
              icon="information-circle-outline"
              title="About"
              subtitle="Version 1.0.0"
              onPress={() => console.log("About")}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.action.sell }]}>Danger Zone</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="log-out-outline"
              title="Logout"
              subtitle="Sign out of your account"
              onPress={handleLogout}
            />
            <SettingItem
              icon="trash-outline"
              title="Delete Account"
              subtitle="Permanently delete your account"
              onPress={handleDeleteAccount}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statTitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statSubtitle: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  settingsGroup: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  settingSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
});

export default ProfileScreen;