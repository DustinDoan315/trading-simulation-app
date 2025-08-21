import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


const CollectionsModal = () => {
  const [activeTab, setActiveTab] = useState<"my" | "joined">("my");

  const myCollections: any[] = [];
  const joinedCollections: any[] = [];

  const handleCreateCollection = () => {
    router.push("/(modals)/create-collection");
  };

  const handleJoinCollection = () => {
    router.push("/(modals)/join-collection");
  };

  const handleCollectionPress = (collection: any) => {
    router.push({
      pathname: "/(modals)/collection-detail",
      params: { id: collection.id.toString() },
    });
  };

  const CollectionItem = ({ collection, isOwner = false }: any) => (
    <TouchableOpacity
      style={styles.collectionItem}
      onPress={() => handleCollectionPress(collection)}>
      <View style={styles.collectionHeader}>
        <View style={styles.collectionInfo}>
          <Text style={styles.collectionName}>{collection.name}</Text>
          <View style={styles.collectionMeta}>
            <Ionicons
              name={
                collection.isPublic ? "globe-outline" : "lock-closed-outline"
              }
              size={12}
              color="#9DA3B4"
            />
            <Text style={styles.collectionMetaText}>
              {collection.members} members
            </Text>
          </View>
        </View>
        <View style={styles.collectionRank}>
          <Text style={styles.rankText}>#{collection.rank}</Text>
        </View>
      </View>

      <View style={styles.collectionStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            ${collection.totalValue.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Value</Text>
        </View>
        {!isOwner && (
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{collection.owner}</Text>
            <Text style={styles.statLabel}>Owner</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Collections</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateCollection}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "my" && styles.activeTab]}
          onPress={() => setActiveTab("my")}>
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
          onPress={() => setActiveTab("joined")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "joined" && styles.activeTabText,
            ]}>
            Joined
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {activeTab === "my" ? (
          <View style={styles.collectionsContainer}>
            {myCollections.map((collection) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                isOwner={true}
              />
            ))}
            <TouchableOpacity
              style={styles.createCollectionCard}
              onPress={handleCreateCollection}>
              <Ionicons name="add-circle-outline" size={48} color="#6674CC" />
              <Text style={styles.createCollectionText}>
                Create New Collection
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.collectionsContainer}>
            {joinedCollections.map((collection) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                isOwner={false}
              />
            ))}
            <TouchableOpacity
              style={styles.joinCollectionCard}
              onPress={handleJoinCollection}>
              <Ionicons name="people-outline" size={48} color="#6674CC" />
              <Text style={styles.joinCollectionText}>Join Collection</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1D2F",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6674CC",
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1A1D2F",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  activeTab: {
    backgroundColor: "#6674CC",
    borderColor: "#6674CC",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9DA3B4",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  collectionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  collectionItem: {
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2E42",
  },
  collectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  collectionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  collectionMetaText: {
    fontSize: 12,
    color: "#9DA3B4",
  },
  collectionRank: {
    backgroundColor: "#6674CC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  collectionStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "#9DA3B4",
    textTransform: "uppercase",
  },
  createCollectionCard: {
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#6674CC",
    borderStyle: "dashed",
  },
  createCollectionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6674CC",
    marginTop: 8,
  },
  joinCollectionCard: {
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#6674CC",
    borderStyle: "dashed",
  },
  joinCollectionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6674CC",
    marginTop: 8,
  },
});

export default CollectionsModal;
