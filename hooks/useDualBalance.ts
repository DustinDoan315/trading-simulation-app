import {
    calculateCollectionPnL,
    calculateCombinedPnL,
    calculateIndividualPnL,
    executeTrade,
    loadCollectionBalance,
    loadIndividualBalance,
    setTradingContext,
    updateCollectionCurrentPrice,
    updateCollectionHolding,
    updateIndividualCurrentPrice,
    updateIndividualHolding
    } from '@/features/dualBalanceSlice';
import { CollectionBalance, IndividualBalance, TradingContext } from '@/types/database';
import { HoldingUpdatePayload } from '@/types/crypto';
import { useAppDispatch, useAppSelector } from '@/store';
import { useCallback, useEffect, useMemo } from 'react';
import { useUser } from '@/context/UserContext';


export const useDualBalance = () => {
  const dispatch = useAppDispatch();
  const { user } = useUser();
  
  // Get state from Redux
  const {
    individual,
    collections,
    activeContext
  } = useAppSelector(state => state.dualBalance);

  // Get current balance based on active context
  const currentBalance = useMemo(() => {
    if (activeContext.type === 'individual') {
      return individual;
    } else if (activeContext.collectionId && collections[activeContext.collectionId]) {
      return collections[activeContext.collectionId];
    }
    return individual; // Fallback to individual
  }, [activeContext, individual, collections]);

  // Get current holdings based on active context
  const currentHoldings = useMemo(() => {
    return currentBalance.holdings;
  }, [currentBalance]);

  // Get current USDT balance based on active context
  const currentUsdtBalance = useMemo(() => {
    return currentBalance.usdtBalance;
  }, [currentBalance]);

  // Get current portfolio value based on active context
  const currentPortfolioValue = useMemo(() => {
    return currentBalance.totalPortfolioValue;
  }, [currentBalance]);

  // Get current PnL based on active context
  const currentPnL = useMemo(() => {
    return {
      totalPnL: currentBalance.totalPnL,
      totalPnLPercentage: currentBalance.totalPnLPercentage,
    };
  }, [currentBalance]);

  // Load individual balance
  const loadIndividual = useCallback(async () => {
    if (!user?.id) return;
    try {
      await dispatch(loadIndividualBalance()).unwrap();
    } catch (error) {
      console.error('Failed to load individual balance:', error);
    }
  }, [dispatch, user?.id]);

  // Load collection balance
  const loadCollection = useCallback(async (collectionId: string) => {
    if (!user?.id) return;
    try {
      await dispatch(loadCollectionBalance(collectionId)).unwrap();
    } catch (error) {
      console.error('Failed to load collection balance:', error);
    }
  }, [dispatch, user?.id]);

  // Switch trading context
  const switchContext = useCallback((context: TradingContext) => {
    dispatch(setTradingContext(context));
  }, [dispatch]);

  // Execute trade in current context
  const executeTradeInContext = useCallback(async (order: any) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const result = await dispatch(executeTrade({ 
        order, 
        context: activeContext 
      })).unwrap();
      
      // Reload the appropriate balance after trade
      if (activeContext.type === 'individual') {
        await loadIndividual();
      } else if (activeContext.collectionId) {
        await loadCollection(activeContext.collectionId);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to execute trade:', error);
      throw error;
    }
  }, [dispatch, user?.id, activeContext, loadIndividual, loadCollection]);

  // Update holding in current context
  const updateHolding = useCallback((payload: HoldingUpdatePayload) => {
    if (activeContext.type === 'individual') {
      dispatch(updateIndividualHolding(payload));
    } else if (activeContext.collectionId) {
      dispatch(updateCollectionHolding({
        collectionId: activeContext.collectionId,
        holding: payload
      }));
    }
  }, [dispatch, activeContext]);

  // Update current price in current context
  const updateCurrentPrice = useCallback((symbol: string, currentPrice: number) => {
    if (activeContext.type === 'individual') {
      dispatch(updateIndividualCurrentPrice({ symbol, currentPrice }));
    } else if (activeContext.collectionId) {
      dispatch(updateCollectionCurrentPrice({
        collectionId: activeContext.collectionId,
        symbol,
        currentPrice
      }));
    }
  }, [dispatch, activeContext]);

  // Calculate PnL for individual trading
  const calculateIndividualPnLResult = useCallback(async () => {
    if (!user?.id) return null;
    try {
      const result = await dispatch(calculateIndividualPnL()).unwrap();
      return result;
    } catch (error) {
      console.error('Failed to calculate individual PnL:', error);
      return null;
    }
  }, [dispatch, user?.id]);

  // Calculate PnL for collection trading
  const calculateCollectionPnLResult = useCallback(async (collectionId: string) => {
    if (!user?.id) return null;
    try {
      const result = await dispatch(calculateCollectionPnL(collectionId)).unwrap();
      return result;
    } catch (error) {
      console.error('Failed to calculate collection PnL:', error);
      return null;
    }
  }, [dispatch, user?.id]);

  // Calculate combined PnL
  const calculateCombinedPnLResult = useCallback(async () => {
    if (!user?.id) return null;
    try {
      const result = await dispatch(calculateCombinedPnL()).unwrap();
      return result;
    } catch (error) {
      console.error('Failed to calculate combined PnL:', error);
      return null;
    }
  }, [dispatch, user?.id]);

  // Get all collection balances
  const getAllCollectionBalances = useMemo(() => {
    return Object.values(collections);
  }, [collections]);

  // Get specific collection balance
  const getCollectionBalance = useCallback((collectionId: string): CollectionBalance | null => {
    return collections[collectionId] || null;
  }, [collections]);

  // Check if user has sufficient balance for a trade
  const hasSufficientBalance = useCallback((requiredAmount: number, symbol: string = 'USDT'): boolean => {
    if (symbol.toUpperCase() === 'USDT') {
      return currentUsdtBalance >= requiredAmount;
    } else {
      const holding = currentHoldings[symbol.toUpperCase()];
      return holding ? holding.amount >= requiredAmount : false;
    }
  }, [currentUsdtBalance, currentHoldings]);

  // Get available balance for a specific symbol
  const getAvailableBalance = useCallback((symbol: string = 'USDT'): number => {
    if (symbol.toUpperCase() === 'USDT') {
      return currentUsdtBalance;
    } else {
      const holding = currentHoldings[symbol.toUpperCase()];
      return holding ? holding.amount : 0;
    }
  }, [currentUsdtBalance, currentHoldings]);

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      loadIndividual();
    }
  }, [user?.id, loadIndividual]);

  return {
    // State
    individual,
    collections,
    activeContext,
    currentBalance,
    currentHoldings,
    currentUsdtBalance,
    currentPortfolioValue,
    currentPnL,
    getAllCollectionBalances,
    
    // Actions
    loadIndividual,
    loadCollection,
    switchContext,
    executeTradeInContext,
    updateHolding,
    updateCurrentPrice,
    calculateIndividualPnLResult,
    calculateCollectionPnLResult,
    calculateCombinedPnLResult,
    getCollectionBalance,
    hasSufficientBalance,
    getAvailableBalance,
    
    // Context helpers
    isIndividualContext: activeContext.type === 'individual',
    isCollectionContext: activeContext.type === 'collection',
    currentCollectionId: activeContext.collectionId,
  };
}; 