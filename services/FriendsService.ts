import { logger } from "@/utils/logger";
import { supabase } from "./SupabaseService";
import {
  AcceptFriendInvitationParams,
  CreateFriendInvitationParams,
  Friend,
  FriendInvitation,
  FriendWithDetails,
  SendFriendRequestParams,
  UpdateFriendStatusParams,
} from "../types/database";

export class FriendsService {
  // Create a new friend invitation
  static async createInvitation(
    params: CreateFriendInvitationParams
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc("create_friend_invitation", {
        p_created_by: params.created_by,
        p_max_uses: params.max_uses || 10,
        p_expires_at: params.expires_at || null,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error creating friend invitation", "FriendsService", error);
      throw error;
    }
  }

  // Accept a friend invitation
  static async acceptInvitation(
    params: AcceptFriendInvitationParams
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("accept_friend_invitation", {
        p_invite_code: params.invite_code,
        p_user_id: params.user_id,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(
        "Error accepting friend invitation",
        "FriendsService",
        error
      );
      throw error;
    }
  }

  // Get user's friends list
  static async getFriends(userId: string): Promise<FriendWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from("friends")
        .select(
          `
          *,
          friend:users!friends_friend_id_fkey(
            id,
            username,
            display_name,
            avatar_emoji,
            total_pnl,
            total_pnl_percentage,
            total_portfolio_value,
            global_rank,
            last_active,
            is_active
          )
        `
        )
        .eq("user_id", userId)
        .eq("status", "ACCEPTED")
        .order("accepted_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching friends", "FriendsService", error);
      throw error;
    }
  }

  // Get pending friend requests
  static async getPendingRequests(
    userId: string
  ): Promise<FriendWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from("friends")
        .select(
          `
          *,
          user:users!friends_user_id_fkey(
            id,
            username,
            display_name,
            avatar_emoji
          )
        `
        )
        .eq("friend_id", userId)
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching pending requests", "FriendsService", error);
      throw error;
    }
  }

  // Send a friend request
  static async sendFriendRequest(
    params: SendFriendRequestParams
  ): Promise<Friend | null> {
    try {
      // Check if friendship already exists
      const existingFriendship = await this.getFriendship(
        params.user_id,
        params.friend_id
      );
      if (existingFriendship) {
        throw new Error("Friendship already exists");
      }

      const friendData = {
        user_id: params.user_id,
        friend_id: params.friend_id,
        status: "PENDING" as const,
        message: params.message,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("friends")
        .insert([friendData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error sending friend request", "FriendsService", error);
      throw error;
    }
  }

  // Update friend request status
  static async updateFriendStatus(
    params: UpdateFriendStatusParams
  ): Promise<void> {
    try {
      const updates: any = {
        status: params.status,
        updated_at: new Date().toISOString(),
      };

      if (params.status === "ACCEPTED") {
        updates.accepted_at = new Date().toISOString();
      }

      // Update both directions of the friendship
      const { error: error1 } = await supabase
        .from("friends")
        .update(updates)
        .eq("user_id", params.user_id)
        .eq("friend_id", params.friend_id);

      const { error: error2 } = await supabase
        .from("friends")
        .update(updates)
        .eq("user_id", params.friend_id)
        .eq("friend_id", params.user_id);

      if (error1) throw error1;
      if (error2) throw error2;
    } catch (error) {
      logger.error("Error updating friend status", "FriendsService", error);
      throw error;
    }
  }

  // Remove friend
  static async removeFriend(userId: string, friendId: string): Promise<void> {
    try {
      // Delete both directions of the friendship
      const { error: error1 } = await supabase
        .from("friends")
        .delete()
        .eq("user_id", userId)
        .eq("friend_id", friendId);

      const { error: error2 } = await supabase
        .from("friends")
        .delete()
        .eq("user_id", friendId)
        .eq("friend_id", userId);

      if (error1) throw error1;
      if (error2) throw error2;
    } catch (error) {
      logger.error("Error removing friend", "FriendsService", error);
      throw error;
    }
  }

  // Get friendship status between two users
  static async getFriendship(
    userId: string,
    friendId: string
  ): Promise<Friend | null> {
    try {
      const { data, error } = await supabase
        .from("friends")
        .select("*")
        .eq("user_id", userId)
        .eq("friend_id", friendId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned
      return data;
    } catch (error) {
      logger.error("Error fetching friendship", "FriendsService", error);
      throw error;
    }
  }

  // Search users by username
  static async searchUsers(
    searchTerm: string,
    currentUserId: string,
    limit = 20
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          username,
          display_name,
          avatar_emoji,
          total_pnl,
          total_pnl_percentage,
          total_portfolio_value,
          global_rank,
          last_active,
          is_active
        `
        )
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .neq("id", currentUserId)
        .limit(limit)
        .order("username");

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error searching users", "FriendsService", error);
      throw error;
    }
  }

  // Get user's active invitations
  static async getUserInvitations(userId: string): Promise<FriendInvitation[]> {
    try {
      const { data, error } = await supabase
        .from("friend_invitations")
        .select("*")
        .eq("created_by", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching user invitations", "FriendsService", error);
      throw error;
    }
  }

  // Deactivate an invitation
  static async deactivateInvitation(inviteCode: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("friend_invitations")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("invite_code", inviteCode);

      if (error) throw error;
    } catch (error) {
      logger.error("Error deactivating invitation", "FriendsService", error);
      throw error;
    }
  }

  // Get friends leaderboard data
  static async getFriendsLeaderboard(
    userId: string,
    period: "WEEKLY" | "MONTHLY" | "ALL_TIME" = "ALL_TIME",
    limit = 50
  ): Promise<any[]> {
    try {
      // Get user's friends
      const friends = await this.getFriends(userId);
      const friendIds = friends.map((f) => f.friend_id);

      if (friendIds.length === 0) {
        return [];
      }

      // Get leaderboard rankings for friends
      const { data, error } = await supabase
        .from("leaderboard_rankings")
        .select(
          `
          *,
          users!leaderboard_rankings_user_id_fkey(
            id,
            username,
            display_name,
            avatar_emoji,
            total_pnl,
            total_pnl_percentage,
            total_portfolio_value,
            global_rank,
            last_active,
            is_active
          )
        `
        )
        .in("user_id", friendIds)
        .eq("period", period)
        .order("rank", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(
        "Error fetching friends leaderboard",
        "FriendsService",
        error
      );
      throw error;
    }
  }
}
