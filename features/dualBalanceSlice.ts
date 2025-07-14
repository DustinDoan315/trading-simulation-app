import UUIDService from '../services/UUIDService';
import {
  CollectionBalance,
  CombinedPnLResult,
  DualBalanceState,
  IndividualBalance,
  PnLResult,
  TradingContext
  } from '../types/database';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DualBalanceService } from '../services/DualBalanceService';
import { Holding, HoldingUpdatePayload } from '../types/crypto';


// Initial state
const initialState: DualBalanceState = {
  individual: {
    usdtBalance: 100000,
    totalPortfolioValue: 100000,
    holdings: {},
    totalPnL: 0,
    totalPnLPercentage: 0,
    initialBalance: 100000,
  },
  collections: {},
  activeContext: {
    type: 'individual',
  },
};

// Async thunks
export const loadIndividualBalance = createAsyncThunk(
  'dualBalance/loadIndividual',
  async () => {
    const uuid = await UUIDService.getOrCreateUser();
    return await DualBalanceService.getIndividualBalance(uuid);
  }
);

export const loadCollectionBalance = createAsyncThunk(
  'dualBalance/loadCollection',
  async (collectionId: string) => {
    const uuid = await UUIDService.getOrCreateUser();
    return await DualBalanceService.getCollectionBalance(collectionId, uuid);
  }
);

export const executeTrade = createAsyncThunk(
  'dualBalance/executeTrade',
  async ({ order, context }: { order: any; context: TradingContext }) => {
    const uuid = await UUIDService.getOrCreateUser();
    const transaction = await DualBalanceService.executeTrade(order, context, uuid);
    
    // Return both the transaction and the updated balance
    if (context.type === 'individual') {
      const updatedBalance = await DualBalanceService.getIndividualBalance(uuid);
      return { transaction, updatedBalance };
    } else {
      const updatedBalance = await DualBalanceService.getCollectionBalance(context.collectionId!, uuid);
      return { transaction, updatedBalance };
    }
  }
);

export const calculateIndividualPnL = createAsyncThunk(
  'dualBalance/calculateIndividualPnL',
  async () => {
    const uuid = await UUIDService.getOrCreateUser();
    return await DualBalanceService.calculateIndividualPnL(uuid);
  }
);

export const calculateCollectionPnL = createAsyncThunk(
  'dualBalance/calculateCollectionPnL',
  async (collectionId: string) => {
    const uuid = await UUIDService.getOrCreateUser();
    return await DualBalanceService.calculateCollectionPnL(collectionId, uuid);
  }
);

export const calculateCombinedPnL = createAsyncThunk(
  'dualBalance/calculateCombinedPnL',
  async () => {
    const uuid = await UUIDService.getOrCreateUser();
    return await DualBalanceService.calculateCombinedPnL(uuid);
  }
);

// Helper function to calculate total portfolio value
const calculateTotalPortfolioValue = (holdings: Record<string, any>): number => {
  let totalValue = 0;
  
  Object.values(holdings).forEach((holding: any) => {
    if (holding.symbol === 'USDT') {
      totalValue += holding.amount;
    } else {
      totalValue += holding.valueInUSD;
    }
  });
  
  return totalValue;
};

// Helper function to calculate profit/loss for a holding
const calculateProfitLoss = (holding: any) => {
  const costBasis = holding.amount * holding.averageBuyPrice;
  const marketValue = holding.amount * holding.currentPrice;
  holding.profitLoss = marketValue - costBasis;
  holding.profitLossPercentage = costBasis > 0 ? (holding.profitLoss / costBasis) * 100 : 0;
};

const dualBalanceSlice = createSlice({
  name: 'dualBalance',
  initialState,
  reducers: {
    // Set active trading context
    setTradingContext: (state, action: PayloadAction<TradingContext>) => {
      state.activeContext = action.payload;
    },

    // Update individual balance
    updateIndividualBalance: (state, action: PayloadAction<IndividualBalance>) => {
      state.individual = action.payload;
    },

    // Update collection balance
    updateCollectionBalance: (state, action: PayloadAction<CollectionBalance>) => {
      state.collections[action.payload.collectionId] = action.payload;
    },

    // Update individual holding
    updateIndividualHolding: (state, action: PayloadAction<HoldingUpdatePayload>) => {
      const { symbol, amount, valueInUSD, name, image_url } = action.payload;
      const normalizedSymbol = symbol.toUpperCase();
      const holdings = state.individual.holdings;

      if (normalizedSymbol === 'USDT') {
        // Handle USDT balance update
        const newUsdtBalance = state.individual.usdtBalance + amount;
        if (newUsdtBalance < 0) {
          throw new Error('Insufficient USDT balance');
        }
        
        state.individual.usdtBalance = newUsdtBalance;
        holdings.USDT = {
          ...holdings.USDT,
          amount: newUsdtBalance,
          valueInUSD: newUsdtBalance,
        };
      } else {
        // Handle crypto holding update
        const currentHolding = holdings[normalizedSymbol];
        
        if (currentHolding) {
          const newAmount = currentHolding.amount + amount;
          
          if (amount > 0) {
            // Buying: add to position
            const totalCost = currentHolding.amount * currentHolding.averageBuyPrice + valueInUSD;
            const newAverageBuyPrice = newAmount > 0 ? totalCost / newAmount : 0;
            const newValueInUSD = currentHolding.valueInUSD + valueInUSD;

            holdings[normalizedSymbol] = {
              ...currentHolding,
              amount: newAmount,
              valueInUSD: newValueInUSD,
              averageBuyPrice: newAverageBuyPrice,
            };
          } else {
            // Selling: reduce position proportionally
            const sellRatio = Math.abs(amount) / currentHolding.amount;
            const newValueInUSD = currentHolding.valueInUSD * (1 - sellRatio);

            holdings[normalizedSymbol] = {
              ...currentHolding,
              amount: newAmount,
              valueInUSD: newValueInUSD,
            };
          }

          calculateProfitLoss(holdings[normalizedSymbol]);

          if (newAmount <= 0) {
            delete holdings[normalizedSymbol];
          }
        } else if (amount > 0) {
          // Create new holding
          const pricePerToken = valueInUSD / amount;
          holdings[normalizedSymbol] = {
            amount,
            valueInUSD,
            symbol: normalizedSymbol,
            name: name || normalizedSymbol,
            image_url: image_url || `https://cryptologos.cc/logos/${normalizedSymbol.toLowerCase()}-logo.png`,
            averageBuyPrice: pricePerToken,
            currentPrice: pricePerToken,
            profitLoss: 0,
            profitLossPercentage: 0,
          };
        }
      }

      // Recalculate total portfolio value and PnL
      state.individual.totalPortfolioValue = calculateTotalPortfolioValue(holdings);
      state.individual.totalPnL = state.individual.totalPortfolioValue - state.individual.initialBalance;
      state.individual.totalPnLPercentage = state.individual.initialBalance > 0 ? 
        (state.individual.totalPnL / state.individual.initialBalance) * 100 : 0;
    },

    // Update collection holding
    updateCollectionHolding: (state, action: PayloadAction<{
      collectionId: string;
      holding: HoldingUpdatePayload;
    }>) => {
      const { collectionId, holding } = action.payload;
      const { symbol, amount, valueInUSD, name, image_url } = holding;
      const normalizedSymbol = symbol.toUpperCase();
      
      if (!state.collections[collectionId]) {
        // Initialize collection balance if it doesn't exist
        state.collections[collectionId] = {
          usdtBalance: 100000, // Default starting balance
          totalPortfolioValue: 100000,
          holdings: {},
          totalPnL: 0,
          totalPnLPercentage: 0,
          startingBalance: 100000,
          collectionId,
        };
      }

      const collectionBalance = state.collections[collectionId];
      const holdings = collectionBalance.holdings;

      if (normalizedSymbol === 'USDT') {
        // Handle USDT balance update
        const newUsdtBalance = collectionBalance.usdtBalance + amount;
        if (newUsdtBalance < 0) {
          throw new Error('Insufficient USDT balance');
        }
        
        collectionBalance.usdtBalance = newUsdtBalance;
        holdings.USDT = {
          ...holdings.USDT,
          amount: newUsdtBalance,
          valueInUSD: newUsdtBalance,
        };
      } else {
        // Handle crypto holding update
        const currentHolding = holdings[normalizedSymbol];
        
        if (currentHolding) {
          const newAmount = currentHolding.amount + amount;
          
          if (amount > 0) {
            // Buying: add to position
            const totalCost = currentHolding.amount * currentHolding.averageBuyPrice + valueInUSD;
            const newAverageBuyPrice = newAmount > 0 ? totalCost / newAmount : 0;
            const newValueInUSD = currentHolding.valueInUSD + valueInUSD;

            holdings[normalizedSymbol] = {
              ...currentHolding,
              amount: newAmount,
              valueInUSD: newValueInUSD,
              averageBuyPrice: newAverageBuyPrice,
            };
          } else {
            // Selling: reduce position proportionally
            const sellRatio = Math.abs(amount) / currentHolding.amount;
            const newValueInUSD = currentHolding.valueInUSD * (1 - sellRatio);

            holdings[normalizedSymbol] = {
              ...currentHolding,
              amount: newAmount,
              valueInUSD: newValueInUSD,
            };
          }

          calculateProfitLoss(holdings[normalizedSymbol]);

          if (newAmount <= 0) {
            delete holdings[normalizedSymbol];
          }
        } else if (amount > 0) {
          // Create new holding
          const pricePerToken = valueInUSD / amount;
          holdings[normalizedSymbol] = {
            amount,
            valueInUSD,
            symbol: normalizedSymbol,
            name: name || normalizedSymbol,
            image_url: image_url || `https://cryptologos.cc/logos/${normalizedSymbol.toLowerCase()}-logo.png`,
            averageBuyPrice: pricePerToken,
            currentPrice: pricePerToken,
            profitLoss: 0,
            profitLossPercentage: 0,
          };
        }
      }

      // Recalculate total portfolio value and PnL
      collectionBalance.totalPortfolioValue = calculateTotalPortfolioValue(holdings);
      collectionBalance.totalPnL = collectionBalance.totalPortfolioValue - collectionBalance.startingBalance;
      collectionBalance.totalPnLPercentage = collectionBalance.startingBalance > 0 ? 
        (collectionBalance.totalPnL / collectionBalance.startingBalance) * 100 : 0;
    },

    // Update current prices for individual holdings
    updateIndividualCurrentPrice: (state, action: PayloadAction<{
      symbol: string;
      currentPrice: number;
    }>) => {
      const { symbol, currentPrice } = action.payload;
      const normalizedSymbol = symbol.toUpperCase();
      const holding = state.individual.holdings[normalizedSymbol];

      if (holding) {
        holding.currentPrice = currentPrice;
        holding.valueInUSD = holding.amount * currentPrice;
        calculateProfitLoss(holding);
        
        // Recalculate total portfolio value and PnL
        state.individual.totalPortfolioValue = calculateTotalPortfolioValue(state.individual.holdings);
        state.individual.totalPnL = state.individual.totalPortfolioValue - state.individual.initialBalance;
        state.individual.totalPnLPercentage = state.individual.initialBalance > 0 ? 
          (state.individual.totalPnL / state.individual.initialBalance) * 100 : 0;
      }
    },

    // Update current prices for collection holdings
    updateCollectionCurrentPrice: (state, action: PayloadAction<{
      collectionId: string;
      symbol: string;
      currentPrice: number;
    }>) => {
      const { collectionId, symbol, currentPrice } = action.payload;
      const normalizedSymbol = symbol.toUpperCase();
      const collectionBalance = state.collections[collectionId];
      
      if (collectionBalance) {
        const holding = collectionBalance.holdings[normalizedSymbol];

        if (holding) {
          holding.currentPrice = currentPrice;
          holding.valueInUSD = holding.amount * currentPrice;
          calculateProfitLoss(holding);
          
          // Recalculate total portfolio value and PnL
          collectionBalance.totalPortfolioValue = calculateTotalPortfolioValue(collectionBalance.holdings);
          collectionBalance.totalPnL = collectionBalance.totalPortfolioValue - collectionBalance.startingBalance;
          collectionBalance.totalPnLPercentage = collectionBalance.startingBalance > 0 ? 
            (collectionBalance.totalPnL / collectionBalance.startingBalance) * 100 : 0;
        }
      }
    },

    // Reset all balances
    resetAllBalances: (state) => {
      state.individual = initialState.individual;
      state.collections = {};
    },

    // Remove collection balance
    removeCollectionBalance: (state, action: PayloadAction<string>) => {
      delete state.collections[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      // Load individual balance
      .addCase(loadIndividualBalance.pending, (state) => {
        // Handle loading state if needed
      })
      .addCase(loadIndividualBalance.fulfilled, (state, action) => {
        state.individual = action.payload;
      })
      .addCase(loadIndividualBalance.rejected, (state, action) => {
        console.error('Failed to load individual balance:', action.error);
      })

      // Load collection balance
      .addCase(loadCollectionBalance.pending, (state) => {
        // Handle loading state if needed
      })
      .addCase(loadCollectionBalance.fulfilled, (state, action) => {
        state.collections[action.payload.collectionId] = action.payload;
      })
      .addCase(loadCollectionBalance.rejected, (state, action) => {
        console.error('Failed to load collection balance:', action.error);
      })

      // Execute trade
      .addCase(executeTrade.pending, (state) => {
        // Handle loading state if needed
      })
      .addCase(executeTrade.fulfilled, (state, action) => {
        // Trade executed successfully, update the balance in Redux state
        console.log('Trade executed successfully:', action.payload);
        
        const { transaction, updatedBalance } = action.payload;
        
        // Update the appropriate balance based on the context
        if ('collectionId' in updatedBalance) {
          // Collection balance
          state.collections[updatedBalance.collectionId] = updatedBalance;
        } else {
          // Individual balance
          state.individual = updatedBalance;
        }
      })
      .addCase(executeTrade.rejected, (state, action) => {
        console.error('Failed to execute trade:', action.error);
      });
  },
});

export const {
  setTradingContext,
  updateIndividualBalance,
  updateCollectionBalance,
  updateIndividualHolding,
  updateCollectionHolding,
  updateIndividualCurrentPrice,
  updateCollectionCurrentPrice,
  resetAllBalances,
  removeCollectionBalance,
} = dualBalanceSlice.actions;

export default dualBalanceSlice.reducer; 