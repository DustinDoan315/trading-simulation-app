import { enhancedCryptoService } from '@/services/EnhancedCryptoService';
import { loadBalance, resetBalance, updateCurrentPrice } from '@/features/balanceSlice';
import { RootState, useAppDispatch } from '@/store';
import { updatePrice } from '@/features/cryptoPricesSlice';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
  } from 'react';
import { useSelector } from 'react-redux';
import {
  CryptoCurrency,
  getMarketData,
  getUserBalance,
} from "@/services/CryptoService";
import { AppState, AppStateStatus } from 'react-native';
import { UserService } from '@/services/UserService';
import { useUser } from '@/context/UserContext';


export function useHomeData() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [marketData, setMarketData] = useState<CryptoCurrency[]>([]);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useUser();

  // Get balance from Redux store
  const balance = useSelector((state: RootState) => state.balance.balance);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load balance first
      dispatch(loadBalance());
      
      // Fetch market data using enhanced service for better caching
      const market = await enhancedCryptoService.getMarketData(false, 10, true);

      const sortMarket = market.sort(
        (a: CryptoCurrency, b: CryptoCurrency) =>
          Math.abs(b.price_change_percentage_24h) -
          Math.abs(a.price_change_percentage_24h)
      );

      setMarketData(sortMarket);

      // Update Redux store with latest prices
      sortMarket.forEach((coin: CryptoCurrency) => {
        dispatch(
          updatePrice({
            symbol: coin.symbol.toUpperCase(),
            price: coin.current_price,
          })
        );
      });

      console.log("✅ Home data loaded successfully");
      console.log("Market data count:", sortMarket.length);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Update portfolio prices with real-time market data (debounced)
  const updatePortfolioPrices = useCallback(() => {
    if (!balance || !balance.holdings || marketData.length === 0) return;

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce portfolio updates to prevent excessive leaderboard updates
    updateTimeoutRef.current = setTimeout(() => {
      Object.keys(balance.holdings).forEach((symbol) => {
        if (symbol === "USDT") return; // Skip USDT as it's always 1:1

        const marketCoin = marketData.find(
          (coin) => coin.symbol.toUpperCase() === symbol
        );

        if (marketCoin) {
          dispatch(
            updateCurrentPrice({
              cryptoId: symbol,
              currentPrice: marketCoin.current_price,
            })
          );
          
          // The updateCurrentPrice action will automatically:
          // 1. Update the portfolio with new prices
          // 2. Recalculate P&L
          // 3. Update the users table with real-time values
          // 4. Trigger leaderboard updates
        }
      });
    }, 3000); // 3 second debounce to prevent excessive updates
  }, [balance, marketData, dispatch]);

  // Update portfolio prices when market data changes
  useEffect(() => {
    if (marketData.length > 0 && balance?.holdings) {
      updatePortfolioPrices();
    }
  }, [marketData, balance?.holdings, updatePortfolioPrices]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Track app state and update user activity
  useEffect(() => {
    if (!user?.id) return;
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      try {
        if (nextAppState === 'active') {
          await UserService.updateUserActivity(user.id, true);
        } else if (nextAppState === 'background' || nextAppState === 'inactive') {
          await UserService.updateUserActivity(user.id, false);
        }
      } catch (err) {
        console.warn('Failed to update user activity:', err);
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [user?.id]);

  const trendingCoins = useMemo(() => {
    return [...marketData]
      .sort(
        (a: CryptoCurrency, b: CryptoCurrency) =>
          Math.abs(b.market_cap_change_24h) - Math.abs(a.market_cap_change_24h)
      )
      .slice(0, 5);
  }, [marketData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
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
