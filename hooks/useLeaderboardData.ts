import LeaderboardService, { LeaderboardData, LeaderboardFilters } from '@/services/LeaderboardService';
import { useCallback, useEffect, useState } from 'react';

export interface UseLeaderboardDataReturn {
  data: LeaderboardData;
  refresh: () => Promise<void>;
  updateFilters: (filters: LeaderboardFilters) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useLeaderboardData = (initialFilters: LeaderboardFilters): UseLeaderboardDataReturn => {
  const [data, setData] = useState<LeaderboardData>(LeaderboardService.getInstance().getData());
  const [filters, setFilters] = useState<LeaderboardFilters>(initialFilters);

  // Subscribe to leaderboard service updates
  useEffect(() => {
    const unsubscribe = LeaderboardService.getInstance().subscribe(setData);
    
    // Load initial data
    LeaderboardService.getInstance().loadLeaderboardData(filters);

    return () => {
      unsubscribe();
    };
  }, []);

  // Update filters and reload data
  const updateFilters = useCallback(async (newFilters: LeaderboardFilters) => {
    setFilters(newFilters);
    await LeaderboardService.getInstance().updateFilters(newFilters);
  }, []);

  // Manual refresh
  const refresh = useCallback(async () => {
    await LeaderboardService.getInstance().refresh(filters);
  }, [filters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't cleanup the service here as it might be used by other components
      // The service will be cleaned up when the app is unmounted
    };
  }, []);

  return {
    data,
    refresh,
    updateFilters,
    isLoading: data.isLoading,
    error: data.error,
    lastUpdated: data.lastUpdated,
  };
}; 