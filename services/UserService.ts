import { supabase } from './SupabaseService';
import { User as UserEntity } from '../entities/User';
import {
  Collection,
  CollectionMember,
  CollectionWithDetails,
  CreateCollectionMemberParams,
  CreateCollectionParams,
  CreateFavoriteParams,
  CreateLeaderboardRankingParams,
  CreatePortfolioParams,
  CreatePriceAlertParams,
  CreateSearchHistoryParams,
  CreateTransactionParams,
  CreateUserParams,
  CreateUserSettingsParams,
  Favorite,
  LeaderboardRanking,
  Portfolio,
  PortfolioWithSymbol,
  PriceAlert,
  SearchHistory,
  Transaction,
  TransactionWithDetails,
  UpdateCollectionParams,
  UpdatePortfolioParams,
  UpdatePriceAlertParams,
  UpdateUserParams,
  UpdateUserSettingsParams,
  User,
  UserSettings,
  UserWithStats,
} from "../types/database";


export class UserService {
  // User Operations
  static async createUser(params: CreateUserParams): Promise<User | null> {
    try {
      const userData = UserEntity.create(params);

      const { data, error } = await supabase
        .from("users")
        .insert([userData])
        .select()
        .single();

      if (error) throw error;
      return data ? new UserEntity(data) : null;
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

      if (error) {
        // Handle the case where no user exists (PGRST116 error)
        if (error.code === "PGRST116") {
          console.log(`User with id ${id} not found in database`);
          return null;
        }
        throw error;
      }
      return data ? new UserEntity(data) : null;
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

      if (error) {
        // Handle the case where no user exists (PGRST116 error)
        if (error.code === "PGRST116") {
          console.log(`User with username ${username} not found in database`);
          return null;
        }
        throw error;
      }
      return data ? new UserEntity(data) : null;
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
      const user = await this.getUserById(id);
      if (!user) throw new Error("User not found");

      const updates = (user as UserEntity).update(params);

      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data ? new UserEntity(data) : null;
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
      await supabase
        .from("users")
        .update({
          usdt_balance: newBalance,
        })
        .eq("id", userId);

      console.log("✅ User balance updated successfully");
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
          users(username, display_name)
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

  static async getCollectionById(
    id: string
  ): Promise<CollectionWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from("collections")
        .select(
          `
          *,
          users(username, display_name),
          collection_members(
            *,
            users(username, display_name, avatar_emoji)
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
        total_value: "0",
        avg_pnl: "0",
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
      const memberData = {
        ...params,
        role: params.role || "MEMBER",
        balance: params.balance || "0",
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
      return data;
    } catch (error) {
      console.error("Error joining collection:", error);
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

  // Search History Operations
  static async getSearchHistory(
    userId: string,
    limit = 20
  ): Promise<SearchHistory[]> {
    try {
      const { data, error } = await supabase
        .from("search_history")
        .select("*")
        .eq("user_id", userId)
        .order("searched_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching search history:", error);
      throw error;
    }
  }

  static async addSearchHistory(
    params: CreateSearchHistoryParams
  ): Promise<SearchHistory | null> {
    try {
      const historyData = {
        ...params,
        searched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("search_history")
        .insert([historyData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding search history:", error);
      throw error;
    }
  }

  static async clearSearchHistory(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("search_history")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error clearing search history:", error);
      throw error;
    }
  }

  // Price Alert Operations
  static async getPriceAlerts(userId: string): Promise<PriceAlert[]> {
    try {
      const { data, error } = await supabase
        .from("price_alerts")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching price alerts:", error);
      throw error;
    }
  }

  static async createPriceAlert(
    params: CreatePriceAlertParams
  ): Promise<PriceAlert | null> {
    try {
      const alertData = {
        ...params,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("price_alerts")
        .insert([alertData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating price alert:", error);
      throw error;
    }
  }

  static async updatePriceAlert(
    id: string,
    params: UpdatePriceAlertParams
  ): Promise<PriceAlert | null> {
    try {
      const updates = {
        ...params,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("price_alerts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating price alert:", error);
      throw error;
    }
  }

  static async deletePriceAlert(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("price_alerts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting price alert:", error);
      throw error;
    }
  }

  // User Settings Operations
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching user settings:", error);
      throw error;
    }
  }

  static async getOrCreateUserSettings(
    userId: string
  ): Promise<UserSettings | null> {
    try {
      let settings = await this.getUserSettings(userId);

      if (!settings) {
        // Create default settings if they don't exist
        settings = await this.createUserSettings({
          user_id: userId,
          notifications_enabled: true,
          price_alerts_enabled: true,
          balance_hidden: false,
          language: "en",
          theme: "dark",
          currency: "USD",
        });
      }

      return settings;
    } catch (error) {
      console.error("Error getting or creating user settings:", error);
      throw error;
    }
  }

  static async createUserSettings(
    params: CreateUserSettingsParams
  ): Promise<UserSettings | null> {
    try {
      const settingsData = {
        ...params,
        notifications_enabled: params.notifications_enabled ?? true,
        price_alerts_enabled: params.price_alerts_enabled ?? true,
        balance_hidden: params.balance_hidden ?? false,
        language: params.language ?? "en",
        theme: params.theme ?? "dark",
        currency: params.currency ?? "USD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("user_settings")
        .insert([settingsData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating user settings:", error);
      throw error;
    }
  }

  static async updateUserSettings(
    id: string,
    params: UpdateUserSettingsParams
  ): Promise<UserSettings | null> {
    try {
      const updates = {
        ...params,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("user_settings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating user settings:", error);
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
        ...(user as UserEntity).toJSON(),
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
