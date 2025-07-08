import AsyncStorage from '@react-native-async-storage/async-storage';
import UserRepository from '../services/UserRepository';
import UUIDService from '../services/UUIDService';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Holding, HoldingUpdatePayload, Order } from '../types/crypto';
import { TRADING_CONFIG, ERROR_MESSAGES, DEFAULT_CRYPTO, STORAGE_KEYS } from '../constants/AppConstants';


export interface UserBalance {
  usdtBalance: number; // Available USDT for trading
  totalPortfolioValue: number; // Total portfolio value including all assets
  holdings: Record<string, Holding>;
}

interface BalanceState {
  balance: UserBalance;
  previousBalance: UserBalance | null;
  changePercentage: number;
  changeValue: number;
  tradeHistory: Order[];
  loading: boolean;
  error: string | null;
}

// Helper function to calculate profit/loss
const calculateProfitLoss = (holding: Holding) => {
  if (
    !holding ||
    typeof holding.amount !== "number" ||
    typeof holding.currentPrice !== "number" ||
    typeof holding.averageBuyPrice !== "number"
  ) {
    console.warn("Invalid holding data for profit/loss calculation:", holding);
    holding.profitLoss = 0;
    holding.profitLossPercentage = 0;
    return holding;
  }

  const marketValue = holding.amount * holding.currentPrice;
  const costBasis = holding.amount * holding.averageBuyPrice;
  holding.profitLoss = marketValue - costBasis;
  holding.profitLossPercentage =
    costBasis > 0 ? (holding.profitLoss / costBasis) * 100 : 0;
  return holding;
};

// Helper to calculate total portfolio value
const calculateTotalPortfolioValue = (
  holdings: Record<string, Holding>,
  usdtBalance: number
): number => {
  if (!holdings || typeof holdings !== "object") {
    console.warn(
      "Invalid holdings object for portfolio value calculation:",
      holdings
    );
    return usdtBalance;
  }

  // Start with USDT balance as base
  let totalValue = usdtBalance;

  // Add value of all other holdings (excluding USDT to avoid double counting)
  Object.keys(holdings).forEach((key) => {
    const holding = holdings[key];
    if (
      !holding ||
      typeof holding.amount !== "number" ||
      typeof holding.valueInUSD !== "number"
    ) {
      console.warn("Invalid holding data in portfolio calculation:", holding);
      return;
    }

    // Skip USDT as it's already counted in usdtBalance
    if (holding.symbol !== "USDT") {
      totalValue += holding.valueInUSD;
    }
  });

  return totalValue;
};

const initialState: BalanceState = {
  balance: {
    usdtBalance: TRADING_CONFIG.DEFAULT_BALANCE,
    totalPortfolioValue: TRADING_CONFIG.DEFAULT_BALANCE,
    holdings: {
      USDT: {
        amount: TRADING_CONFIG.DEFAULT_BALANCE,
        valueInUSD: TRADING_CONFIG.DEFAULT_BALANCE,
        symbol: DEFAULT_CRYPTO.SYMBOLS.tether,
        name: DEFAULT_CRYPTO.NAMES.tether,
        image_url: DEFAULT_CRYPTO.IMAGES.tether,
        averageBuyPrice: 1,
        currentPrice: 1,
        profitLoss: 0,
        profitLossPercentage: 0,
      },
    },
  },
  previousBalance: null,
  changePercentage: 0,
  changeValue: 0,
  tradeHistory: [],
  loading: false,
  error: null,
};

// Add this type above the loadBalance thunk
interface PortfolioItem {
  symbol: string;
  quantity: string;
  avg_cost: string;
  current_price?: string;
  image_url?: string;
  image?: string;
}

// Async thunk to load balance from database
export const loadBalance = createAsyncThunk("balance/load", async () => {
  const uuid = await UUIDService.getOrCreateUser();
  let user = await UserRepository.getUser(uuid);
  
  // If user not found in UserRepository, try to get from UUIDService cache
  if (!user) {
    try {
      const userProfileStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (userProfileStr) {
        const userProfile = JSON.parse(userProfileStr);
        if (userProfile.id === uuid) {
          user = userProfile;
        }
      }
    } catch (error) {
      // Silent error handling - user will be recreated below
    }
  }

  // If still no user found, recreate user data
  if (!user) {
    try {
      const { AsyncStorageService } = await import('../services/AsyncStorageService');
      user = await AsyncStorageService.recreateUserData(uuid, TRADING_CONFIG.DEFAULT_BALANCE);
    } catch (error) {
      // Silent error handling
    }
  }
  
  let usdtBalance = user ? parseFloat(user.usdt_balance) : TRADING_CONFIG.DEFAULT_BALANCE;
  const portfolio = (await UserRepository.getPortfolio(uuid)) as PortfolioItem[];

  // Calculate the correct USDT balance based on portfolio data
  // If there are crypto holdings, the USDT balance should be reduced
  let calculatedUsdtBalance = TRADING_CONFIG.DEFAULT_BALANCE; // Start with initial balance
  let totalCryptoValue = 0;

  portfolio.forEach((item) => {
    if (item.symbol.toUpperCase() !== DEFAULT_CRYPTO.SYMBOLS.tether) {
      const quantity = parseFloat(item.quantity);
      const currentPrice = parseFloat(item.current_price || item.avg_cost);
      const valueInUSD = quantity * currentPrice;
      totalCryptoValue += valueInUSD;
    }
  });

  calculatedUsdtBalance = TRADING_CONFIG.DEFAULT_BALANCE - totalCryptoValue;

  // Use the calculated balance if it's different from the stored balance
  if (Math.abs(calculatedUsdtBalance - usdtBalance) > 1) {
    usdtBalance = calculatedUsdtBalance;
    
    // Update the user's USDT balance in AsyncStorage
    try {
      await UserRepository.updateUserBalance(uuid, usdtBalance);
    } catch (error) {
      // Silent error handling
    }
  }

  // Initialize holdings object
  const holdings: Record<string, Holding> = {};

  // Add portfolio holdings (excluding USDT)
  portfolio.forEach((item) => {
    if (item.symbol.toUpperCase() !== DEFAULT_CRYPTO.SYMBOLS.tether) {
      const quantity = parseFloat(item.quantity);
      const currentPrice = parseFloat(item.current_price || item.avg_cost);
      const avgCost = parseFloat(item.avg_cost);
      const valueInUSD = quantity * currentPrice;
      const profitLoss = valueInUSD - (quantity * avgCost);
      const profitLossPercentage = avgCost > 0 ? (profitLoss / (quantity * avgCost)) * 100 : 0;
      
      holdings[item.symbol.toUpperCase()] = {
        amount: quantity,
        valueInUSD: valueInUSD,
        symbol: item.symbol.toUpperCase(),
        name: item.symbol,
        image_url:
          item.image_url || item.image ||
          `https://cryptologos.cc/logos/${item.symbol.toLowerCase()}-logo.png`,
        averageBuyPrice: avgCost,
        currentPrice: currentPrice,
        profitLoss: profitLoss,
        profitLossPercentage: profitLossPercentage,
      };
    }
  });

  // Always include USDT in holdings for display purposes
  holdings.USDT = {
    amount: usdtBalance,
    valueInUSD: usdtBalance,
    symbol: DEFAULT_CRYPTO.SYMBOLS.tether,
    name: DEFAULT_CRYPTO.NAMES.tether,
    image_url: DEFAULT_CRYPTO.IMAGES.tether,
    averageBuyPrice: 1,
    currentPrice: 1,
    profitLoss: 0,
    profitLossPercentage: 0,
  };

  const totalPortfolioValue = calculateTotalPortfolioValue(holdings, usdtBalance);

  return {
    usdtBalance,
    totalPortfolioValue,
    holdings,
  };
});

export const balanceSlice = createSlice({
  name: "balance",
  initialState,
  reducers: {
    addTradeHistory: (state, action: PayloadAction<Order>) => {
      state.tradeHistory.push(action.payload);
    },
    setBalance: (state, action: PayloadAction<UserBalance>) => {
      state.previousBalance = state.balance;
      state.balance = action.payload;

      if (state.previousBalance) {
        state.changeValue =
          state.balance.totalPortfolioValue - state.previousBalance.totalPortfolioValue;
        state.changePercentage =
          state.previousBalance.totalPortfolioValue !== 0
            ? (state.changeValue / state.previousBalance.totalPortfolioValue) * 100
            : 0;
      }

      // Persist both USDT balance and portfolio to database
      UUIDService.getOrCreateUser().then((uuid) => {
        // Calculate total PnL
        let totalPnL = 0;
        Object.values(state.balance.holdings).forEach((holding: any) => {
          if (holding.symbol !== "USDT") {
            totalPnL += holding.profitLoss || 0;
          }
        });

        UserRepository.updateUserBalanceAndPortfolioValue(
          uuid, 
          state.balance.usdtBalance, 
          state.balance.totalPortfolioValue, 
          totalPnL
        );
        UserRepository.updatePortfolio(uuid, state.balance.holdings);
      });
    },
    resetBalance: (state) => {
      return { ...initialState };
    },
    updateHolding: (state, action: PayloadAction<HoldingUpdatePayload>) => {

      const { cryptoId, amount, valueInUSD, symbol, name, image_url } =
        action.payload;

      // Normalize cryptoId to uppercase to prevent duplicates
      const normalizedSymbol = symbol.toUpperCase();
      const holdings = state.balance.holdings;
      const currentHolding = holdings[normalizedSymbol];

      // Handle USDT balance updates separately from other holdings
      if (normalizedSymbol === "USDT") {

        // Update USDT balance directly
        const newUsdtBalance = state.balance.usdtBalance + amount;
        
        // Prevent negative balance
        if (newUsdtBalance < 0) {
          throw new Error(ERROR_MESSAGES.INSUFFICIENT_BALANCE);
        }

        state.balance.usdtBalance = newUsdtBalance;
        
        // Update USDT holding for display purposes
        holdings.USDT = {
          ...holdings.USDT,
          amount: newUsdtBalance,
          valueInUSD: newUsdtBalance,
        };
      } else {
        const pricePerToken = amount !== 0 ? Math.abs(valueInUSD / amount) : 0;

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
              // Keep the same average buy price when selling
            };
          }

                      // Recalculate profit/loss
            calculateProfitLoss(holdings[normalizedSymbol]);

            // Remove holding if amount becomes zero or negative
            if (newAmount <= 0) {
              delete holdings[normalizedSymbol];
            }
          } else {
            // Create new holding
            holdings[normalizedSymbol] = {
              amount,
              valueInUSD,
              symbol: normalizedSymbol,
              name,
              image_url,
              averageBuyPrice: pricePerToken,
              currentPrice: pricePerToken,
              profitLoss: 0,
              profitLossPercentage: 0,
            };
        }
      }

      // Recalculate total portfolio value
      state.balance.totalPortfolioValue = calculateTotalPortfolioValue(
        holdings,
        state.balance.usdtBalance
      );

      // Persist to database

      try {
        // Extract values to avoid Proxy issues
        const usdtBalance = state.balance.usdtBalance;
        const totalPortfolioValue = state.balance.totalPortfolioValue;
        const holdingsCopy = JSON.parse(JSON.stringify(holdings));

        // Calculate total PnL
        let totalPnL = 0;
        Object.values(holdingsCopy).forEach((holding: any) => {
          if (holding.symbol !== "USDT") {
            totalPnL += holding.profitLoss || 0;
          }
        });

        // Use a single async operation to update both balance and portfolio
        UUIDService.getOrCreateUser()
          .then(async (uuid) => {
            // Update both USDT balance and total portfolio value in users table
            await UserRepository.updateUserBalanceAndPortfolioValue(
              uuid, 
              usdtBalance, 
              totalPortfolioValue, 
              totalPnL
            );
            
            // Update portfolio holdings in the same operation
            await UserRepository.updatePortfolio(uuid, holdingsCopy);
          })
          .catch((error) => {
            // Silent error handling for production
          });
      } catch (error) {
        // Silent error handling for production
      }
    },
    updatePortfolio: (state, action: PayloadAction<UserBalance>) => {
      state.balance = action.payload;
      state.balance.totalPortfolioValue = calculateTotalPortfolioValue(
        action.payload.holdings,
        action.payload.usdtBalance
      );

      // Persist to database
      UUIDService.getOrCreateUser().then((uuid) => {
        // Calculate total PnL
        let totalPnL = 0;
        Object.values(action.payload.holdings).forEach((holding: any) => {
          if (holding.symbol !== "USDT") {
            totalPnL += holding.profitLoss || 0;
          }
        });

        UserRepository.updateUserBalanceAndPortfolioValue(
          uuid, 
          action.payload.usdtBalance, 
          action.payload.totalPortfolioValue, 
          totalPnL
        );
        UserRepository.updatePortfolio(uuid, action.payload.holdings);
      });
    },
    updateCurrentPrice: (
      state,
      action: PayloadAction<{ cryptoId: string; currentPrice: number }>
    ) => {
      const { cryptoId, currentPrice } = action.payload;
      const normalizedSymbol = cryptoId.toUpperCase();
      const holding = state.balance.holdings[normalizedSymbol];

      if (holding) {
        holding.currentPrice = currentPrice;
        holding.valueInUSD = holding.amount * currentPrice;
        calculateProfitLoss(holding);
        
        // Recalculate total portfolio value
        state.balance.totalPortfolioValue = calculateTotalPortfolioValue(
          state.balance.holdings,
          state.balance.usdtBalance
        );

        // Update database with new values
        UUIDService.getOrCreateUser().then((uuid) => {
          UserRepository.updatePortfolio(uuid, state.balance.holdings);
        });
      }
    },
    // New action to sync USDT balance with the correct amount
    syncUsdtBalance: (state, action: PayloadAction<number>) => {
      const newBalance = action.payload;
      state.balance.usdtBalance = newBalance;
      
      // Update USDT holding for display
      if (state.balance.holdings.USDT) {
        state.balance.holdings.USDT.amount = newBalance;
        state.balance.holdings.USDT.valueInUSD = newBalance;
      }
      
      // Recalculate total portfolio value
      state.balance.totalPortfolioValue = calculateTotalPortfolioValue(
        state.balance.holdings,
        state.balance.usdtBalance
      );
    },
    // New action to handle complete trade updates (crypto + USDT) in a single call
    updateTrade: (state, action: PayloadAction<{
      cryptoUpdate: HoldingUpdatePayload;
      usdtUpdate: HoldingUpdatePayload;
    }>) => {

      const { cryptoUpdate, usdtUpdate } = action.payload;
      const holdings = state.balance.holdings;

      // Process crypto update
      const normalizedCryptoSymbol = cryptoUpdate.symbol.toUpperCase();
      const currentCryptoHolding = holdings[normalizedCryptoSymbol];

      if (currentCryptoHolding) {
        const newAmount = currentCryptoHolding.amount + cryptoUpdate.amount;
        
        if (cryptoUpdate.amount > 0) {
          // Buying: add to position
          const totalCost = currentCryptoHolding.amount * currentCryptoHolding.averageBuyPrice + cryptoUpdate.valueInUSD;
          const newAverageBuyPrice = newAmount > 0 ? totalCost / newAmount : 0;
          const newValueInUSD = currentCryptoHolding.valueInUSD + cryptoUpdate.valueInUSD;

          holdings[normalizedCryptoSymbol] = {
            ...currentCryptoHolding,
            amount: newAmount,
            valueInUSD: newValueInUSD,
            averageBuyPrice: newAverageBuyPrice,
          };
        } else {
          // Selling: reduce position proportionally
          const sellRatio = Math.abs(cryptoUpdate.amount) / currentCryptoHolding.amount;
          const newValueInUSD = currentCryptoHolding.valueInUSD * (1 - sellRatio);

          holdings[normalizedCryptoSymbol] = {
            ...currentCryptoHolding,
            amount: newAmount,
            valueInUSD: newValueInUSD,
          };
        }

        calculateProfitLoss(holdings[normalizedCryptoSymbol]);

        if (newAmount <= 0) {
          delete holdings[normalizedCryptoSymbol];
        }
      } else {
        // Create new holding
        const pricePerToken = cryptoUpdate.amount !== 0 ? Math.abs(cryptoUpdate.valueInUSD / cryptoUpdate.amount) : 0;
        holdings[normalizedCryptoSymbol] = {
          amount: cryptoUpdate.amount,
          valueInUSD: cryptoUpdate.valueInUSD,
          symbol: normalizedCryptoSymbol,
          name: cryptoUpdate.name,
          image_url: cryptoUpdate.image_url,
          averageBuyPrice: pricePerToken,
          currentPrice: pricePerToken,
          profitLoss: 0,
          profitLossPercentage: 0,
        };
      }

      // Process USDT update
      const newUsdtBalance = state.balance.usdtBalance + usdtUpdate.amount;
      
      if (newUsdtBalance < 0) {
        throw new Error(ERROR_MESSAGES.INSUFFICIENT_BALANCE);
      }

      state.balance.usdtBalance = newUsdtBalance;
      
      holdings.USDT = {
        ...holdings.USDT,
        amount: newUsdtBalance,
        valueInUSD: newUsdtBalance,
      };

      // Recalculate total portfolio value
      state.balance.totalPortfolioValue = calculateTotalPortfolioValue(
        holdings,
        state.balance.usdtBalance
      );

      // Persist to database in a single operation

      try {
        const usdtBalance = state.balance.usdtBalance;
        const totalPortfolioValue = state.balance.totalPortfolioValue;
        const holdingsCopy = JSON.parse(JSON.stringify(holdings));

        let totalPnL = 0;
        Object.values(holdingsCopy).forEach((holding: any) => {
          if (holding.symbol !== "USDT") {
            totalPnL += holding.profitLoss || 0;
          }
        });

        UUIDService.getOrCreateUser()
          .then(async (uuid) => {
            await UserRepository.updateUserBalanceAndPortfolioValue(
              uuid, 
              usdtBalance, 
              totalPortfolioValue, 
              totalPnL
            );
            
            await UserRepository.updatePortfolio(uuid, holdingsCopy);
          })
          .catch((error) => {
            // Silent error handling for production
          });
      } catch (error) {
        // Silent error handling for production
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload;
      })
      .addCase(loadBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load balance";
      });
  },
});

export const {
  setBalance,
  resetBalance,
  updateHolding,
  addTradeHistory,
  updateCurrentPrice,
  updatePortfolio,
  syncUsdtBalance,
  updateTrade,
} = balanceSlice.actions;
export default balanceSlice.reducer;
