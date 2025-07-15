import { FriendsService } from './FriendsService';
import { LeaderboardRanking } from '../types/database';
import { supabase } from './SupabaseService';
import { UserService } from './UserService';

export interface LeaderboardData {
  global: LeaderboardRanking[];
  friends: LeaderboardRanking[];
  collections: any[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface LeaderboardFilters {
  period: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
  collectionId?: string;
  limit?: number;
}

class LeaderboardService {
  private static instance: LeaderboardService;
  private subscribers: Set<(data: LeaderboardData) => void> = new Set();
  private channels: Map<string, any> = new Map();
  private currentFilters: LeaderboardFilters | null = null;
  private currentData: LeaderboardData = {
    global: [],
    friends: [],
    collections: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
  };
  private isSubscribed = false;
  private updateTimeout: ReturnType<typeof setTimeout> | null = null;
  private refreshTimeout: ReturnType<typeof setTimeout> | null = null;
  private leaderboardUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
  private portfolioUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
  private userUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastFetchTime: number = 0;
  private readonly FETCH_COOLDOWN = 5000; // 5 seconds cooldown between fetches

  private constructor() {}

  static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  // Subscribe to leaderboard updates
  subscribe(callback: (data: LeaderboardData) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current data
    callback(this.currentData);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notify all subscribers with debouncing
  private notifySubscribers(): void {
    // Clear existing timeout
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    // Debounce notifications to prevent rapid updates
    this.updateTimeout = setTimeout(() => {
      console.log(`🔄 Notifying ${this.subscribers.size} subscribers of data update`);
      this.subscribers.forEach(callback => callback(this.currentData));
    }, 1000); // Increased debounce time to 1 second
  }

  // Update data and notify subscribers
  private updateData(updates: Partial<LeaderboardData>): void {
    console.log('🔄 Updating leaderboard data:', {
      globalCount: updates.global?.length || this.currentData.global.length,
      friendsCount: updates.friends?.length || this.currentData.friends.length,
      collectionsCount: updates.collections?.length || this.currentData.collections.length,
      lastUpdated: updates.lastUpdated?.toISOString(),
    });
    
    this.currentData = { ...this.currentData, ...updates };
    this.notifySubscribers();
  }

  // Get current data
  getData(): LeaderboardData {
    return this.currentData;
  }

  // Check if we should fetch new data (cooldown mechanism)
  private shouldFetch(): boolean {
    const now = Date.now();
    if (now - this.lastFetchTime < this.FETCH_COOLDOWN) {
      console.log(`🔄 Skipping fetch - cooldown active (${this.FETCH_COOLDOWN - (now - this.lastFetchTime)}ms remaining)`);
      return false;
    }
    this.lastFetchTime = now;
    return true;
  }

  // Load initial leaderboard data
  async loadLeaderboardData(filters: LeaderboardFilters): Promise<void> {
    try {
      // Check if we should fetch new data
      if (!this.shouldFetch()) {
        console.log("🔄 Skipping loadLeaderboardData due to cooldown");
        return;
      }

      this.updateData({ isLoading: true, error: null });
      
      // Store current filters for real-time updates
      this.currentFilters = filters;

      const [globalData, friendsData, collectionsData] = await Promise.all([
        this.fetchGlobalLeaderboard(filters),
        this.fetchFriendsLeaderboard(filters),
        this.fetchCollectionsLeaderboard(filters),
      ]);

      this.updateData({
        global: globalData,
        friends: friendsData,
        collections: collectionsData,
        isLoading: false,
        lastUpdated: new Date(),
      });

      // Set up real-time subscriptions only if not already subscribed
      if (!this.isSubscribed) {
        this.setupRealtimeSubscriptions(filters);
      }
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
      this.updateData({
        error: error instanceof Error ? error.message : 'Failed to load leaderboard data',
        isLoading: false,
      });
    }
  }

  // Fetch global leaderboard with deduplication
  private async fetchGlobalLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardRanking[]> {
    try {
      const rankings = await UserService.getLeaderboard(filters.period, undefined, filters.limit || 50);
      
      // Filter out users with no rank and deduplicate by user_id
      const uniqueRankings = rankings
        .filter(ranking => ranking.rank && ranking.rank > 0)
        .reduce((acc, ranking) => {
          const existing = acc.find(r => r.user_id === ranking.user_id);
          if (!existing) {
            acc.push(ranking);
          }
          return acc;
        }, [] as LeaderboardRanking[]);

      console.log(`🔄 Fetched ${uniqueRankings.length} unique global rankings`);
      return uniqueRankings;
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
      return [];
    }
  }

  // Fetch friends leaderboard using FriendsService
  private async fetchFriendsLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardRanking[]> {
    try {
      // For now, return empty array - the actual user ID will be passed from the hook
      // This will be handled in the useLeaderboardData hook
      return [];
    } catch (error) {
      console.error('Error fetching friends leaderboard:', error);
      return [];
    }
  }

  // New method to fetch friends leaderboard with user ID
  async fetchFriendsLeaderboardWithUser(userId: string, filters: LeaderboardFilters): Promise<LeaderboardRanking[]> {
    try {
      // Use FriendsService to get friends leaderboard
      const friendsData = await FriendsService.getFriendsLeaderboard(
        userId,
        filters.period,
        filters.limit || 50
      );

      // Transform the data to match LeaderboardRanking format and deduplicate
      const uniqueFriendsData = friendsData
        .reduce((acc, item: any) => {
          const existing = acc.find((r: LeaderboardRanking) => r.user_id === item.user_id);
          if (!existing) {
            acc.push({
              id: item.id,
              user_id: item.user_id,
              collection_id: item.collection_id,
              period: item.period,
              rank: item.rank,
              total_pnl: item.total_pnl,
              percentage_return: item.percentage_return,
              portfolio_value: item.portfolio_value,
              trade_count: item.trade_count,
              win_rate: item.win_rate,
              calculated_at: item.calculated_at,
              created_at: item.created_at,
              updated_at: item.updated_at,
              users: item.users, // Include user details for display
            });
          }
          return acc;
        }, [] as LeaderboardRanking[]);

      console.log(`🔄 Fetched ${uniqueFriendsData.length} unique friends rankings`);
      return uniqueFriendsData;
    } catch (error) {
      console.error('Error fetching friends leaderboard:', error);
      return [];
    }
  }

  // Fetch collections leaderboard
  private async fetchCollectionsLeaderboard(filters: LeaderboardFilters): Promise<any[]> {
    try {
      // TODO: Implement collections leaderboard when collection ranking is added
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching collections leaderboard:', error);
      return [];
    }
  }

  // Set up real-time subscriptions with better management
  private setupRealtimeSubscriptions(filters: LeaderboardFilters): void {
    // DISABLED: Real-time subscriptions for manual-only refresh
    console.log('🔄 Real-time subscriptions disabled - manual refresh only');
    
    // Clean up existing channels
    this.cleanupChannels();
    
    // Don't subscribe to any real-time channels
    this.isSubscribed = false;
  }

  // Handle leaderboard ranking updates with debouncing
  private async handleLeaderboardUpdate(payload: any, filters: LeaderboardFilters): Promise<void> {
    try {
      // Clear existing leaderboard update timeout
      if (this.leaderboardUpdateTimeout) {
        clearTimeout(this.leaderboardUpdateTimeout);
      }

      // Debounce the refresh to prevent excessive updates
      this.leaderboardUpdateTimeout = setTimeout(async () => {
        try {
          // Check if we should fetch new data
          if (!this.shouldFetch()) {
            console.log("🔄 Skipping leaderboard update due to cooldown");
            return;
          }

          // Use current filters if available, otherwise use passed filters
          const currentFilters = this.currentFilters || filters;
          
          // Refresh the appropriate leaderboard data
          if (payload.new?.collection_id) {
            // Collection-specific leaderboard
            const collectionsData = await this.fetchCollectionsLeaderboard(currentFilters);
            this.updateData({ collections: collectionsData });
          } else {
            // Global leaderboard
            const globalData = await this.fetchGlobalLeaderboard(currentFilters);
            this.updateData({ global: globalData });
          }
        } catch (error) {
          console.error('Error handling leaderboard update:', error);
        }
      }, 8000); // 8 second debounce for real-time updates
    } catch (error) {
      console.error('Error setting up leaderboard update handler:', error);
    }
  }

  // Handle portfolio updates with debouncing
  private async handlePortfolioUpdate(payload: any, filters: LeaderboardFilters): Promise<void> {
    try {
      // Clear existing portfolio update timeout
      if (this.portfolioUpdateTimeout) {
        clearTimeout(this.portfolioUpdateTimeout);
      }

      // Debounce the refresh to prevent excessive updates
      this.portfolioUpdateTimeout = setTimeout(async () => {
        try {
          // Check if we should fetch new data
          if (!this.shouldFetch()) {
            console.log("🔄 Skipping portfolio update due to cooldown");
            return;
          }

          // Use current filters if available, otherwise use passed filters
          const currentFilters = this.currentFilters || filters;
          
          // Portfolio changes affect user rankings, so refresh all leaderboards
          const [globalData, friendsData, collectionsData] = await Promise.all([
            this.fetchGlobalLeaderboard(currentFilters),
            this.fetchFriendsLeaderboard(currentFilters),
            this.fetchCollectionsLeaderboard(currentFilters),
          ]);

          this.updateData({
            global: globalData,
            friends: friendsData,
            collections: collectionsData,
            lastUpdated: new Date(),
          });
        } catch (error) {
          console.error('Error handling portfolio update:', error);
        }
      }, 8000); // 8 second debounce for real-time updates
    } catch (error) {
      console.error('Error setting up portfolio update handler:', error);
    }
  }

  // Handle user updates with debouncing
  private async handleUserUpdate(payload: any, filters: LeaderboardFilters): Promise<void> {
    try {
      // Clear existing user update timeout
      if (this.userUpdateTimeout) {
        clearTimeout(this.userUpdateTimeout);
      }

      // Debounce the refresh to prevent excessive updates
      this.userUpdateTimeout = setTimeout(async () => {
        try {
          // Check if we should fetch new data
          if (!this.shouldFetch()) {
            console.log("🔄 Skipping user update due to cooldown");
            return;
          }

          // Use current filters if available, otherwise use passed filters
          const currentFilters = this.currentFilters || filters;
          
          // User changes affect rankings, so refresh all leaderboards
          const [globalData, friendsData, collectionsData] = await Promise.all([
            this.fetchGlobalLeaderboard(currentFilters),
            this.fetchFriendsLeaderboard(currentFilters),
            this.fetchCollectionsLeaderboard(currentFilters),
          ]);

          this.updateData({
            global: globalData,
            friends: friendsData,
            collections: collectionsData,
            lastUpdated: new Date(),
          });
        } catch (error) {
          console.error('Error handling user update:', error);
        }
      }, 10000); // 10 second debounce for real-time updates
    } catch (error) {
      console.error('Error setting up user update handler:', error);
    }
  }

  // Clean up real-time channels
  private cleanupChannels(): void {
    this.channels.forEach((channel, key) => {
      supabase.removeChannel(channel);
      console.log(`Cleaned up ${key} channel`);
    });
    this.channels.clear();
    this.isSubscribed = false;
  }

  // Update filters and reload data
  async updateFilters(filters: LeaderboardFilters): Promise<void> {
    await this.loadLeaderboardData(filters);
  }

  // Manual refresh (bypasses cooldown)
  async refresh(filters: LeaderboardFilters): Promise<void> {
    // Reset cooldown for manual refresh
    this.lastFetchTime = 0;
    await this.loadLeaderboardData(filters);
  }

  // Clean up and refresh leaderboard data
  async cleanupAndRefresh(filters: LeaderboardFilters): Promise<void> {
    try {
      console.log('🧹 Cleaning up and refreshing leaderboard data...');
      
      // Clean up duplicate entries and remove WEEKLY/MONTHLY periods
      await UserService.cleanupLeaderboardRankings();
      
      // Recalculate all ranks
      await UserService.recalculateAllRanks();
      
      // Sync global ranks from leaderboard to users table
      await UserService.syncGlobalRanksFromLeaderboard();
      
      // Reset cooldown and load fresh data
      this.lastFetchTime = 0;
      await this.loadLeaderboardData(filters);
      
      console.log('✅ Leaderboard cleanup and refresh completed');
    } catch (error) {
      console.error('Error during leaderboard cleanup and refresh:', error);
      throw error;
    }
  }

  // Trigger rank recalculation for all users
  async recalculateAllRanks(): Promise<void> {
    try {
      console.log('🔄 Recalculating all leaderboard ranks...');
      
      // Get all users and update their rankings
      const { data: users, error } = await supabase
        .from('users')
        .select('id');

      if (error) throw error;

      if (!users || users.length === 0) {
        console.log('No users found for rank recalculation');
        return;
      }

      // Update rankings for each user
      for (const user of users) {
        try {
          await UserService.updateLeaderboardRankings(user.id);
        } catch (error) {
          console.error(`Error updating rankings for user ${user.id}:`, error);
          // Continue with other users even if one fails
        }
      }

      console.log(`✅ Rank recalculation completed for ${users.length} users`);
    } catch (error) {
      console.error('Error recalculating all ranks:', error);
      throw error;
    }
  }

  // Get current user's rank
  async getCurrentUserRank(
    userId: string, 
    period: "WEEKLY" | "MONTHLY" | "ALL_TIME" = "ALL_TIME"
  ): Promise<number | null> {
    try {
      return await UserService.getUserRank(userId, period);
    } catch (error) {
      console.error('Error getting current user rank:', error);
      return null;
    }
  }

  // Get leaderboard statistics
  async getLeaderboardStats(period: "WEEKLY" | "MONTHLY" | "ALL_TIME" = "ALL_TIME"): Promise<{
    totalUsers: number;
    topPerformer: { userId: string; rank: number; pnl: string } | null;
    averagePnL: number;
  }> {
    try {
      return await UserService.getLeaderboardStats(period);
    } catch (error) {
      console.error('Error getting leaderboard stats:', error);
      return {
        totalUsers: 0,
        topPerformer: null,
        averagePnL: 0,
      };
    }
  }

  // Cleanup when service is no longer needed
  cleanup(): void {
    this.cleanupChannels();
    this.subscribers.clear();
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    if (this.leaderboardUpdateTimeout) {
      clearTimeout(this.leaderboardUpdateTimeout);
      this.leaderboardUpdateTimeout = null;
    }
    if (this.portfolioUpdateTimeout) {
      clearTimeout(this.portfolioUpdateTimeout);
      this.portfolioUpdateTimeout = null;
    }
    if (this.userUpdateTimeout) {
      clearTimeout(this.userUpdateTimeout);
      this.userUpdateTimeout = null;
    }
  }

  // Static method to cleanup and refresh leaderboard data
  static async cleanupAndRefreshData(): Promise<void> {
    const instance = LeaderboardService.getInstance();
    await instance.cleanupAndRefresh({
      period: "ALL_TIME",
      limit: 50,
    });
  }

  // Static method to fix duplicate entries
  static async fixDuplicateEntries(): Promise<void> {
    try {
      console.log('🔧 Fixing leaderboard duplicate entries...');
      
      // Import and run the cleanup script
      const { fixLeaderboardDuplicates } = await import('../scripts/fix-leaderboard-duplicates');
      await fixLeaderboardDuplicates();
      
      // Refresh the current data
      const instance = LeaderboardService.getInstance();
      if (instance.currentFilters) {
        await instance.loadLeaderboardData(instance.currentFilters);
      }
      
      console.log('✅ Leaderboard duplicate entries fixed');
    } catch (error) {
      console.error('Error fixing duplicate entries:', error);
      throw error;
    }
  }
}

export default LeaderboardService; 