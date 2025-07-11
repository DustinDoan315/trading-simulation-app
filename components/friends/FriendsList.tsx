import colors from '@/styles/colors';
import React, { useEffect, useState } from 'react';
import { FriendsService } from '@/services/FriendsService';
import { FriendWithDetails } from '@/types/database';
import { useNotification } from '@/components/ui/Notification';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


interface FriendsListProps {
  userId: string;
  onFriendPress?: (friend: FriendWithDetails) => void;
}

const FriendsList: React.FC<FriendsListProps> = ({ userId, onFriendPress }) => {
  const [friends, setFriends] = useState<FriendWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useNotification();

  const loadFriends = async () => {
    try {
      setIsLoading(true);
      const friendsData = await FriendsService.getFriends(userId);
      setFriends(friendsData);
    } catch (error) {
      console.error("Error loading friends:", error);
      showNotification({
        type: "error",
        message: "Failed to load friends",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, [userId]);

  const handleRemoveFriend = (friend: FriendWithDetails) => {
    Alert.alert(
      "Remove Friend",
      `Are you sure you want to remove ${
        friend.friend?.display_name || friend.friend?.username
      } from your friends?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await FriendsService.removeFriend(userId, friend.friend_id);
              showNotification({
                type: "success",
                message: "Friend removed successfully",
              });
              loadFriends(); // Reload the list
            } catch (error) {
              console.error("Error removing friend:", error);
              showNotification({
                type: "error",
                message: "Failed to remove friend",
              });
            }
          },
        },
      ]
    );
  };

  const renderFriend = ({ item }: { item: FriendWithDetails }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => onFriendPress?.(item)}
      onLongPress={() => handleRemoveFriend(item)}>
      <View style={styles.friendInfo}>
        <Text style={styles.avatar}>{item.friend?.avatar_emoji || "👤"}</Text>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>
            {item.friend?.display_name || item.friend?.username}
          </Text>
          <Text style={styles.username}>@{item.friend?.username}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              {
                color:
                  parseFloat(item.friend?.total_pnl || "0") >= 0
                    ? "#10BA68"
                    : "#F9335D",
              },
            ]}>
            {parseFloat(item.friend?.total_pnl || "0") >= 0 ? "+" : ""}$
            {parseFloat(item.friend?.total_pnl || "0").toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>P&L</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            #{item.friend?.global_rank || "—"}
          </Text>
          <Text style={styles.statLabel}>Rank</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={friends}
      renderItem={renderFriend}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={loadFriends}
          tintColor="#6674CC"
          colors={["#6674CC"]}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {isLoading
              ? "Loading friends..."
              : "No friends yet. Invite some friends to get started!"}
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  friendInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    fontSize: 24,
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  username: {
    fontSize: 12,
    color: "#9DA3B4",
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    alignItems: "flex-end",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 10,
    color: "#9DA3B4",
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9DA3B4",
    textAlign: "center",
  },
});

export default FriendsList;
