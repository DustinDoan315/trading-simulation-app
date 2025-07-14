import UUIDService from '@/services/UUIDService';
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
import { createUser, fetchUser } from '@/features/userSlice';
import { HoldingUpdatePayload } from '@/types/crypto';
import { logger } from '@/utils/logger';
import { RootState, useAppDispatch, useAppSelector } from '@/store';
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
  } = useAppSelector((state: RootState) => state.dualBalance);

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

  // Initialize or re-initialize user if needed
  const initializeUserIfNeeded = useCallback(async () => {
    if (!user?.id) {
      try {
        logger.info("User not authenticated, initializing user data", "useDualBalance");
        
        // Get or create user UUID
        const userId = await UUIDService.getOrCreateUser();
        
        // Try to fetch existing user first
        try {
          await dispatch(fetchUser(userId)).unwrap();
          logger.info("Existing user fetched successfully", "useDualBalance");
        } catch (error) {
          // If user doesn't exist, create a new one
          logger.info("User not found, creating new user", "useDualBalance");
          const timestamp = Date.now().toString().slice(-6); // Get last 6 digits of timestamp
          const username = `user_${userId.slice(0, 8)}_${timestamp}`;
          await dispatch(createUser({
            username,
            display_name: username,
            avatar_emoji: "🚀",
            usdt_balance: "100000.00",
          })).unwrap();
        }
      } catch (error) {
        logger.error("Failed to initialize user", "useDualBalance", error);
        throw new Error("Failed to initialize user authentication");
      }
    }
  }, [user?.id, dispatch]);

  // Load individual balance
  const loadIndividual = useCallback(async () => {
    try {
      // Ensure user is authenticated first
      await initializeUserIfNeeded();
      
      const userId = await UUIDService.getOrCreateUser();
      await dispatch(loadIndividualBalance()).unwrap();
    } catch (error) {
      console.error('Failed to load individual balance:', error);
      throw error;
    }
  }, [dispatch, initializeUserIfNeeded]);

  // Load collection balance
  const loadCollection = useCallback(async (collectionId: string) => {
    try {
      // Ensure user is authenticated first
      await initializeUserIfNeeded();
      
      const userId = await UUIDService.getOrCreateUser();
      await dispatch(loadCollectionBalance(collectionId)).unwrap();
    } catch (error) {
      console.error('Failed to load collection balance:', error);
      throw error;
    }
  }, [dispatch, initializeUserIfNeeded]);

  // Switch trading context
  const switchContext = useCallback((context: TradingContext) => {
    dispatch(setTradingContext(context));
  }, [dispatch]);

  // Execute trade in current context
  const executeTradeInContext = useCallback(async (order: any) => {
    try {
      // Ensure user is authenticated first
      await initializeUserIfNeeded();
      
      const userId = await UUIDService.getOrCreateUser();
      
      const result = await dispatch(executeTrade({ 
        order, 
        context: activeContext 
      })).unwrap();
      
      // The Redux state is automatically updated in executeTrade.fulfilled
      // No need to manually reload the balance
      
      return result;
    } catch (error) {
      console.error('Failed to execute trade:', error);
      throw error;
    }
  }, [dispatch, activeContext, initializeUserIfNeeded]);

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

  // Update current price for individual holdings
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

  // Calculate PnL for individual context
  const calculateIndividualPnLResult = useCallback(async () => {
    try {
      await initializeUserIfNeeded();
      return await dispatch(calculateIndividualPnL()).unwrap();
    } catch (error) {
      console.error('Failed to calculate individual PnL:', error);
      throw error;
    }
  }, [dispatch, initializeUserIfNeeded]);

  // Calculate PnL for collection context
  const calculateCollectionPnLResult = useCallback(async (collectionId: string) => {
    try {
      await initializeUserIfNeeded();
      return await dispatch(calculateCollectionPnL(collectionId)).unwrap();
    } catch (error) {
      console.error('Failed to calculate collection PnL:', error);
      throw error;
    }
  }, [dispatch, initializeUserIfNeeded]);

  // Calculate combined PnL
  const calculateCombinedPnLResult = useCallback(async () => {
    try {
      await initializeUserIfNeeded();
      return await dispatch(calculateCombinedPnL()).unwrap();
    } catch (error) {
      console.error('Failed to calculate combined PnL:', error);
      throw error;
    }
  }, [dispatch, initializeUserIfNeeded]);

  // Get all collection balances
  const getAllCollectionBalances = useCallback(() => {
    return collections;
  }, [collections]);

  // Get specific collection balance
  const getCollectionBalance = useCallback((collectionId: string) => {
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
    const loadInitialData = async () => {
      try {
        await initializeUserIfNeeded();
        await loadIndividual();
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, [initializeUserIfNeeded, loadIndividual]);

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