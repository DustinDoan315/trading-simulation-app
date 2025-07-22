import DiscoverCollectionItem from "@/components/collections/DiscoverCollectionItem";
import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCollectionDiscovery } from "@/hooks/useCollectionDiscovery";
import { useUser } from "@/context/UserContext";
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

const DiscoverCollectionsScreen = () => {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    loading,
    searching,
    joining,
    error,
    discoveredCollections,
    searchResults,
    discoverCollections,
    searchCollections,
    joinCollection,
    joinCollectionByInviteCode,
    clearError,
    clearSearch,
  } = useCollectionDiscovery();

  // Load collections on mount
  useEffect(() => {
    if (user?.id) {
      discoverCollections();
    }
  }, [user?.id, discoverCollections]);

  // Search collections when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        searchCollections(searchTerm);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      clearSearch();
    }
  }, [searchTerm, searchCollections, clearSearch]);

  const handleJoinCollection = useCallback(
    async (collectionId: string) => {
      const success = await joinCollection(collectionId);
      if (success) {
        // Refresh the collections list
        discoverCollections();
      }
      return success || false;
    },
    [joinCollection, discoverCollections]
  );

  const handleJoinByInviteCode = useCallback(
    async (code: string) => {
      const success = await joinCollectionByInviteCode(code);
      if (success) {
        Alert.alert("Success", "You have successfully joined the collection!");
        // Navigate back to collections screen
        router.back();
      }
    },
    [joinCollectionByInviteCode]
  );

  const handleRefresh = useCallback(() => {
    discoverCollections();
  }, [discoverCollections]);

  const renderContent = () => {
    if (!user) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={48} color="#9DA3B4" />
          <Text style={styles.errorTitle}>Authentication Required</Text>
          <Text style={styles.errorText}>
            Please log in to discover collections
          </Text>
        </View>
      );
    }

    if (loading && !searching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6674CC" />
          <Text style={styles.loadingText}>Discovering collections...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const collections = searchTerm.trim()
      ? searchResults
      : discoveredCollections;

    if (collections.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={searchTerm.trim() ? "search" : "people-outline"}
            size={48}
            color="#9DA3B4"
          />
          <Text style={styles.emptyTitle}>
            {searchTerm.trim()
              ? "No collections found"
              : "No collections available"}
          </Text>
          <Text style={styles.emptyText}>
            {searchTerm.trim()
              ? "Try adjusting your search terms"
              : "Check back later for new collections"}
          </Text>
          {!searchTerm.trim() && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.collectionsContainer}>
          {collections.map((collection) => (
            <DiscoverCollectionItem
              key={collection.id}
              collection={collection}
              onJoin={handleJoinCollection}
              joining={joining}
            />
          ))}
        </View>
      </ScrollView>
    );
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
        <Text style={styles.title}>Discover Collections</Text>
        <TouchableOpacity
          style={styles.refreshHeaderButton}
          onPress={handleRefresh}
          disabled={loading}>
          <Ionicons
            name="refresh"
            size={20}
            color={loading ? "#9DA3B4" : "#6674CC"}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9DA3B4" />
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search collections..."
            placeholderTextColor="#9DA3B4"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchTerm("")}>
              <Ionicons name="close-circle" size={20} color="#9DA3B4" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Invite Code Section */}
      <View style={styles.inviteSection}>
        <TouchableOpacity style={styles.inviteToggle}>
          <Ionicons name="link" size={20} color="#6674CC" />
          <Text style={styles.inviteToggleText}>Join by Invite Code</Text>
          <Ionicons name="chevron-forward" size={20} color="#6674CC" />
        </TouchableOpacity>
      </View>

      {/* Invite Code Input Modal - Now handled by navigation */}

      {/* Content */}
      {renderContent()}
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
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  refreshHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(102, 116, 204, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    marginLeft: 12,
  },
  clearButton: {
    marginLeft: 8,
  },
  inviteSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inviteToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(102, 116, 204, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  inviteToggleText: {
    flex: 1,
    fontSize: 16,
    color: "#6674CC",
    fontWeight: "600",
  },
  inviteInputContainer: {
    flexDirection: "row",
    marginTop: 12,
    gap: 12,
  },
  inviteInput: {
    flex: 1,
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#FFFFFF",
  },
  joinInviteButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  joinInviteButtonDisabled: {
    opacity: 0.6,
  },
  joinInviteButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  joinInviteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  collectionsContainer: {
    paddingHorizontal: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#9DA3B4",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: "#6674CC",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default DiscoverCollectionsScreen;
