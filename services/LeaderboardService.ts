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

  // Notify all subscribers
  private notifySubscribers(): void {
    console.log(`🔄 Notifying ${this.subscribers.size} subscribers of data update`);
    this.subscribers.forEach(callback => callback(this.currentData));
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

  // Load initial leaderboard data
  async loadLeaderboardData(filters: LeaderboardFilters): Promise<void> {
    try {
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

      // Set up real-time subscriptions
      this.setupRealtimeSubscriptions(filters);
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
      this.updateData({
        error: error instanceof Error ? error.message : 'Failed to load leaderboard data',
        isLoading: false,
      });
    }
  }

  // Fetch global leaderboard
  private async fetchGlobalLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardRanking[]> {
    try {
      const rankings = await UserService.getLeaderboard(filters.period, undefined, filters.limit || 50);
      
      // Filter out users with no rank (new users who haven't traded yet)
      // Also ensure ranks are properly calculated (not 0)
      return rankings.filter(ranking => ranking.rank && ranking.rank > 0);
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
      return [];
    }
  }

  // Fetch friends leaderboard (for now, return empty array - implement when friends feature is added)
  private async fetchFriendsLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardRanking[]> {
    try {
      // TODO: Implement friends leaderboard when friends feature is added
      // For now, return empty array
      return [];
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

  // Set up real-time subscriptions
  private setupRealtimeSubscriptions(filters: LeaderboardFilters): void {
    // Clean up existing channels
    this.cleanupChannels();

    // Subscribe to leaderboard_rankings table changes
    const leaderboardChannel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard_rankings',
          filter: `period=eq.${filters.period}`,
        },
        (payload: any) => {
          console.log('🔄 Leaderboard real-time update:', payload);
          this.handleLeaderboardUpdate(payload, filters);
        }
      )
      .subscribe();

    this.channels.set('leaderboard', leaderboardChannel);

    // Subscribe to portfolio changes (affects user rankings)
    const portfolioChannel = supabase
      .channel('portfolio-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolio',
        },
        (payload: any) => {
          console.log('🔄 Portfolio real-time update:', payload);
          this.handlePortfolioUpdate(payload, filters);
        }
      )
      .subscribe();

    this.channels.set('portfolio', portfolioChannel);

    // Subscribe to user balance changes
    const userChannel = supabase
      .channel('user-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        (payload: any) => {
          console.log('🔄 User real-time update:', payload);
          this.handleUserUpdate(payload, filters);
        }
      )
      .subscribe();

    this.channels.set('user', userChannel);
  }

  // Handle leaderboard ranking updates
  private async handleLeaderboardUpdate(payload: any, filters: LeaderboardFilters): Promise<void> {
    try {
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
  }

  // Handle portfolio updates
  private async handlePortfolioUpdate(payload: any, filters: LeaderboardFilters): Promise<void> {
    try {
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
  }

  // Handle user updates
  private async handleUserUpdate(payload: any, filters: LeaderboardFilters): Promise<void> {
    try {
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
  }

  // Clean up real-time channels
  private cleanupChannels(): void {
    this.channels.forEach((channel, key) => {
      supabase.removeChannel(channel);
      console.log(`Cleaned up ${key} channel`);
    });
    this.channels.clear();
  }

  // Update filters and reload data
  async updateFilters(filters: LeaderboardFilters): Promise<void> {
    await this.loadLeaderboardData(filters);
  }

  // Manual refresh
  async refresh(filters: LeaderboardFilters): Promise<void> {
    await this.loadLeaderboardData(filters);
  }

  // Clean up and refresh leaderboard data
  async cleanupAndRefresh(filters: LeaderboardFilters): Promise<void> {
    try {
      console.log('🧹 Cleaning up and refreshing leaderboard data...');
      
      // Clean up duplicate entries
      await UserService.cleanupLeaderboardRankings();
      
      // Recalculate all ranks
      await UserService.recalculateAllRanks();
      
      // Load fresh data
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
  }

  // Static method to cleanup and refresh leaderboard data
  static async cleanupAndRefreshData(): Promise<void> {
    const instance = LeaderboardService.getInstance();
    await instance.cleanupAndRefresh({
      period: "ALL_TIME",
      limit: 50,
    });
  }
}

export default LeaderboardService; 