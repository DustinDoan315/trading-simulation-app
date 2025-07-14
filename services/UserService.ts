import { logger } from '@/utils/logger';
import { supabase } from './SupabaseService';
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
      logger.error("Error creating user", "UserService", error);
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
      logger.error("Error fetching user", "UserService", error);
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
      logger.error("Error fetching user by username", "UserService", error);
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
      logger.error("Error updating user", "UserService", error);
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
      logger.error("Error updating user balance", "UserService", error);
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
      logger.error("Error fetching portfolio", "UserService", error);
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
      logger.error("Error fetching portfolio asset", "UserService", error);
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
      logger.error("Error creating portfolio asset", "UserService", error);
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
      logger.error("Error updating portfolio asset", "UserService", error);
      throw error;
    }
  }

  static async deletePortfolioAsset(id: string): Promise<void> {
    try {
      const { error } = await supabase.from("portfolio").delete().eq("id", id);

      if (error) throw error;
    } catch (error) {
      logger.error("Error deleting portfolio asset", "UserService", error);
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
      logger.error("Error fetching transactions", "UserService", error);
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
      logger.error("Error creating transaction", "UserService", error);
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
      logger.error("Error fetching collections", "UserService", error);
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
      logger.error("Error fetching public collections", "UserService", error);
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
      logger.error("Error searching collections", "UserService", error);
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
      logger.error("Error fetching user collection IDs", "UserService", error);
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
      logger.error("Error fetching collection", "UserService", error);
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
        member_count: 1, // Start with 1 member (the owner)
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

      // Automatically add the owner as a member
      if (data) {
        const ownerMemberData = {
          collection_id: data.id,
          user_id: params.owner_id,
          role: "OWNER",
          starting_balance: params.starting_balance ?? "100000.00",
          current_balance: params.starting_balance ?? "100000.00",
          total_pnl: "0",
          total_pnl_percentage: "0",
          total_trades: 0,
          win_rate: "0",
          rank: 1, // Owner is always rank 1
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        const { error: memberError } = await supabase
          .from("collection_members")
          .insert([ownerMemberData]);

        if (memberError) {
          logger.error("Error adding owner as member", "UserService", memberError);
          // Don't throw error here as collection was created successfully
        } else {
          logger.info("Owner automatically added as collection member", "UserService");
        }
      }

      return data;
    } catch (error) {
      logger.error("Error creating collection", "UserService", error);
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
      logger.error("Error updating collection", "UserService", error);
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
      logger.error("Error joining collection", "UserService", error);
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
      logger.error("Error joining collection by invite code", "UserService", error);
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
      logger.error("Error fetching collection member", "UserService", error);
      throw error;
    }
  }

  static async getCollectionMembers(
    collectionId: string
  ): Promise<CollectionMember[]> {
    try {
      // First get the collection to ensure it exists and get owner info
      const collection = await this.getCollectionById(collectionId);
      if (!collection) {
        throw new Error("Collection not found");
      }

      const { data, error } = await supabase
        .from("collection_members")
        .select(
          `
          *,
          users!collection_members_user_id_fkey(
            username,
            display_name,
            avatar_emoji
          )
        `
        )
        .eq("collection_id", collectionId)
        .order("rank", { ascending: true })
        .order("total_pnl", { ascending: false });

      if (error) throw error;

      let members = data || [];

      // If no members found, ensure the owner is included
      if (members.length === 0 && collection.owner_id) {
        logger.warn("No members found, ensuring owner is included", "UserService");

        // Get owner user details
        const ownerUser = await this.getUserById(collection.owner_id);
        if (ownerUser) {
          // Create a virtual member entry for the owner
          const ownerMember = {
            id: `owner-${collection.owner_id}`,
            collection_id: collectionId,
            user_id: collection.owner_id,
            role: "OWNER" as const,
            starting_balance: collection.starting_balance || "100000.00",
            current_balance: collection.starting_balance || "100000.00",
            total_pnl: "0",
            total_pnl_percentage: "0",
            total_trades: 0,
            win_rate: "0",
            rank: 1,
            joined_at: collection.created_at,
            created_at: collection.created_at,
            users: {
              username: ownerUser.username,
              display_name: ownerUser.display_name,
              avatar_emoji: ownerUser.avatar_emoji,
            },
          };
          members = [ownerMember];
        }
      }

      return members;
    } catch (error) {
      logger.error("Error fetching collection members", "UserService", error);
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
      logger.error("Error updating collection member count", "UserService", error);
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
      logger.error("Error leaving collection", "UserService", error);
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
      logger.error("Error fetching favorites", "UserService", error);
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
      logger.error("Error adding favorite", "UserService", error);
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
      logger.error("Error removing favorite", "UserService", error);
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
          users!leaderboard_rankings_user_id_fkey(
            username, 
            display_name, 
            avatar_emoji,
            total_pnl,
            total_pnl_percentage,
            total_portfolio_value
          )
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
      logger.error("Error fetching leaderboard", "UserService", error);
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
      logger.error("Error fetching user stats", "UserService", error);
      throw error;
    }
  }

  // Leaderboard Update Methods
  private static updateTimeout: Map<string, ReturnType<typeof setTimeout>> = new Map();

  static async updateLeaderboardRankings(userId: string): Promise<void> {
    try {
      // Clear existing timeout for this user
      if (this.updateTimeout.has(userId)) {
        clearTimeout(this.updateTimeout.get(userId)!);
      }

      // Debounce updates to prevent excessive calls
      const timeoutId = setTimeout(async () => {
        try {
          await this.performLeaderboardUpdate(userId);
        } catch (error) {
          logger.error("Error in debounced leaderboard update", "UserService", error);
        } finally {
          this.updateTimeout.delete(userId);
        }
      }, 1000); // 1 second debounce

      this.updateTimeout.set(userId, timeoutId);
    } catch (error) {
      logger.error("Error setting up debounced leaderboard update", "UserService", error);
      throw error;
    }
  }

  private static async performLeaderboardUpdate(userId: string): Promise<void> {
    try {
      // Get user's current portfolio and stats
      const portfolio = await this.getPortfolio(userId);
      const user = await this.getUserById(userId);

      if (!user) return;

      // Check if user has made any trades (has portfolio items other than USDT)
      const hasTraded = portfolio.some(
        (asset) =>
          asset.symbol.toUpperCase() !== "USDT" &&
          parseFloat(asset.quantity || "0") > 0
      );

      // If user hasn't traded yet, remove them from leaderboard rankings
      if (!hasTraded) {
        await this.removeUserFromLeaderboard(userId);
        logger.info(
          `Removed user ${userId} from leaderboard (no trades yet)`,
          "UserService"
        );
        return;
      }

      // Calculate real-time P&L and portfolio value from current portfolio data
      let totalPnL = 0;
      let totalPortfolioValue = 0;
      const initialBalance = parseFloat(user.initial_balance || "100000");

      // Calculate from portfolio items with current prices
      portfolio.forEach((item) => {
        const quantity = parseFloat(item.quantity || "0");
        const currentPrice = parseFloat(item.current_price || item.avg_cost || "0");
        const avgCost = parseFloat(item.avg_cost || "0");
        const totalValue = quantity * currentPrice;
        
        totalPortfolioValue += totalValue;
        
        // Calculate P&L for non-USDT items
        if (item.symbol.toUpperCase() !== "USDT") {
          const costBasis = quantity * avgCost;
          const itemPnL = totalValue - costBasis;
          totalPnL += itemPnL;
        }
      });

      // Calculate P&L percentage
      const totalPnLPercentage = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

      logger.info(
        `Updating leaderboard for user ${userId}: P&L=${totalPnL}, Portfolio=${totalPortfolioValue}, Return=${totalPnLPercentage}%`,
        "UserService"
      );

      // Update or create leaderboard rankings for ALL_TIME period only
      const calculatedRank = await this.calculateUserRank(
        userId,
        "ALL_TIME",
        totalPnL,
        totalPortfolioValue
      );

      await this.upsertLeaderboardRanking({
        user_id: userId,
        period: "ALL_TIME",
        total_pnl: totalPnL.toString(),
        total_pnl_percentage: totalPnLPercentage.toString(),
        total_portfolio_value: totalPortfolioValue.toString(),
        total_trades: portfolio.length,
        rank: calculatedRank,
      });

      // Update user's P&L data and global rank in the users table with real-time values
      const userUpdateData = {
        total_pnl: totalPnL.toString(),
        total_pnl_percentage: totalPnLPercentage.toString(),
        total_portfolio_value: totalPortfolioValue.toString(),
        global_rank: calculatedRank,
      } as any; // Use any to bypass type checking for this specific case

      logger.info(
        `Updating user ${userId} with real-time values:`,
        "UserService",
        userUpdateData
      );

      const updatedUser = await this.updateUser(userId, userUpdateData);

      if (updatedUser) {
        logger.info(
          `Successfully updated user ${userId} with real-time values`,
          "UserService",
          {
            total_pnl: updatedUser.total_pnl,
            total_pnl_percentage: updatedUser.total_pnl_percentage,
            total_portfolio_value: updatedUser.total_portfolio_value,
            global_rank: updatedUser.global_rank,
          }
        );
      } else {
        logger.error(
          `Failed to update user ${userId} with real-time values`,
          "UserService"
        );
      }

      logger.info(
        `Updated leaderboard rankings for user ${userId} with real-time calculated values`,
        "UserService"
      );
    } catch (error) {
      logger.error("Error updating leaderboard rankings", "UserService", error);
      throw error;
    }
  }

  // Calculate user's rank based on performance
  private static async calculateUserRank(
    userId: string,
    period: "WEEKLY" | "MONTHLY" | "ALL_TIME",
    userTotalPnL: number,
    userPortfolioValue: number
  ): Promise<number> {
    try {
      // Get all users with their P&L and portfolio values for this period
      const { data: allRankings, error } = await supabase
        .from("leaderboard_rankings")
        .select("user_id, total_pnl, portfolio_value")
        .eq("period", period)
        .is("collection_id", null);

      if (error) throw error;

      // Add current user's data if not already in rankings
      const rankings = allRankings || [];
      const userExists = rankings.some((r) => r.user_id === userId);

      if (!userExists) {
        rankings.push({
          user_id: userId,
          total_pnl: userTotalPnL.toString(),
          portfolio_value: userPortfolioValue.toString(),
        });
      }

      // Sort by total P&L (descending), then by portfolio value (descending)
      rankings.sort((a, b) => {
        const pnlA = parseFloat(a.total_pnl || "0");
        const pnlB = parseFloat(b.total_pnl || "0");

        if (pnlA !== pnlB) {
          return pnlB - pnlA; // Higher P&L first
        }

        // If P&L is equal, sort by portfolio value
        const portfolioA = parseFloat(a.portfolio_value || "0");
        const portfolioB = parseFloat(b.portfolio_value || "0");
        return portfolioB - portfolioA; // Higher portfolio value first
      });

      // Find user's position (1-based rank)
      const userRank = rankings.findIndex((r) => r.user_id === userId) + 1;

      return userRank > 0 ? userRank : 1; // Ensure rank is at least 1
    } catch (error) {
      logger.error("Error calculating user rank", "UserService", error);
      return 1; // Default to rank 1 if calculation fails
    }
  }

  // Recalculate all ranks for consistency (ALL_TIME period only)
  static async recalculateAllRanks(): Promise<void> {
    try {
      // Get all rankings for ALL_TIME period, sorted by performance
      const { data: rankings, error } = await supabase
        .from("leaderboard_rankings")
        .select("id, total_pnl, portfolio_value")
        .eq("period", "ALL_TIME")
        .is("collection_id", null)
        .order("total_pnl", { ascending: false })
        .order("portfolio_value", { ascending: false });

      if (error) throw error;

      // Update ranks based on sorted order
      for (let i = 0; i < (rankings || []).length; i++) {
        const ranking = rankings![i];
        const newRank = i + 1;

        await supabase
          .from("leaderboard_rankings")
          .update({ rank: newRank })
          .eq("id", ranking.id);
      }
    } catch (error) {
      logger.error("Error recalculating all ranks", "UserService", error);
    }
  }

  // Remove user from leaderboard when they haven't traded
  private static async removeUserFromLeaderboard(
    userId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("leaderboard_rankings")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
    } catch (error) {
      logger.error("Error removing user from leaderboard", "UserService", error);
      throw error;
    }
  }

  // Check if user should be added to leaderboard (first trade)
  static async checkAndAddUserToLeaderboard(userId: string): Promise<void> {
    try {
      const portfolio = await this.getPortfolio(userId);
      const user = await this.getUserById(userId);

      if (!user) return;

      // Check if user has made any trades (has portfolio items other than USDT)
      const hasTraded = portfolio.some(
        (asset) =>
          asset.symbol.toUpperCase() !== "USDT" &&
          parseFloat(asset.quantity || "0") > 0
      );

      if (hasTraded) {
        // User has traded, add them to leaderboard
        await this.updateLeaderboardRankings(userId);
        logger.info(
          `Added user ${userId} to leaderboard (first trade detected)`,
          "UserService"
        );
      }
    } catch (error) {
      logger.error("Error checking user leaderboard status", "UserService", error);
      throw error;
    }
  }

  // Get user's current rank for a specific period
  static async getUserRank(
    userId: string,
    period: "WEEKLY" | "MONTHLY" | "ALL_TIME" = "ALL_TIME"
  ): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from("leaderboard_rankings")
        .select("rank")
        .eq("user_id", userId)
        .eq("period", period)
        .is("collection_id", null)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned
      return data?.rank || null;
    } catch (error) {
      logger.error("Error getting user rank", "UserService", error);
      return null;
    }
  }

  // Initialize leaderboard rankings for all users (run once to set up initial rankings)
  static async initializeLeaderboardRankings(): Promise<void> {
    try {
      logger.info("Initializing leaderboard rankings for all users...", "UserService");

      // First, clean up any duplicate or old entries (remove WEEKLY and MONTHLY entries)
      await this.cleanupLeaderboardRankings();

      // Get all users
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id");

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        logger.info("No users found for leaderboard initialization", "UserService");
        return;
      }

      // Update rankings for each user (ALL_TIME period only)
      for (const user of users) {
        try {
          await this.updateLeaderboardRankings(user.id);
        } catch (error) {
          logger.error(`Error updating rankings for user ${user.id}`, "UserService", error);
          // Continue with other users even if one fails
        }
      }

      logger.info(
        `Leaderboard rankings initialized for ${users.length} users`,
        "UserService"
      );
    } catch (error) {
      logger.error("Error initializing leaderboard rankings", "UserService", error);
      throw error;
    }
  }

  // Clean up leaderboard rankings to remove duplicates and old periods
  static async cleanupLeaderboardRankings(): Promise<void> {
    try {
      logger.info("Cleaning up leaderboard rankings...", "UserService");

      // Remove WEEKLY and MONTHLY entries (keep only ALL_TIME)
      const { error: deleteError } = await supabase
        .from("leaderboard_rankings")
        .delete()
        .in("period", ["WEEKLY", "MONTHLY"]);

      if (deleteError) {
        logger.error("Error cleaning up leaderboard rankings", "UserService", deleteError);
      } else {
        logger.info("Cleaned up WEEKLY and MONTHLY leaderboard entries", "UserService");
      }

      // Remove duplicate entries for the same user (keep only the latest)
      const { data: duplicates, error: duplicateError } = await supabase
        .from("leaderboard_rankings")
        .select("user_id, period, collection_id, created_at")
        .eq("period", "ALL_TIME")
        .is("collection_id", null)
        .order("created_at", { ascending: false });

      if (duplicateError) {
        logger.error("Error finding duplicate entries", "UserService", duplicateError);
        return;
      }

      if (duplicates) {
        const seenUsers = new Set<string>();
        const toDelete: string[] = [];

        for (const entry of duplicates) {
          const key = `${entry.user_id}-${entry.period}-${entry.collection_id}`;
          if (seenUsers.has(key)) {
            toDelete.push(entry.user_id);
          } else {
            seenUsers.add(key);
          }
        }

        if (toDelete.length > 0) {
          const { error: deleteDuplicatesError } = await supabase
            .from("leaderboard_rankings")
            .delete()
            .in("user_id", toDelete)
            .eq("period", "ALL_TIME")
            .is("collection_id", null);

          if (deleteDuplicatesError) {
            logger.error("Error deleting duplicate entries", "UserService", deleteDuplicatesError);
          } else {
            logger.info(`Deleted ${toDelete.length} duplicate leaderboard entries`, "UserService");
          }
        }
      }
    } catch (error) {
      logger.error("Error during leaderboard cleanup", "UserService", error);
    }
  }

  // Get leaderboard statistics
  static async getLeaderboardStats(
    period: "WEEKLY" | "MONTHLY" | "ALL_TIME" = "ALL_TIME"
  ): Promise<{
    totalUsers: number;
    topPerformer: { userId: string; rank: number; pnl: string } | null;
    averagePnL: number;
  }> {
    try {
      const { data: rankings, error } = await supabase
        .from("leaderboard_rankings")
        .select("user_id, rank, total_pnl")
        .eq("period", period)
        .is("collection_id", null)
        .order("rank", { ascending: true });

      if (error) throw error;

      const rankingsList = rankings || [];
      const totalUsers = rankingsList.length;

      const topPerformer =
        totalUsers > 0
          ? {
              userId: rankingsList[0].user_id,
              rank: rankingsList[0].rank,
              pnl: rankingsList[0].total_pnl,
            }
          : null;

      const averagePnL =
        totalUsers > 0
          ? rankingsList.reduce(
              (sum, r) => sum + parseFloat(r.total_pnl || "0"),
              0
            ) / totalUsers
          : 0;

      return {
        totalUsers,
        topPerformer,
        averagePnL,
      };
    } catch (error) {
      logger.error("Error getting leaderboard stats", "UserService", error);
      return {
        totalUsers: 0,
        topPerformer: null,
        averagePnL: 0,
      };
    }
  }

  private static async upsertLeaderboardRanking(params: {
    user_id: string;
    period: "WEEKLY" | "MONTHLY" | "ALL_TIME";
    total_pnl: string;
    total_pnl_percentage: string;
    total_portfolio_value: string;
    total_trades: number;
    rank: number;
    collection_id?: string | null;
  }): Promise<void> {
    try {
      // First, delete any existing entries for this user and period to prevent duplicates
      const { error: deleteError } = await supabase
        .from("leaderboard_rankings")
        .delete()
        .eq("user_id", params.user_id)
        .eq("period", params.period)
        .is("collection_id", params.collection_id || null);

      if (deleteError) {
        logger.warn("Error deleting existing leaderboard entries", "UserService", deleteError);
        // Continue anyway, the insert might still work
      }

      const rankingData = {
        user_id: params.user_id,
        period: params.period,
        total_pnl: params.total_pnl,
        percentage_return: params.total_pnl_percentage, // Use percentage_return to match database schema
        portfolio_value: params.total_portfolio_value, // Use portfolio_value to match database schema
        trade_count: params.total_trades, // Use trade_count to match database schema
        rank: params.rank,
        collection_id: params.collection_id || null,
        calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Insert new entry (since we deleted any existing ones)
      const { error } = await supabase
        .from("leaderboard_rankings")
        .insert([rankingData]);
      
      if (error) {
        // If insert fails due to unique constraint, try update instead
        if (error.code === '23505') { // Unique violation
          logger.warn("Unique constraint violation, trying update instead", "UserService", error);
          
          const { error: updateError } = await supabase
            .from("leaderboard_rankings")
            .update(rankingData)
            .eq("user_id", params.user_id)
            .eq("period", params.period)
            .is("collection_id", params.collection_id || null);
          
          if (updateError) throw updateError;
          logger.info(`Updated leaderboard ranking for user ${params.user_id}`, "UserService");
        } else {
          throw error;
        }
      } else {
        logger.info(`Created new leaderboard ranking for user ${params.user_id}`, "UserService");
      }
    } catch (error) {
      logger.error("Error upserting leaderboard ranking", "UserService", error);
      throw error;
    }
  }

  // Reset user data to default values while keeping the same user ID
  static async resetUserDataToDefault(userId: string): Promise<{
    success: boolean;
    error?: string;
    details: {
      portfolio: boolean;
      transactions: boolean;
      favorites: boolean;
      leaderboard: boolean;
      userProfile: boolean;
    };
  }> {
    const result: {
      success: boolean;
      error?: string;
      details: {
        portfolio: boolean;
        transactions: boolean;
        favorites: boolean;
        leaderboard: boolean;
        userProfile: boolean;
      };
    } = {
      success: true,
      details: {
        portfolio: false,
        transactions: false,
        favorites: false,
        leaderboard: false,
        userProfile: false,
      },
    };

    try {
      logger.info(`Starting user data reset for user: ${userId}`, "UserService");

      // Step 1: Clear portfolio data
      try {
        const { error: portfolioError } = await supabase
          .from("portfolio")
          .delete()
          .eq("user_id", userId);

        if (portfolioError) {
          logger.error("Error clearing portfolio data", "UserService", portfolioError);
          result.success = false;
          result.error = `Portfolio clear failed: ${portfolioError.message}`;
        } else {
          result.details.portfolio = true;
          logger.info("Portfolio data cleared successfully", "UserService");
        }
      } catch (error) {
        logger.error("Error clearing portfolio data", "UserService", error);
        result.success = false;
        result.error = `Portfolio clear failed: ${error}`;
      }

      // Step 2: Clear transaction history
      try {
        const { error: transactionError } = await supabase
          .from("transactions")
          .delete()
          .eq("user_id", userId);

        if (transactionError) {
          logger.error("Error clearing transaction data", "UserService", transactionError);
          // Don't fail the entire reset if transactions fail
          logger.warn("Transaction clear failed, but continuing with reset", "UserService");
        } else {
          result.details.transactions = true;
          logger.info("Transaction data cleared successfully", "UserService");
        }
      } catch (error) {
        logger.error("Error clearing transaction data", "UserService", error);
        // Don't fail the entire reset if transactions fail
        logger.warn("Transaction clear failed, but continuing with reset", "UserService");
      }

      // Step 3: Clear favorites
      try {
        const { error: favoritesError } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId);

        if (favoritesError) {
          logger.error("Error clearing favorites data", "UserService", favoritesError);
          // Don't fail the entire reset if favorites fail
          logger.warn("Favorites clear failed, but continuing with reset", "UserService");
        } else {
          result.details.favorites = true;
          logger.info("Favorites data cleared successfully", "UserService");
        }
      } catch (error) {
        logger.error("Error clearing favorites data", "UserService", error);
        // Don't fail the entire reset if favorites fail
        logger.warn("Favorites clear failed, but continuing with reset", "UserService");
      }

      // Step 4: Remove from leaderboard rankings
      try {
        const { error: leaderboardError } = await supabase
          .from("leaderboard_rankings")
          .delete()
          .eq("user_id", userId);

        if (leaderboardError) {
          logger.error("Error removing from leaderboard", "UserService", leaderboardError);
          // Don't fail the entire reset if leaderboard fails
          logger.warn("Leaderboard removal failed, but continuing with reset", "UserService");
        } else {
          result.details.leaderboard = true;
          logger.info("User removed from leaderboard successfully", "UserService");
        }
      } catch (error) {
        logger.error("Error removing from leaderboard", "UserService", error);
        // Don't fail the entire reset if leaderboard fails
        logger.warn("Leaderboard removal failed, but continuing with reset", "UserService");
      }

      // Step 5: Reset user profile to default values
      try {
        const defaultUserData = {
          usdt_balance: "100000.00",
          total_portfolio_value: "100000.00",
          initial_balance: "100000.00",
          total_pnl: "0.00",
          total_pnl_percentage: "0.00",
          total_trades: 0,
          total_buy_volume: "0.00",
          total_sell_volume: "0.00",
          win_rate: "0.00",
          global_rank: null,
          last_trade_at: null,
          updated_at: new Date().toISOString(),
        };

        const { error: userError } = await supabase
          .from("users")
          .update(defaultUserData)
          .eq("id", userId);

        if (userError) {
          logger.error("Error resetting user profile", "UserService", userError);
          result.success = false;
          result.error = `User profile reset failed: ${userError.message}`;
        } else {
          result.details.userProfile = true;
          logger.info("User profile reset to default successfully", "UserService");
        }
      } catch (error) {
        logger.error("Error resetting user profile", "UserService", error);
        result.success = false;
        result.error = `User profile reset failed: ${error}`;
      }

      if (result.success) {
        logger.info(`User data reset completed successfully for user: ${userId}`, "UserService", result.details);
      } else {
        logger.error(`User data reset failed for user: ${userId}`, "UserService", result.error);
      }

      return result;
    } catch (error) {
      logger.error("Error during user data reset", "UserService", error);
      return {
        success: false,
        error: `Reset failed: ${error}`,
        details: result.details,
      };
    }
  }

  // Static method to manually refresh leaderboard rankings (for testing real-time updates)
  static async refreshLeaderboardRankings(userId: string): Promise<void> {
    try {
      logger.info(`Manually refreshing leaderboard rankings for user ${userId}`, "UserService");
      await this.updateLeaderboardRankings(userId);
      logger.info(`Leaderboard rankings refreshed for user ${userId}`, "UserService");
    } catch (error) {
      logger.error(`Error refreshing leaderboard rankings for user ${userId}`, "UserService", error);
      throw error;
    }
  }

  // Static method to refresh all users' leaderboard rankings
  static async refreshAllLeaderboardRankings(): Promise<void> {
    try {
      logger.info("Refreshing leaderboard rankings for all users", "UserService");
      
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id");

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        logger.info("No users found for leaderboard refresh", "UserService");
        return;
      }

      // Update rankings for each user
      for (const user of users) {
        try {
          await this.updateLeaderboardRankings(user.id);
        } catch (error) {
          logger.error(`Error updating rankings for user ${user.id}`, "UserService", error);
          // Continue with other users even if one fails
        }
      }

      logger.info(
        `Leaderboard rankings refreshed for ${users.length} users`,
        "UserService"
      );
    } catch (error) {
      logger.error("Error refreshing all leaderboard rankings", "UserService", error);
      throw error;
    }
  }

  // Static method to force update all users' real-time data in the users table
  // This method ensures that all users have up-to-date P&L values in the users table
  // which will automatically update the leaderboard when the users table changes
  static async forceUpdateAllUsersRealTimeData(): Promise<void> {
    try {
      logger.info("Force updating all users' real-time data", "UserService");
      
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id");

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        logger.info("No users found for real-time data update", "UserService");
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Update real-time data for each user
      for (const user of users) {
        try {
          // Get user's current portfolio and calculate real-time values
          const portfolio = await this.getPortfolio(user.id);
          const userData = await this.getUserById(user.id);

          if (!userData) continue;

          // Check if user has made any trades
          const hasTraded = portfolio.some(
            (asset) =>
              asset.symbol.toUpperCase() !== "USDT" &&
              parseFloat(asset.quantity || "0") > 0
          );

          if (!hasTraded) {
            // Reset to default values for users who haven't traded
            await this.updateUser(user.id, {
              total_pnl: "0",
              total_pnl_percentage: "0",
              total_portfolio_value: userData.initial_balance || "100000.00",
              global_rank: undefined,
            } as any);
            successCount++;
            continue;
          }

          // Calculate real-time P&L and portfolio value
          let totalPnL = 0;
          let totalPortfolioValue = 0;
          const initialBalance = parseFloat(userData.initial_balance || "100000");

          portfolio.forEach((item) => {
            const quantity = parseFloat(item.quantity || "0");
            const currentPrice = parseFloat(item.current_price || item.avg_cost || "0");
            const avgCost = parseFloat(item.avg_cost || "0");
            const totalValue = quantity * currentPrice;
            
            totalPortfolioValue += totalValue;
            
            // Calculate P&L for non-USDT items
            if (item.symbol.toUpperCase() !== "USDT") {
              const costBasis = quantity * avgCost;
              const itemPnL = totalValue - costBasis;
              totalPnL += itemPnL;
            }
          });

          // Calculate P&L percentage
          const totalPnLPercentage = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

          // Update user with real-time calculated values
          await this.updateUser(user.id, {
            total_pnl: totalPnL.toString(),
            total_pnl_percentage: totalPnLPercentage.toString(),
            total_portfolio_value: totalPortfolioValue.toString(),
          } as any);

          successCount++;
          logger.info(
            `Updated user ${user.id} real-time data: P&L=${totalPnL}, Portfolio=${totalPortfolioValue}, Return=${totalPnLPercentage}%`,
            "UserService"
          );
        } catch (error) {
          logger.error(`Error updating real-time data for user ${user.id}`, "UserService", error);
          errorCount++;
        }
      }

      logger.info(
        `Force update completed: ${successCount} successful, ${errorCount} errors`,
        "UserService"
      );
    } catch (error) {
      logger.error("Error force updating all users' real-time data", "UserService", error);
      throw error;
    }
  }
}
