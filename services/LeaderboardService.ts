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
  private readonly FETCH_COOLDOWN = 5000;

  private constructor() {}

  static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  subscribe(callback: (data: LeaderboardData) => void): () => void {
    this.subscribers.add(callback);
    
    callback(this.currentData);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(() => {
     
      this.subscribers.forEach(callback => callback(this.currentData));
    }, 1000);
  }

  private updateData(updates: Partial<LeaderboardData>): void {
    
    this.currentData = { ...this.currentData, ...updates };
    this.notifySubscribers();
  }

  getData(): LeaderboardData {
    return this.currentData;
  }

  private shouldFetch(): boolean {
    const now = Date.now();
    if (now - this.lastFetchTime < this.FETCH_COOLDOWN) {
      return false;
    }
    this.lastFetchTime = now;
    return true;
  }

  async loadLeaderboardData(filters: LeaderboardFilters): Promise<void> {
    try {
      if (!this.shouldFetch()) {
        return;
      }

      this.updateData({ isLoading: true, error: null });
      
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

  private async fetchGlobalLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardRanking[]> {
    try {
      const rankings = await UserService.getLeaderboard(filters.period, undefined, filters.limit || 50);
      
      const uniqueRankings = rankings
        .filter(ranking => ranking.rank && ranking.rank > 0)
        .reduce((acc, ranking) => {
          const existing = acc.find(r => r.user_id === ranking.user_id);
          if (!existing) {
            acc.push(ranking);
          }
          return acc;
        }, [] as LeaderboardRanking[]);

      return uniqueRankings;
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
      return [];
    }
  }

  private async fetchFriendsLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardRanking[]> {
    try {
      return [];
    } catch (error) {
      console.error('Error fetching friends leaderboard:', error);
      return [];
    }
  }

  async fetchFriendsLeaderboardWithUser(userId: string, filters: LeaderboardFilters): Promise<LeaderboardRanking[]> {
    try {
      const friendsData = await FriendsService.getFriendsLeaderboard(
        userId,
        filters.period,
        filters.limit || 50
      );

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
              users: item.users,
            });
          }
          return acc;
        }, [] as LeaderboardRanking[]);

      return uniqueFriendsData;
    } catch (error) {
      console.error('Error fetching friends leaderboard:', error);
      return [];
    }
  }

  private async fetchCollectionsLeaderboard(filters: LeaderboardFilters): Promise<any[]> {
    try {
      return [];
    } catch (error) {
      console.error('Error fetching collections leaderboard:', error);
      return [];
    }
  }

  private setupRealtimeSubscriptions(filters: LeaderboardFilters): void {
    this.cleanupChannels();
    
    this.isSubscribed = false;
  }

  private async handleLeaderboardUpdate(payload: any, filters: LeaderboardFilters): Promise<void> {
    try {
      if (this.leaderboardUpdateTimeout) {
        clearTimeout(this.leaderboardUpdateTimeout);
      }

      this.leaderboardUpdateTimeout = setTimeout(async () => {
        try {
          console.log('LeaderboardService: Refreshing data after leaderboard update');
          await this.loadLeaderboardData(filters);
        } catch (error) {
          console.error('Error refreshing leaderboard data:', error);
        }
      }, 2000);
    } catch (error) {
      console.error('Error handling leaderboard update:', error);
    }
  }

  private async handlePortfolioUpdate(payload: any, filters: LeaderboardFilters): Promise<void> {
    try {
      if (this.portfolioUpdateTimeout) {
        clearTimeout(this.portfolioUpdateTimeout);
      }

      this.portfolioUpdateTimeout = setTimeout(async () => {
        try {
          console.log('LeaderboardService: Refreshing data after portfolio update');
          await this.loadLeaderboardData(filters);
        } catch (error) {
          console.error('Error refreshing leaderboard data:', error);
        }
      }, 3000);
    } catch (error) {
      console.error('Error handling portfolio update:', error);
    }
  }

  private async handleUserUpdate(payload: any, filters: LeaderboardFilters): Promise<void> {
    try {
      if (this.userUpdateTimeout) {
        clearTimeout(this.userUpdateTimeout);
      }

      this.userUpdateTimeout = setTimeout(async () => {
        try {
          console.log('LeaderboardService: Refreshing data after user update');
          await this.loadLeaderboardData(filters);
        } catch (error) {
          console.error('Error refreshing leaderboard data:', error);
        }
      }, 2000);
    } catch (error) {
      console.error('Error handling user update:', error);
    }
  }

  private cleanupChannels(): void {
    this.channels.forEach(channel => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
    });
    this.channels.clear();
  }

  async updateFilters(filters: LeaderboardFilters): Promise<void> {
    this.currentFilters = filters;
    await this.loadLeaderboardData(filters);
  }

  async refresh(filters: LeaderboardFilters): Promise<void> {
    this.lastFetchTime = 0;
    await this.loadLeaderboardData(filters);
  }

  async cleanupAndRefresh(filters: LeaderboardFilters): Promise<void> {
    try {
      this.cleanupChannels();
      this.isSubscribed = false;
      
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

      await this.loadLeaderboardData(filters);
    } catch (error) {
      console.error('Error in cleanupAndRefresh:', error);
    }
  }

  async recalculateAllRanks(): Promise<void> {
    try {
      console.log('LeaderboardService: Recalculating all leaderboard ranks...');
      
      const periods: ("WEEKLY" | "MONTHLY" | "ALL_TIME")[] = ["WEEKLY", "MONTHLY", "ALL_TIME"];
      
      for (const period of periods) {
        try {
          await UserService.initializeLeaderboardRankings();
          console.log(`LeaderboardService: Recalculated ranks for ${period} period`);
        } catch (error) {
          console.error(`Error recalculating ranks for ${period} period:`, error);
        }
      }
      
      console.log('LeaderboardService: All leaderboard ranks recalculated');
    } catch (error) {
      console.error('Error recalculating all ranks:', error);
    }
  }

  async getCurrentUserRank(
    userId: string, 
    period: "WEEKLY" | "MONTHLY" | "ALL_TIME" = "ALL_TIME"
  ): Promise<number | null> {
    try {
      const rankings = await UserService.getLeaderboard(period, undefined, 1000);
      const userRanking = rankings.find(ranking => ranking.user_id === userId);
      return userRanking?.rank || null;
    } catch (error) {
      console.error('Error getting current user rank:', error);
      return null;
    }
  }

  async getLeaderboardStats(period: "WEEKLY" | "MONTHLY" | "ALL_TIME" = "ALL_TIME"): Promise<{
    totalUsers: number;
    topPerformer: { userId: string; rank: number; pnl: string } | null;
    averagePnL: number;
  }> {
    try {
      const rankings = await UserService.getLeaderboard(period, undefined, 1000);
      
      const totalUsers = rankings.length;
      const topPerformer = rankings.length > 0 ? {
        userId: rankings[0].user_id,
        rank: rankings[0].rank || 1,
        pnl: rankings[0].total_pnl || "0.00"
      } : null;
      
      const averagePnL = rankings.length > 0 
        ? rankings.reduce((sum, ranking) => sum + parseFloat(ranking.total_pnl || "0"), 0) / rankings.length
        : 0;

      return { totalUsers, topPerformer, averagePnL };
    } catch (error) {
      console.error('Error getting leaderboard stats:', error);
      return { totalUsers: 0, topPerformer: null, averagePnL: 0 };
    }
  }

  cleanup(): void {
    try {
      this.cleanupChannels();
      
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
      
      this.subscribers.clear();
      this.isSubscribed = false;
      
      console.log('LeaderboardService: Cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  static async cleanupAndRefreshData(): Promise<void> {
    try {
      const instance = LeaderboardService.getInstance();
      await instance.recalculateAllRanks();
      console.log('LeaderboardService: Static cleanup and refresh completed');
    } catch (error) {
      console.error('Error in static cleanup and refresh:', error);
    }
  }

  static async fixDuplicateEntries(): Promise<void> {
    try {
      console.log('LeaderboardService: Fixing duplicate leaderboard entries...');
      
      const { data, error } = await supabase
        .from('leaderboard_rankings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const seen = new Set();
      const duplicates: any[] = [];

      data?.forEach((entry: any) => {
        const key = `${entry.user_id}-${entry.period}-${entry.collection_id || 'null'}`;
        if (seen.has(key)) {
          duplicates.push(entry);
        } else {
          seen.add(key);
        }
      });

      if (duplicates.length > 0) {
        console.log(`Found ${duplicates.length} duplicate entries to remove`);
        
        for (const duplicate of duplicates) {
          await supabase
            .from('leaderboard_rankings')
            .delete()
            .eq('id', duplicate.id);
        }
        
        console.log('Duplicate entries removed successfully');
      } else {
        console.log('No duplicate entries found');
      }
    } catch (error) {
      console.error('Error fixing duplicate entries:', error);
    }
  }
}

export default LeaderboardService; 