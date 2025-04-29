import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updatePrice } from "@/features/cryptoPricesSlice";
import { resetBalance } from "@/features/balanceSlice";
import { RootState } from "@/store";
import {
  CryptoCurrency,
  getMarketData,
  getUserBalance,
} from "@/services/CryptoService";

export function useHomeData() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [marketData, setMarketData] = useState<CryptoCurrency[]>([]);

  // Get balance from Redux store
  const balance = useSelector((state: RootState) => state.balance.balance);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const market = await getMarketData(true, 10);
      const sortMarket = market.sort(
        (a, b) =>
          Math.abs(b.price_change_percentage_24h) -
          Math.abs(a.price_change_percentage_24h)
      );

      // Initialize balance in Redux
      getUserBalance(dispatch);

      setMarketData(sortMarket);

      // Update Redux store with latest prices
      sortMarket.forEach((coin) => {
        dispatch(
          updatePrice({
            symbol: coin.symbol.toUpperCase(),
            price: coin.current_price,
          })
        );
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const trendingCoins = useMemo(() => {
    return [...marketData]
      .sort(
        (a, b) =>
          Math.abs(b.market_cap_change_24h) - Math.abs(a.market_cap_change_24h)
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

  const handleResetBalance = useCallback(() => {
    dispatch(resetBalance());
  }, [dispatch]);

  return {
    loading,
    refreshing,
    trending: trendingCoins,
    balance,
    isBalanceHidden,
    onRefresh,
    toggleBalanceVisibility,
    onResetBalance: handleResetBalance,
  };
}
