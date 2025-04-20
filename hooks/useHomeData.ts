import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CryptoCurrency,
  UserBalance,
  getMarketData,
  getUserBalance,
} from "@/services/CryptoService";

export function useHomeData() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState<UserBalance>({
    totalInUSD: 0,
    holdings: {},
  });
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [marketData, setMarketData] = useState<CryptoCurrency[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const market = await getMarketData(true, 10);
      const sortedMarket = [...market].sort(
        (a, b) => b.market_cap - a.market_cap
      );
      const balanceData = await getUserBalance();
      setMarketData(sortedMarket);
      setBalance(balanceData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const trendingCoins = useMemo(() => {
    return [...marketData]
      .sort(
        (a, b) => Math.abs(b.price_change_24h) - Math.abs(a.price_change_24h)
      )
      .slice(0, 5);
  }, [marketData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };

  return {
    loading,
    refreshing,
    trending: trendingCoins,
    balance,
    isBalanceHidden,
    onRefresh,
    toggleBalanceVisibility,
  };
}
