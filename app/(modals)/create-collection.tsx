import InviteCodeQR from '@/components/collections/InviteCodeQR';
import React, { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCollectionsData } from '@/hooks/useCollectionsData';
import { useUser } from '@/context/UserContext';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


const CreateCollectionScreen = () => {
  const { user } = useUser();
  const { createNewCollection } = useCollectionsData();
  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [createdCollection, setCreatedCollection] = useState<{
    name: string;
    inviteCode: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: true,
    allowInvites: true,
    maxMembers: "50",
    startingBalance: "100000",
    durationDays: "30",
  });

  const generateInviteCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreate = useCallback(async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter a collection name");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setLoading(true);
    try {
      const inviteCode = generateInviteCode();

      const collection = await createNewCollection({
        name: formData.name.trim(),
        description: formData.description.trim(),
        invite_code: inviteCode,
        is_public: formData.isPublic,
        allow_invites: formData.allowInvites,
        max_members: parseInt(formData.maxMembers),
        starting_balance: formData.startingBalance,
        duration_days: parseInt(formData.durationDays),
        rules: {},
      });

      // Store the created collection info for QR modal
      setCreatedCollection({
        name: formData.name.trim(),
        inviteCode: inviteCode,
      });

      // Show QR code modal instead of just alert
      setShowQRModal(true);
    } catch (error) {
      console.error("Error creating collection:", error);
      Alert.alert("Error", "Failed to create collection. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [formData, user?.id, createNewCollection]);

  const handleQRModalClose = useCallback(() => {
    setShowQRModal(false);
    setCreatedCollection(null);
    router.back();
  }, []);

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Collection</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Collection Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Collection Information</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Collection Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => updateFormData("name", value)}
                placeholder="Enter collection name"
                placeholderTextColor="#9DA3B4"
                maxLength={100}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateFormData("description", value)}
                placeholder="Describe your collection..."
                placeholderTextColor="#9DA3B4"
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Public Collection</Text>
                <Text style={styles.settingDescription}>
                  Anyone can see and join this collection
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  formData.isPublic && styles.toggleActive,
                ]}
                onPress={() => updateFormData("isPublic", !formData.isPublic)}>
                <View
                  style={[
                    styles.toggleThumb,
                    formData.isPublic && styles.toggleThumbActive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Allow Invites</Text>
                <Text style={styles.settingDescription}>
                  Members can invite others to join
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  formData.allowInvites && styles.toggleActive,
                ]}
                onPress={() =>
                  updateFormData("allowInvites", !formData.allowInvites)
                }>
                <View
                  style={[
                    styles.toggleThumb,
                    formData.allowInvites && styles.toggleThumbActive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Max Members</Text>
              <TextInput
                style={styles.input}
                value={formData.maxMembers}
                onChangeText={(value) => updateFormData("maxMembers", value)}
                placeholder="50"
                placeholderTextColor="#9DA3B4"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Starting Balance (USDT)</Text>
              <TextInput
                style={styles.input}
                value={formData.startingBalance}
                onChangeText={(value) =>
                  updateFormData("startingBalance", value)
                }
                placeholder="100000"
                placeholderTextColor="#9DA3B4"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Duration (Days)</Text>
              <TextInput
                style={styles.input}
                value={formData.durationDays}
                onChangeText={(value) => updateFormData("durationDays", value)}
                placeholder="30"
                placeholderTextColor="#9DA3B4"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}>
          <LinearGradient
            colors={loading ? ["#4A5568", "#4A5568"] : ["#6674CC", "#5A67D8"]}
            style={styles.createButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Create Collection</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {showQRModal && createdCollection && (
        <InviteCodeQR
          visible={showQRModal}
          collectionName={createdCollection.name}
          inviteCode={createdCollection.inviteCode}
          onClose={handleQRModalClose}
        />
      )}
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2A2D3F",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2D3F",
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: "#9DA3B4",
  },
  toggle: {
    width: 48,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2A2D3F",
    padding: 2,
  },
  toggleActive: {
    backgroundColor: "#6674CC",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  toggleThumbActive: {
    transform: [{ translateX: 24 }],
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#2A2D3F",
  },
  createButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default CreateCollectionScreen;
