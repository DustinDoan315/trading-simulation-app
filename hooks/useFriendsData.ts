import { FriendsService } from '@/services/FriendsService';
import { FriendWithDetails } from '@/types/database';
import { useCallback, useEffect, useState } from 'react';


export interface UseFriendsDataReturn {
  friends: FriendWithDetails[];
  pendingRequests: FriendWithDetails[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  sendFriendRequest: (friendId: string, message?: string) => Promise<void>;
  acceptFriendRequest: (friendId: string) => Promise<void>;
  rejectFriendRequest: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

export const useFriendsData = (userId: string): UseFriendsDataReturn => {
  const [friends, setFriends] = useState<FriendWithDetails[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const [friendsData, pendingData] = await Promise.all([
        FriendsService.getFriends(userId),
        FriendsService.getPendingRequests(userId),
      ]);

      setFriends(friendsData);
      setPendingRequests(pendingData);
    } catch (err) {
      console.error('Error loading friends:', err);
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = useCallback(async () => {
    await loadFriends();
  }, [userId]);

  const sendFriendRequest = useCallback(async (friendId: string, message?: string) => {
    try {
      await FriendsService.sendFriendRequest({
        user_id: userId,
        friend_id: friendId,
        message,
      });
      // Refresh the data after sending request
      await loadFriends();
    } catch (err) {
      console.error('Error sending friend request:', err);
      throw err;
    }
  }, [userId]);

  const acceptFriendRequest = useCallback(async (friendId: string) => {
    try {
      await FriendsService.updateFriendStatus({
        user_id: userId,
        friend_id: friendId,
        status: 'ACCEPTED',
      });
      // Refresh the data after accepting
      await loadFriends();
    } catch (err) {
      console.error('Error accepting friend request:', err);
      throw err;
    }
  }, [userId]);

  const rejectFriendRequest = useCallback(async (friendId: string) => {
    try {
      await FriendsService.updateFriendStatus({
        user_id: userId,
        friend_id: friendId,
        status: 'REJECTED',
      });
      // Refresh the data after rejecting
      await loadFriends();
    } catch (err) {
      console.error('Error rejecting friend request:', err);
      throw err;
    }
  }, [userId]);

  const removeFriend = useCallback(async (friendId: string) => {
    try {
      await FriendsService.removeFriend(userId, friendId);
      // Refresh the data after removing
      await loadFriends();
    } catch (err) {
      console.error('Error removing friend:', err);
      throw err;
    }
  }, [userId]);

  useEffect(() => {
    loadFriends();
  }, [userId]);

  return {
    friends,
    pendingRequests,
    isLoading,
    error,
    refresh,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  };
}; 