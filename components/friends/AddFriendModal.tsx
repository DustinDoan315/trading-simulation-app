import colors from '@/styles/colors';
import React, { useState } from 'react';
import { FriendsService } from '@/services/FriendsService';
import { useNotification } from '@/components/ui/Notification';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


interface AddFriendModalProps {
  userId: string;
  onClose: () => void;
  onFriendAdded?: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({
  userId,
  onClose,
  onFriendAdded,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const { showNotification } = useNotification();

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;

    try {
      setIsSearching(true);
      const results = await FriendsService.searchUsers(searchTerm, userId);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
      showNotification({
        type: "error",
        message: "Failed to search users",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (friendId: string, friendName: string) => {
    try {
      await FriendsService.sendFriendRequest({
        user_id: userId,
        friend_id: friendId,
        message: `Hi! I'd like to add you as a friend.`,
      });

      showNotification({
        type: "success",
        message: `Friend request sent to ${friendName}`,
      });

      // Remove from search results
      setSearchResults((prev) => prev.filter((user) => user.id !== friendId));
    } catch (error) {
      console.error("Error sending friend request:", error);
      showNotification({
        type: "error",
        message: "Failed to send friend request",
      });
    }
  };

  const acceptInvitation = async () => {
    if (!inviteCode.trim()) {
      showNotification({
        type: "error",
        message: "Please enter an invite code",
      });
      return;
    }

    try {
      await FriendsService.acceptInvitation({
        invite_code: inviteCode.trim(),
        user_id: userId,
      });

      showNotification({
        type: "success",
        message: "Friend invitation accepted!",
      });

      setInviteCode("");
      onFriendAdded?.();
    } catch (error) {
      console.error("Error accepting invitation:", error);
      showNotification({
        type: "error",
        message: "Invalid or expired invitation code",
      });
    }
  };

  const renderSearchResult = ({ item }: { item: any }) => (
    <View style={styles.searchResult}>
      <View style={styles.userInfo}>
        <Text style={styles.avatar}>{item.avatar_emoji || "👤"}</Text>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{item.display_name || item.username}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          sendFriendRequest(item.id, item.display_name || item.username)
        }>
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Friends</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Invite Code Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Join with Invite Code</Text>
          <View style={styles.inviteContainer}>
            <TextInput
              style={styles.inviteInput}
              placeholder="Enter invite code"
              placeholderTextColor="#9DA3B4"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={acceptInvitation}>
              <Text style={styles.acceptButtonText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Users</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username or display name"
              placeholderTextColor="#9DA3B4"
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={searchUsers}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={searchUsers}
              disabled={isSearching}>
              <Text style={styles.searchButtonText}>
                {isSearching ? "..." : "Search"}
              </Text>
            </TouchableOpacity>
          </View>

          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              style={styles.searchResults}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: "#1A1D2F",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#9DA3B4",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  inviteContainer: {
    flexDirection: "row",
    gap: 12,
  },
  inviteInput: {
    flex: 1,
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 16,
  },
  acceptButton: {
    backgroundColor: "#6674CC",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: "#6674CC",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  searchResults: {
    maxHeight: 300,
  },
  searchResult: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  userInfo: {
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
  addButton: {
    backgroundColor: "#10BA68",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default AddFriendModal;
