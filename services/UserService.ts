import { supabase } from "./SupabaseService";
import {
  Collection,
  CollectionMember,
  CollectionWithDetails,
  CreateCollectionMemberParams,
  CreateCollectionParams,
  CreateFavoriteParams,
  CreatePortfolioParams,
  CreateTransactionParams,
  CreateUserParams,
  Favorite,
  LeaderboardRanking,
  Portfolio,
  PortfolioWithSymbol,
  Transaction,
  TransactionWithDetails,
  UpdateCollectionParams,
  UpdatePortfolioParams,
  UpdateUserParams,
  User,
  UserWithStats,
} from "../types/database";

export class UserService {
  // User Operations
  static async createUser(params: CreateUserParams): Promise<User | null> {
    try {
      const userData = {
        ...params,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("users")
        .insert([userData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching user by username:", error);
      throw error;
    }
  }

  static async updateUser(
    id: string,
    params: UpdateUserParams
  ): Promise<User | null> {
    try {
      const updates = {
        ...params,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  static async updateUserBalance(
    userId: string,
    newBalance: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          usdt_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating user balance:", error);
      throw error;
    }
  }

  // Portfolio Operations
  static async getPortfolio(userId: string): Promise<PortfolioWithSymbol[]> {
    try {
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .eq("user_id", userId)
        .order("symbol");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      throw error;
    }
  }

  static async getPortfolioAsset(
    userId: string,
    symbol: string
  ): Promise<Portfolio | null> {
    try {
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .eq("user_id", userId)
        .eq("symbol", symbol.toUpperCase())
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching portfolio asset:", error);
      throw error;
    }
  }

  static async createPortfolioAsset(
    params: CreatePortfolioParams
  ): Promise<Portfolio | null> {
    try {
      const portfolioData = {
        ...params,
        symbol: params.symbol.toUpperCase(),
        current_price: params.current_price || "0",
        total_value: params.total_value || "0",
        profit_loss: params.profit_loss || "0",
        profit_loss_percent: params.profit_loss_percent || "0",
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("portfolio")
        .insert([portfolioData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating portfolio asset:", error);
      throw error;
    }
  }

  static async updatePortfolioAsset(
    id: string,
    params: UpdatePortfolioParams
  ): Promise<Portfolio | null> {
    try {
      const updates = {
        ...params,
        last_updated: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("portfolio")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating portfolio asset:", error);
      throw error;
    }
  }

  static async deletePortfolioAsset(id: string): Promise<void> {
    try {
      const { error } = await supabase.from("portfolio").delete().eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting portfolio asset:", error);
      throw error;
    }
  }

  // Transaction Operations
  static async getTransactions(
    userId: string,
    limit = 50
  ): Promise<TransactionWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }

  static async createTransaction(
    params: CreateTransactionParams
  ): Promise<Transaction | null> {
    try {
      const transactionData = {
        ...params,
        symbol: params.symbol.toUpperCase(),
        fee: params.fee || "0",
        order_type: params.order_type || "MARKET",
        status: params.status || "COMPLETED",
        timestamp: params.timestamp || new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("transactions")
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  // Collection Operations
  static async getCollections(
    userId?: string
  ): Promise<CollectionWithDetails[]> {
    try {
      let query = supabase
        .from("collections")
        .select(
          `
          *,
          users!collections_owner_id_fkey(username, display_name)
        `
        )
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("owner_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching collections:", error);
      throw error;
    }
  }

  static async getPublicCollections(
    userId?: string,
    limit = 20,
    offset = 0
  ): Promise<CollectionWithDetails[]> {
    try {
      let query = supabase
        .from("collections")
        .select(
          `
          *,
          users!collections_owner_id_fkey(username, display_name)
        `
        )
        .eq("is_public", true)
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      // Filter out collections where user is already a member
      if (userId) {
        const userCollectionIds = await this.getUserCollectionIds(userId);
        return (data || []).filter(
          (collection) => !userCollectionIds.includes(collection.id)
        );
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching public collections:", error);
      throw error;
    }
  }

  static async searchCollections(
    searchTerm: string,
    userId?: string,
    limit = 20
  ): Promise<CollectionWithDetails[]> {
    try {
      let query = supabase
        .from("collections")
        .select(
          `
          *,
          users!collections_owner_id_fkey(username, display_name)
        `
        )
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .eq("is_public", true)
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) throw error;

      // Filter out collections where user is already a member
      if (userId) {
        const userCollectionIds = await this.getUserCollectionIds(userId);
        return (data || []).filter(
          (collection) => !userCollectionIds.includes(collection.id)
        );
      }

      return data || [];
    } catch (error) {
      console.error("Error searching collections:", error);
      throw error;
    }
  }

  static async getUserCollectionIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("collection_members")
        .select("collection_id")
        .eq("user_id", userId);

      if (error) throw error;
      return (data || []).map((member) => member.collection_id);
    } catch (error) {
      console.error("Error fetching user collection IDs:", error);
      return [];
    }
  }

  static async getCollectionById(
    id: string
  ): Promise<CollectionWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from("collections")
        .select(
          `
          *,
          users!collections_owner_id_fkey(username, display_name),
          collection_members(
            *,
            users!collection_members_user_id_fkey(username, display_name, avatar_emoji)
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching collection:", error);
      throw error;
    }
  }

  static async createCollection(
    params: CreateCollectionParams
  ): Promise<Collection | null> {
    try {
      const collectionData = {
        ...params,
        is_public: params.is_public ?? true,
        allow_invites: params.allow_invites ?? true,
        max_members: params.max_members ?? 50,
        starting_balance: params.starting_balance ?? "100000.00",
        duration_days: params.duration_days ?? 30,
        rules: params.rules ?? {},
        total_volume: "0",
        total_trades: 0,
        avg_pnl: "0",
        avg_pnl_percentage: "0",
        member_count: 0,
        status: "ACTIVE",
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("collections")
        .insert([collectionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating collection:", error);
      throw error;
    }
  }

  static async updateCollection(
    id: string,
    params: UpdateCollectionParams
  ): Promise<Collection | null> {
    try {
      const updates = {
        ...params,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("collections")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating collection:", error);
      throw error;
    }
  }

  // Collection Member Operations
  static async joinCollection(
    params: CreateCollectionMemberParams
  ): Promise<CollectionMember | null> {
    try {
      // First check if user is already a member
      const existingMember = await this.getCollectionMember(
        params.collection_id,
        params.user_id
      );

      if (existingMember) {
        throw new Error("You are already a member of this collection");
      }

      // Check if collection exists and is active
      const collection = await this.getCollectionById(params.collection_id);
      if (!collection) {
        throw new Error("Collection not found");
      }

      if (collection.status !== "ACTIVE") {
        throw new Error("This collection is not accepting new members");
      }

      // Check if collection is full
      if (collection.member_count >= collection.max_members) {
        throw new Error("This collection is full");
      }

      const memberData = {
        ...params,
        role: params.role || "MEMBER",
        balance: params.balance || collection.starting_balance || "0",
        total_pnl: "0",
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("collection_members")
        .insert([memberData])
        .select()
        .single();

      if (error) throw error;

      // Update collection member count
      await this.updateCollectionMemberCount(params.collection_id);

      return data;
    } catch (error) {
      console.error("Error joining collection:", error);
      throw error;
    }
  }

  static async joinCollectionByInviteCode(
    inviteCode: string,
    userId: string
  ): Promise<CollectionMember | null> {
    try {
      // Find collection by invite code
      const { data: collection, error: collectionError } = await supabase
        .from("collections")
        .select("*")
        .eq("invite_code", inviteCode)
        .eq("status", "ACTIVE")
        .single();

      if (collectionError || !collection) {
        throw new Error("Invalid or expired invite code");
      }

      // Check if user is already a member
      const existingMember = await this.getCollectionMember(
        collection.id,
        userId
      );

      if (existingMember) {
        throw new Error("You are already a member of this collection");
      }

      // Check if collection is full
      if (collection.member_count >= collection.max_members) {
        throw new Error("This collection is full");
      }

      return await this.joinCollection({
        collection_id: collection.id,
        user_id: userId,
        balance: collection.starting_balance,
      });
    } catch (error) {
      console.error("Error joining collection by invite code:", error);
      throw error;
    }
  }

  static async getCollectionMember(
    collectionId: string,
    userId: string
  ): Promise<CollectionMember | null> {
    try {
      const { data, error } = await supabase
        .from("collection_members")
        .select("*")
        .eq("collection_id", collectionId)
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned
      return data;
    } catch (error) {
      console.error("Error fetching collection member:", error);
      throw error;
    }
  }

  static async updateCollectionMemberCount(
    collectionId: string
  ): Promise<void> {
    try {
      const { data: members, error: countError } = await supabase
        .from("collection_members")
        .select("id", { count: "exact" })
        .eq("collection_id", collectionId);

      if (countError) throw countError;

      const memberCount = members?.length || 0;

      const { error: updateError } = await supabase
        .from("collections")
        .update({ member_count: memberCount })
        .eq("id", collectionId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Error updating collection member count:", error);
      throw error;
    }
  }

  static async leaveCollection(
    collectionId: string,
    userId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("collection_members")
        .delete()
        .eq("collection_id", collectionId)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error leaving collection:", error);
      throw error;
    }
  }

  // Favorite Operations
  static async getFavorites(userId: string): Promise<Favorite[]> {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userId)
        .order("added_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching favorites:", error);
      throw error;
    }
  }

  static async addFavorite(
    params: CreateFavoriteParams
  ): Promise<Favorite | null> {
    try {
      const favoriteData = {
        ...params,
        added_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("favorites")
        .insert([favoriteData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding favorite:", error);
      throw error;
    }
  }

  static async removeFavorite(userId: string, cryptoId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("crypto_id", cryptoId);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing favorite:", error);
      throw error;
    }
  }

  // Leaderboard Operations
  static async getLeaderboard(
    period: "WEEKLY" | "MONTHLY" | "ALL_TIME",
    collectionId?: string,
    limit = 50
  ): Promise<LeaderboardRanking[]> {
    try {
      let query = supabase
        .from("leaderboard_rankings")
        .select(
          `
          *,
          users(username, display_name, avatar_emoji)
        `
        )
        .eq("period", period)
        .order("rank", { ascending: true })
        .limit(limit);

      if (collectionId) {
        query = query.eq("collection_id", collectionId);
      } else {
        query = query.is("collection_id", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      throw error;
    }
  }

  // Utility Methods
  static async getUserStats(userId: string): Promise<UserWithStats | null> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return null;

      const portfolio = await this.getPortfolio(userId);
      const totalValue = portfolio.reduce(
        (sum, asset) => sum + parseFloat(asset.total_value || "0"),
        0
      );
      const totalAssets = portfolio.length;

      const stats: UserWithStats = {
        ...user,
        portfolio_value: (totalValue || 0).toString(),
        total_assets: totalAssets,
        best_performing_asset:
          portfolio.length > 0
            ? portfolio.reduce((best, current) =>
                parseFloat(current.profit_loss_percent || "0") >
                parseFloat(best.profit_loss_percent || "0")
                  ? current
                  : best
              ).symbol
            : undefined,
        worst_performing_asset:
          portfolio.length > 0
            ? portfolio.reduce((worst, current) =>
                parseFloat(current.profit_loss_percent || "0") <
                parseFloat(worst.profit_loss_percent || "0")
                  ? current
                  : worst
              ).symbol
            : undefined,
      };

      return stats;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw error;
    }
  }
}
