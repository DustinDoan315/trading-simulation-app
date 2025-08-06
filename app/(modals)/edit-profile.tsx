import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '@/utils/logger';
import { router, useLocalSearchParams } from 'expo-router';
import { updateUser } from '@/features/userSlice';
import { useAppDispatch } from '@/store';
import { useLanguage } from '@/context/LanguageContext';
import { UserService } from '@/services/UserService';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


const EditProfileScreen = () => {
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const params = useLocalSearchParams();

  const [editLoading, setEditLoading] = useState(false);
  const [displayName, setDisplayName] = useState(
    (params.display_name as string) || ""
  );
  const [avatarEmoji, setAvatarEmoji] = useState(
    (params.avatar_emoji as string) || "🚀"
  );

  const handleSaveProfile = async () => {
    const userId = params.userId as string;
    if (!userId) {
      Alert.alert(t("error.title"), "User ID not found");
      return;
    }

    try {
      setEditLoading(true);

      const updateParams = {
        id: userId,
        display_name: displayName.trim() || undefined,
        avatar_emoji: avatarEmoji.trim() || "🚀",
      };

      await dispatch(updateUser({ id: userId, params: updateParams })).unwrap();
      await UserService.updateUser(userId, updateParams);

      Alert.alert(t("success.title"), t("profile.profileUpdatedSuccessfully"), [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      logger.error("Error updating profile", "EditProfile", error);
      Alert.alert(t("error.title"), t("profile.failedToUpdateProfile"));
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("profile.editProfile")}</Text>
        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={editLoading}
          style={[styles.saveButton, editLoading && styles.disabledButton]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {editLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>{t("profile.save")}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Form Content */}
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t("profile.displayName")}</Text>
          <TextInput
            style={styles.textInput}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t("profile.enterDisplayName")}
            placeholderTextColor="#8F95B2"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={30}
          />
          <Text style={styles.characterCount}>{displayName.length}/30</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t("profile.avatarEmoji")}</Text>
          <TextInput
            style={styles.textInput}
            value={avatarEmoji}
            onChangeText={setAvatarEmoji}
            placeholder="🚀"
            placeholderTextColor="#8F95B2"
            maxLength={2}
            autoCorrect={false}
          />
          <Text style={styles.inputHint}>
            Enter an emoji to represent your profile
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131523",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2E42",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#6674CC",
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#9DA3B4",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2A2E42",
    minHeight: 48,
  },
  inputHint: {
    fontSize: 12,
    color: "#8F95B2",
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: "#8F95B2",
    textAlign: "right",
    marginTop: 4,
  },
});

export default EditProfileScreen;
