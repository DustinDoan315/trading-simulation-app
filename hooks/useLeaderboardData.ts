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

  
  useEffect(() => {
    const unsubscribe = LeaderboardService.getInstance().subscribe(setData);
    

    LeaderboardService.getInstance().loadLeaderboardData(filters);

    return () => {
      unsubscribe();
    };
  }, []);

  
  const updateFilters = useCallback(async (newFilters: LeaderboardFilters) => {
    setFilters(newFilters);
    await LeaderboardService.getInstance().updateFilters(newFilters);
  }, []);

 
  const refresh = useCallback(async () => {
    await LeaderboardService.getInstance().refresh(filters);
  }, [filters]);


  useEffect(() => {
    return () => {

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