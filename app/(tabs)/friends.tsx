import AddFriendModal from '@/components/friends/AddFriendModal';
import colors from '@/styles/colors';
import FriendsList from '@/components/friends/FriendsList';
import React, { useState } from 'react';
import ShareInviteModal from '@/components/friends/ShareInviteModal';
import { useUser } from '@/context/UserContext';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


const FriendsScreen = () => {
  const { user } = useUser();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showShareInvite, setShowShareInvite] = useState(false);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Please log in to view friends
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowShareInvite(true)}>
            <Text style={styles.headerButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAddFriend(true)}>
            <Text style={styles.headerButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FriendsList
        userId={user.id}
        onFriendPress={(friend) => {
          // Navigate to friend's profile or trading view
          console.log("Friend pressed:", friend);
        }}
      />

      {/* Add Friend Modal */}
      <Modal
        visible={showAddFriend}
        animationType="slide"
        presentationStyle="pageSheet">
        <AddFriendModal
          userId={user.id}
          onClose={() => setShowAddFriend(false)}
          onFriendAdded={() => {
            setShowAddFriend(false);
            // Refresh friends list
          }}
        />
      </Modal>

      {/* Share Invite Modal */}
      <Modal
        visible={showShareInvite}
        animationType="slide"
        presentationStyle="pageSheet">
        <ShareInviteModal
          userId={user.id}
          onClose={() => setShowShareInvite(false)}
        />
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: "#1A1D2F",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    backgroundColor: "#6674CC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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

export default FriendsScreen;
