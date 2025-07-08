import CollectionItem from '@/components/collections/CollectionItem';
import EmptyState from '@/components/collections/EmptyState';
import React, { useCallback, useEffect, useState } from 'react';
import { CollectionData, useCollectionsData } from '@/hooks/useCollectionsData';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
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


const CollectionsScreen = () => {
  const [activeTab, setActiveTab] = useState<"my" | "joined">("my");
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const { user } = useUser();

  const {
    myCollections,
    joinedCollections,
    loading,
    refreshing,
    error,
    onRefresh,
    forceRefresh,
    createNewCollection,
    joinCollection,
    joinCollectionByInviteCode,
    leaveCollection,
  } = useCollectionsData();

  const handleCreateCollection = useCallback(() => {
    router.push("/(modals)/create-collection");
  }, []);

  const handleJoinCollection = useCallback(() => {
    router.push("/(modals)/discover-collections");
  }, []);

  const handleScanInviteCode = useCallback(() => {
    router.push("/(modals)/invite-code-scanner");
  }, []);

  // Note: Code scanning is now handled by the invite-code-scanner screen

  const handleCollectionPress = useCallback((collection: CollectionData) => {
    router.push({
      pathname: "/(modals)/collection-detail" as any,
      params: {
        id: collection.id,
        name: collection.name,
        isOwner: collection.isOwner.toString(),
      },
    });
  }, []);

  const handleCollectionLongPress = useCallback(
    (collection: CollectionData) => {
      if (collection.isOwner) {
        Alert.alert("Collection Options", "What would you like to do?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Edit",
            onPress: () =>
              router.push({
                pathname: "/(modals)/collection-detail" as any,
                params: {
                  id: collection.id,
                  name: collection.name,
                  isOwner: collection.isOwner.toString(),
                },
              }),
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => handleDeleteCollection(collection),
          },
        ]);
      } else {
        Alert.alert(
          "Leave Collection",
          `Are you sure you want to leave "${collection.name}"?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Leave",
              style: "destructive",
              onPress: () => handleLeaveCollection(collection),
            },
          ]
        );
      }
    },
    []
  );

  const handleDeleteCollection = useCallback(
    async (collection: CollectionData) => {
      Alert.alert(
        "Delete Collection",
        `Are you sure you want to delete "${collection.name}"? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                // TODO: Implement delete collection
                console.log("Delete collection:", collection.id);
              } catch (error) {
                Alert.alert("Error", "Failed to delete collection");
              }
            },
          },
        ]
      );
    },
    []
  );

  const handleLeaveCollection = useCallback(
    async (collection: CollectionData) => {
      try {
        await leaveCollection(collection.id);
        Alert.alert("Success", "You have left the collection");
      } catch (error) {
        Alert.alert("Error", "Failed to leave collection");
      }
    },
    [leaveCollection]
  );

  // Refresh data when screen comes into focus (e.g., after creating a collection)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshTime;

        // Only refresh if it's been more than 2 seconds since last refresh
        // This prevents excessive refreshes while still ensuring fresh data
        if (timeSinceLastRefresh > 2000) {
          console.log("🔄 Collections screen focused - refreshing data");
          setLastRefreshTime(now);
          forceRefresh();
        } else {
          console.log("⏭️ Skipping refresh - too soon since last refresh");
        }
      }
    }, [user?.id, forceRefresh, lastRefreshTime])
  );

  // Additional refresh trigger for immediate updates
  const handleImmediateRefresh = useCallback(() => {
    if (user?.id) {
      console.log("🔄 Immediate refresh triggered");
      setLastRefreshTime(Date.now());
      forceRefresh().then(() => {
        // Show success message briefly
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 2000);
      });
    }
  }, [user?.id, forceRefresh]);

  const renderContent = () => {
    const refreshControl = (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleImmediateRefresh}
        tintColor="#6674CC"
        colors={["#6674CC"]}
      />
    );

    if (!user) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={refreshControl}>
          <View style={styles.errorContainer}>
            <Ionicons name="person-circle-outline" size={48} color="#9DA3B4" />
            <Text style={styles.errorTitle}>Authentication Required</Text>
            <Text style={styles.errorText}>
              Please log in to view your collections
            </Text>
          </View>
        </ScrollView>
      );
    }

    if (loading && !refreshing) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={refreshControl}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6674CC" />
            <Text style={styles.loadingText}>Loading collections...</Text>
          </View>
        </ScrollView>
      );
    }

    if (error) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={refreshControl}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleImmediateRefresh}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    const collections = activeTab === "my" ? myCollections : joinedCollections;

    if (collections.length === 0) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={refreshControl}>
          <EmptyState
            type={activeTab}
            onAction={
              activeTab === "my" ? handleCreateCollection : handleJoinCollection
            }
          />
        </ScrollView>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={refreshControl}>
        <View style={styles.collectionsContainer}>
          {collections.map((collection) => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              onPress={handleCollectionPress}
              onLongPress={handleCollectionLongPress}
            />
          ))}

          {/* Action card */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={
              activeTab === "my" ? handleCreateCollection : handleJoinCollection
            }>
            <LinearGradient
              colors={["rgba(102, 116, 204, 0.1)", "rgba(102, 116, 204, 0.05)"]}
              style={styles.actionCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <Ionicons
                name={
                  activeTab === "my" ? "add-circle-outline" : "people-outline"
                }
                size={48}
                color="#6674CC"
              />
              <Text style={styles.actionCardText}>
                {activeTab === "my"
                  ? "Create New Collection"
                  : "Join Collection"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Collections</Text>
          <Text style={styles.subtitle}>
            {activeTab === "my" ? "My Collections" : "Joined Collections"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScanInviteCode}>
            <Ionicons name="qr-code" size={20} color="#6674CC" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateCollection}>
            <LinearGradient
              colors={["#6674CC", "#5A67D8"]}
              style={styles.createButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "my" && styles.activeTab]}
          onPress={() => {
            if (activeTab !== "my") {
              setActiveTab("my");
              // Refresh data when switching to "my" tab
              handleImmediateRefresh();
            }
          }}>
          <Ionicons
            name="people"
            size={16}
            color={activeTab === "my" ? "#FFFFFF" : "#9DA3B4"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "my" && styles.activeTabText,
            ]}>
            My Collections
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "joined" && styles.activeTab]}
          onPress={() => {
            if (activeTab !== "joined") {
              setActiveTab("joined");
              // Refresh data when switching to "joined" tab
              handleImmediateRefresh();
            }
          }}>
          <Ionicons
            name="people-circle"
            size={16}
            color={activeTab === "joined" ? "#FFFFFF" : "#9DA3B4"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "joined" && styles.activeTabText,
            ]}>
            Joined
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success Message */}
      {showSuccessMessage && (
        <View style={styles.successMessage}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.successMessageText}>
            Successfully joined collection!
          </Text>
        </View>
      )}

      {/* Content */}
      {renderContent()}

      {/* InviteCodeScanner now handled by navigation */}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#9DA3B4",
  },
  createButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  createButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scanButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(102, 116, 204, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanButtonActive: {
    backgroundColor: "#6674CC",
  },

  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: "#6674CC",
  },
  tabText: {
    color: "#9DA3B4",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  collectionsContainer: {
    paddingHorizontal: 15,
  },
  actionCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  actionCardGradient: {
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#6674CC",
    borderStyle: "dashed",
  },
  actionCardText: {
    fontSize: 16,
    color: "#6674CC",
    marginTop: 8,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#9DA3B4",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#9DA3B4",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#6674CC",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "#10B981",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  successMessageText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
});

export default CollectionsScreen;
