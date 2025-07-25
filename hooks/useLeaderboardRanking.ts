import LeaderboardService from '../services/LeaderboardService';
import { useCallback, useEffect, useState } from 'react';
import { UserService } from '../services/UserService';


export interface LeaderboardRankingData {
  currentRank: number | null;
  isLoading: boolean;
  error: string | null;
  stats: {
    totalUsers: number;
    activeUsers: number;
    topPerformer: { userId: string; rank: number; pnl: string } | null;
    averagePnL: number;
  } | null;
}

export const useLeaderboardRanking = (
  userId: string,
  period: "WEEKLY" | "MONTHLY" | "ALL_TIME" = "ALL_TIME"
) => {
  const [data, setData] = useState<LeaderboardRankingData>({
    currentRank: null,
    isLoading: false,
    error: null,
    stats: null,
  });

  const leaderboardService = LeaderboardService.getInstance();

  // Load current user's rank
  const loadCurrentRank = useCallback(async () => {
    if (!userId) return;

    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const rank = await leaderboardService.getCurrentUserRank(userId, period);
      const stats = await leaderboardService.getLeaderboardStats(period);

      setData(prev => ({
        ...prev,
        currentRank: rank,
        stats,
        isLoading: false,
      }));
    } catch (error) {
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load rank',
        isLoading: false,
      }));
    }
  }, [userId, period, leaderboardService]);

  const refreshRank = useCallback(async () => {
    await loadCurrentRank();
  }, [loadCurrentRank]);

  const initializeRankings = useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await UserService.initializeLeaderboardRankings();
      await loadCurrentRank();
    } catch (error) {
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize rankings',
        isLoading: false,
      }));
    }
  }, [loadCurrentRank]);

  const recalculateAllRanks = useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await leaderboardService.recalculateAllRanks();
      await loadCurrentRank();
    } catch (error) {
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to recalculate ranks',
        isLoading: false,
      }));
    }
  }, [leaderboardService, loadCurrentRank]);

  useEffect(() => {
    loadCurrentRank();
  }, [loadCurrentRank]);

  return {
    ...data,
    refreshRank,
    initializeRankings,
    recalculateAllRanks,
  };
}; 