import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCollectionsData } from '@/hooks/useCollectionsData';
import { useUser } from '@/context/UserContext';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


const JoinCollectionModal = () => {
  const { user } = useUser();
  const { joinCollectionByInviteCode } = useCollectionsData();
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  // Get parameters from deep link
  const params = useLocalSearchParams();
  const inviteCode = params.code as string;
  const collectionName = params.name as string;

  const handleJoin = useCallback(async () => {
    if (!user?.id) {
      Alert.alert("Error", "Please log in to join collections");
      return;
    }

    if (!inviteCode) {
      Alert.alert("Error", "Invalid invite code");
      return;
    }

    setJoining(true);
    try {
      await joinCollectionByInviteCode(inviteCode);

      Alert.alert(
        "Success",
        `You have successfully joined "${collectionName || "the collection"}!"`,
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/(tabs)/collections");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error joining collection:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to join collection";
      Alert.alert("Error", errorMessage);
    } finally {
      setJoining(false);
    }
  }, [user?.id, inviteCode, collectionName, joinCollectionByInviteCode]);

  const handleDecline = useCallback(() => {
    Alert.alert(
      "Decline Invitation",
      "Are you sure you want to decline this invitation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  // Auto-close if no invite code
  useEffect(() => {
    if (!inviteCode) {
      Alert.alert("Error", "Invalid invitation link", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  }, [inviteCode]);

  if (!inviteCode) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Join Collection</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={["#6674CC", "#5A67D8"]}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Ionicons name="people" size={32} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <Text style={styles.mainTitle}>Collection Invitation</Text>
        <Text style={styles.subtitle}>
          You've been invited to join a trading collection
        </Text>

        {/* Collection Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Collection Name</Text>
            <Text style={styles.infoValue}>
              {collectionName || "Unknown Collection"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Invite Code</Text>
            <Text style={styles.infoValue}>{inviteCode}</Text>
          </View>
        </View>

        <View style={styles.descriptionContainer}>
          <Ionicons name="information-circle" size={16} color="#9DA3B4" />
          <Text style={styles.descriptionText}>
            Join this collection to participate in group trading challenges and
            compete with other traders.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.joinButton, joining && styles.joinButtonDisabled]}
          onPress={handleJoin}
          disabled={joining}>
          <LinearGradient
            colors={joining ? ["#4A5568", "#4A5568"] : ["#10B981", "#059669"]}
            style={styles.joinButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            {joining ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.joinButtonText}>Join Collection</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.declineButton}
          onPress={handleDecline}
          disabled={joining}>
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
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
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#9DA3B4",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  infoContainer: {
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2A2D3F",
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: "#9DA3B4",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  descriptionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: "#9DA3B4",
    textAlign: "center",
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  joinButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 8,
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  declineButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default JoinCollectionModal;
