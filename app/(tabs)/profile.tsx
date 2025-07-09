import AsyncStorage from "@react-native-async-storage/async-storage";
import colors from "@/styles/colors";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { updateUser } from "@/features/userSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import { useRealTimeBalance } from "@/hooks/useRealTimeBalance";
import { UserService } from "@/services/UserService";
import { useTransactionCount } from "@/hooks/useTransactionCount";
import { useUser } from "@/context/UserContext";
import {
  ActivityIndicator,
  Alert,
  Modal,
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

  // Use real-time balance hook for live updates
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

  // Get actual transaction count from database
  const { transactionCount, loading: transactionCountLoading } =
    useTransactionCount(user?.id);

  const [isEditing, setIsEditing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: "",
    avatar_emoji: "",
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        display_name: user.display_name || "",
        avatar_emoji: user.avatar_emoji || "🚀",
      });
    }
  }, [user]);

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

      // Update in Redux store
      await dispatch(
        updateUser({ id: user.id, params: updateParams })
      ).unwrap();

      // Update in cloud
      await UserService.updateUser(user.id, updateParams);

      setEditModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
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
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showChevron = true,
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
  }: any) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={[styles.statTitle, { color }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading || realTimeLoading || transactionCountLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6674CC" />
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
            Member since {new Date(user.join_date).toLocaleDateString()}
          </Text>
        </View>

        {/* Enhanced Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsSectionTitle}>Trading Statistics</Text>
          <View style={styles.statsGrid}>
            <StatsCard
              title="Total Trades"
              value={transactionCount}
              subtitle="trades"
              color="#6674CC"
              icon="trending-up"
            />

            <StatsCard
              title="Total P&L"
              value={formattedTotalPnL}
              subtitle={formattedTotalPnLPercentage}
              color={totalPnL >= 0 ? "#10BA68" : "#F9335D"}
              icon="wallet"
            />
            <StatsCard
              title="Global Rank"
              value={userRank ? `#${userRank}` : "N/A"}
              subtitle="position"
              color="#FF9500"
              icon="star"
            />
          </View>
        </View>

        {/* Portfolio Value */}
        <View style={styles.portfolioCard}>
          <View style={styles.portfolioHeader}>
            <Ionicons name="pie-chart" size={20} color="#6674CC" />
            <Text style={styles.portfolioTitle}>Portfolio Value</Text>
          </View>
          <Text style={styles.portfolioValue}>{formattedTotalBalance}</Text>
          <Text style={styles.portfolioSubtitle}>
            Real-time portfolio value
          </Text>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="trending-up-outline"
              title="Trading History"
              subtitle="View your past trades"
              onPress={() => router.push("/trading-history" as any)}
            />
            <SettingItem
              icon="trophy-outline"
              title="Leaderboard"
              subtitle="See your ranking"
              onPress={() => router.push("/leaderboard" as any)}
            />
            <SettingItem
              icon="people-outline"
              title="Collections"
              subtitle="Manage your trading groups"
              onPress={() => router.push("/collections" as any)}
            />
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelEdit}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={handleCancelEdit}>
                <Ionicons name="close" size={24} color="#9DA3B4" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Display Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.display_name}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, display_name: text })
                  }
                  placeholder="Enter display name"
                  placeholderTextColor="#8F95B2"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Avatar Emoji</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.avatar_emoji}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, avatar_emoji: text })
                  }
                  placeholder="🚀"
                  placeholderTextColor="#8F95B2"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
                disabled={editLoading}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={editLoading}>
                {editLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
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
    marginBottom: 24,
  },
  statsSectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "47%",
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
});

export default ProfileScreen;
