import { useCallback, useEffect, useState } from "react";
import {
  CryptoCurrency,
  UserBalance,
  getMarketData,
  getUserBalance,
} from "@/services/CryptoService";

export function useHomeData() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trending, setTrending] = useState<CryptoCurrency[]>([]);
  const [balance, setBalance] = useState<UserBalance>({
    totalInUSD: 0,
    holdings: {},
  });
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const marketData = await getMarketData(true, 10);
      const balanceData = await getUserBalance();

      const trendingCoins = [...marketData]
        .sort(
          (a, b) =>
            Math.abs(b.price_change_percentage_24h) -
            Math.abs(a.price_change_percentage_24h)
        )
        .slice(0, 5);

      setTrending(trendingCoins);
      setBalance(balanceData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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
    trending,
    balance,
    isBalanceHidden,
    onRefresh,
    toggleBalanceVisibility,
  };
}
