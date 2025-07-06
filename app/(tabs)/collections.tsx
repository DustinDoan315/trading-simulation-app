import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import colors from "@/styles/colors";

const CollectionsScreen = () => {
  const [activeTab, setActiveTab] = useState<'my' | 'joined'>('my');

  const myCollections = [
    {
      id: '1',
      name: 'Crypto Masters',
      members: 12,
      isPublic: true,
      totalValue: 150000,
      rank: 1,
    },
    {
      id: '2',
      name: 'DeFi Enthusiasts',
      members: 8,
      isPublic: false,
      totalValue: 95000,
      rank: 3,
    },
  ];

  const joinedCollections = [
    {
      id: '3',
      name: 'Moonshot Hunters',
      members: 45,
      isPublic: true,
      totalValue: 89000,
      rank: 15,
      owner: 'TradeMaster',
    },
    {
      id: '4',
      name: 'Safe Traders',
      members: 28,
      isPublic: true,
      totalValue: 112000,
      rank: 8,
      owner: 'CryptoGuru',
    },
  ];

  const handleCreateCollection = () => {
    router.push('/(modals)/create-collection');
  };

  const handleJoinCollection = () => {
    router.push('/(modals)/join-collection');
  };

  const handleCollectionPress = (collection: any) => {
    router.push(`/(modals)/collection-detail?id=${collection.id}`);
  };

  const CollectionItem = ({ collection, isOwner = false }: any) => (
    <TouchableOpacity
      style={styles.collectionItem}
      onPress={() => handleCollectionPress(collection)}
    >
      <View style={styles.collectionHeader}>
        <View style={styles.collectionInfo}>
          <Text style={styles.collectionName}>{collection.name}</Text>
          <View style={styles.collectionMeta}>
            <Ionicons 
              name={collection.isPublic ? "globe-outline" : "lock-closed-outline"} 
              size={12} 
              color={colors.text.secondary} 
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
          <Text style={styles.statValue}>${collection.totalValue.toLocaleString()}</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="#131523" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Collections</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateCollection}
        >
          <Ionicons name="add" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            My Collections
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
          onPress={() => setActiveTab('joined')}
        >
          <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>
            Joined
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'my' ? (
          <View style={styles.collectionsContainer}>
            {myCollections.map((collection) => (
              <CollectionItem key={collection.id} collection={collection} isOwner={true} />
            ))}
            <TouchableOpacity 
              style={styles.createCollectionCard}
              onPress={handleCreateCollection}
            >
              <Ionicons name="add-circle-outline" size={48} color={colors.ui.highlight} />
              <Text style={styles.createCollectionText}>Create New Collection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.collectionsContainer}>
            {joinedCollections.map((collection) => (
              <CollectionItem key={collection.id} collection={collection} isOwner={false} />
            ))}
            <TouchableOpacity 
              style={styles.joinCollectionCard}
              onPress={handleJoinCollection}
            >
              <Ionicons name="people-outline" size={48} color={colors.ui.highlight} />
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
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ui.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.ui.highlight,
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  collectionsContainer: {
    paddingHorizontal: 20,
  },
  collectionItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  collectionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collectionMetaText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  collectionRank: {
    backgroundColor: colors.ui.highlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  collectionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  createCollectionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.ui.highlight,
    borderStyle: 'dashed',
  },
  createCollectionText: {
    fontSize: 16,
    color: colors.ui.highlight,
    marginTop: 8,
    fontWeight: '500',
  },
  joinCollectionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.ui.highlight,
    borderStyle: 'dashed',
  },
  joinCollectionText: {
    fontSize: 16,
    color: colors.ui.highlight,
    marginTop: 8,
    fontWeight: '500',
  },
});

export default CollectionsScreen;