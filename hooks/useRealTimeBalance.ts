import RealTimeDataService from "@/services/RealTimeDataService";
import { RootState } from "@/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UserService } from "@/services/UserService";
import { useSelector } from "react-redux";

interface RealTimeBalanceData {
  totalBalance: number;
  availableBalance: number;
  totalPnL: number;
  totalPnLPercentage: number;
  formattedTotalBalance: string;
  formattedAvailableBalance: string;
  formattedTotalPnL: string;
  formattedTotalPnLPercentage: string;
  userRank: number | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useRealTimeBalance = (): RealTimeBalanceData => {
  const [serviceState, setServiceState] = useState(
    RealTimeDataService.getInstance().getState()
  );
  const [userRank, setUserRank] = useState<number | null>(null);

  // Get balance and user from Redux store
  const balance = useSelector((state: RootState) => state.balance.balance);
  const user = useSelector((state: RootState) => state.user.currentUser);

  // Subscribe to real-time data service
  useEffect(() => {
    const unsubscribe =
      RealTimeDataService.getInstance().subscribe(setServiceState);

    // Start updates if not already running
    if (!RealTimeDataService.getInstance().isActive()) {
      RealTimeDataService.getInstance().startUpdates();
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch user rank when user changes
  useEffect(() => {
    const fetchUserRank = async () => {
      if (user?.id) {
        try {
          const rank = await UserService.getUserRank(user.id, "ALL_TIME");
          setUserRank(rank);
        } catch (error) {
          console.error("Error fetching user rank:", error);
        }
      }
    };

    fetchUserRank();
  }, [user?.id]);

  // Calculate real-time metrics
  const metrics = useMemo(() => {
    if (!balance || !balance.holdings) {
      return {
        totalBalance: 0,
        availableBalance: 0,
        totalPnL: 0,
        totalPnLPercentage: 0,
      };
    }

    const holdings = balance.holdings;
    let totalBalance = balance.usdtBalance || 0;
    let totalPnL = 0;
    let totalCostBasis = 0;

    // Calculate values for all holdings (excluding USDT to avoid double counting)
    Object.values(holdings).forEach((holding: any) => {
      if (holding.symbol !== "USDT") {
        const marketValue = holding.amount * holding.currentPrice;
        const costBasis = holding.amount * holding.averageBuyPrice;

        totalBalance += marketValue;
        totalPnL += marketValue - costBasis;
        totalCostBasis += costBasis;
      }
    });

    const totalPnLPercentage =
      totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

    return {
      totalBalance,
      availableBalance: balance.usdtBalance || 0,
      totalPnL,
      totalPnLPercentage,
    };
  }, [balance]);

  // Format values with 2 decimal places
  const formattedValues = useMemo(() => {
    return {
      formattedTotalBalance: `$${metrics.totalBalance.toFixed(2)}`,
      formattedAvailableBalance: `$${metrics.availableBalance.toFixed(2)}`,
      formattedTotalPnL: `${metrics.totalPnL >= 0 ? "+" : "-"}$${Math.abs(
        metrics.totalPnL
      ).toFixed(2)}`,
      formattedTotalPnLPercentage: `${
        metrics.totalPnLPercentage >= 0 ? "+" : "-"
      }${Math.abs(metrics.totalPnLPercentage).toFixed(2)}%`,
    };
  }, [metrics]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await RealTimeDataService.getInstance().refresh();

    // Also refresh user rank
    if (user?.id) {
      try {
        await UserService.updateLeaderboardRankings(user.id);
        const rank = await UserService.getUserRank(user.id, "ALL_TIME");
        setUserRank(rank);
      } catch (error) {
        console.error("Error refreshing user rank:", error);
      }
    }
  }, [user?.id]);

  return {
    ...metrics,
    ...formattedValues,
    userRank,
    isLoading: serviceState.isLoading,
    error: serviceState.error,
    refresh,
  };
};
