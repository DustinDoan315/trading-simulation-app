import { AppState, AppStateStatus } from 'react-native';
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
import { UserService } from '@/services/UserService';
import { useSelector } from 'react-redux';
import { useUser } from '@/context/UserContext';
import {
  CryptoCurrency,
  getMarketData,
  getUserBalance,
} from "@/services/CryptoService";


export function useHomeData() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [marketData, setMarketData] = useState<CryptoCurrency[]>([]);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useUser();

  const balance = useSelector((state: RootState) => state.balance.balance);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      dispatch(loadBalance());
      
      const market = await enhancedCryptoService.getMarketData(false, 10, true);

      const sortMarket = market.sort(
        (a: CryptoCurrency, b: CryptoCurrency) =>
          Math.abs(b.price_change_percentage_24h) -
          Math.abs(a.price_change_percentage_24h)
      );

      setMarketData(sortMarket);

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

  const updatePortfolioPrices = useCallback(() => {
    if (!balance || !balance.holdings || marketData.length === 0) return;

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      Object.keys(balance.holdings).forEach((symbol) => {
        if (symbol === "USDT") return; 

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
          
        }
      });
    }, 3000);
  }, [balance, marketData, dispatch]);

  useEffect(() => {
    if (marketData.length > 0 && balance?.holdings) {
      updatePortfolioPrices();
    }
  }, [marketData, balance?.holdings, updatePortfolioPrices]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

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
