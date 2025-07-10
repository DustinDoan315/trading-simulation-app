import AsyncStorage from '@react-native-async-storage/async-storage';
import UserRepository from '../services/UserRepository';
import UUIDService from '../services/UUIDService';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getCryptoIdFromSymbol } from '../utils/cryptoMapping';
import { Holding, HoldingUpdatePayload, Order } from '../types/crypto';
import { UserService } from '../services/UserService';


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

// Helper function to update leaderboard rankings
const updateLeaderboardRankings = async (uuid: string) => {
  try {
    await UserService.updateLeaderboardRankings(uuid);
    console.log("✅ Leaderboard rankings updated successfully");
  } catch (error) {
    console.error("❌ Error updating leaderboard rankings:", error);
    // Don't throw error to avoid breaking the main flow
  }
};

const initialState: BalanceState = {
  balance: {
    usdtBalance: 100000,
    totalPortfolioValue: 100000,
    holdings: {
      USDT: {
        amount: 100000,
        valueInUSD: 100000,
        symbol: "USDT",
        name: "Tether",
        image_url:
          "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
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
  console.log("====================================");
  console.log("Loading balance - UUID:", uuid);
  
  let user = await UserRepository.getUser(uuid);
  console.log("Loading balance - Retrieved user from UserRepository:", user);
  
  // If user not found in UserRepository, try to get from UUIDService cache
  if (!user) {
    console.log("Loading balance - User not found in UserRepository, trying UUIDService cache...");
    try {
      const userProfileStr = await AsyncStorage.getItem("user_profile");
      if (userProfileStr) {
        const userProfile = JSON.parse(userProfileStr);
        if (userProfile.id === uuid) {
          user = userProfile;
          console.log("Loading balance - Found user in UUIDService cache:", user);
        }
      }
    } catch (error) {
      console.error("Loading balance - Error getting user from UUIDService cache:", error);
    }
  }

  // If still no user found, recreate user data
  if (!user) {
    console.log("Loading balance - No user found anywhere, recreating user data...");
    try {
      const { AsyncStorageService } = await import('../services/AsyncStorageService');
      user = await AsyncStorageService.recreateUserData(uuid, 100000);
      console.log("Loading balance - User data recreated:", user);
    } catch (error) {
      console.error("Loading balance - Error recreating user data:", error);
    }
  }
  
  let usdtBalance = user ? parseFloat(user.usdt_balance) : 100000;
  console.log("Loading balance - Initial USDT balance from user data:", usdtBalance);
  
  const portfolio = (await UserRepository.getPortfolio(uuid)) as PortfolioItem[];

  console.log("Loading balance - Portfolio:", portfolio);
  console.log("Loading balance - User USDT balance:", usdtBalance);
  console.log("====================================");

  // Calculate the correct USDT balance based on portfolio data
  // If there are crypto holdings, the USDT balance should be reduced
  let calculatedUsdtBalance = 100000; // Start with initial balance
  let totalCryptoValue = 0;

  portfolio.forEach((item) => {
    if (item.symbol.toUpperCase() !== "USDT") {
      const quantity = parseFloat(item.quantity);
      const currentPrice = parseFloat(item.current_price || item.avg_cost);
      const valueInUSD = quantity * currentPrice;
      totalCryptoValue += valueInUSD;
      console.log(`Portfolio item ${item.symbol}: ${quantity} * ${currentPrice} = ${valueInUSD}`);
    }
  });

  calculatedUsdtBalance = 100000 - totalCryptoValue;
  console.log("Loading balance - Total crypto value:", totalCryptoValue);
  console.log("Loading balance - Calculated USDT balance:", calculatedUsdtBalance);

  // Use the calculated balance if it's different from the stored balance
  if (Math.abs(calculatedUsdtBalance - usdtBalance) > 1) {
    console.log("Loading balance - USDT balance mismatch detected!");
    console.log("Loading balance - Stored balance:", usdtBalance);
    console.log("Loading balance - Calculated balance:", calculatedUsdtBalance);
    console.log("Loading balance - Using calculated balance");
    usdtBalance = calculatedUsdtBalance;
    
    // Update the user's USDT balance in AsyncStorage
    try {
      await UserRepository.updateUserBalance(uuid, usdtBalance);
      console.log("Loading balance - Updated user USDT balance in AsyncStorage");
    } catch (error) {
      console.error("Loading balance - Failed to update USDT balance:", error);
    }
  }

  // Initialize holdings object
  const holdings: Record<string, Holding> = {};

  // Add portfolio holdings (excluding USDT)
  portfolio.forEach((item) => {
    if (item.symbol.toUpperCase() !== "USDT") {
      console.log("Processing portfolio item:", item);
      const quantity = parseFloat(item.quantity);
      const currentPrice = parseFloat(item.current_price || item.avg_cost);
      const avgCost = parseFloat(item.avg_cost);
      const valueInUSD = quantity * currentPrice;
      const profitLoss = valueInUSD - (quantity * avgCost);
      const profitLossPercentage = avgCost > 0 ? (profitLoss / (quantity * avgCost)) * 100 : 0;
      
      const symbol = item.symbol.toUpperCase();
      const cryptoId = getCryptoIdFromSymbol(symbol);
      
      holdings[symbol] = {
        amount: quantity,
        valueInUSD: valueInUSD,
        symbol: symbol,
        name: item.symbol,
        cryptoId: cryptoId || undefined,
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
    symbol: "USDT",
    name: "Tether",
    image_url:
      "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
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
        
        // Check if user should be added to leaderboard (first trade)
        UserService.checkAndAddUserToLeaderboard(uuid);
      });
    },
    resetBalance: (state) => {
      return { ...initialState };
    },
    updateHolding: (state, action: PayloadAction<HoldingUpdatePayload>) => {
      console.log("====================================");
      console.log("updateHolding reducer called");
      console.log("Payload:", JSON.stringify(action.payload, null, 2));
      console.log("Current USDT balance:", state.balance.usdtBalance);
      console.log("====================================");

      const { cryptoId, amount, valueInUSD, symbol, name, image_url } =
        action.payload;

      // Normalize cryptoId to uppercase to prevent duplicates
      const normalizedSymbol = symbol.toUpperCase();
      const holdings = state.balance.holdings;
      const currentHolding = holdings[normalizedSymbol];

      console.log(
        "Current holding for",
        normalizedSymbol,
        ":",
        currentHolding
      );

      // Handle USDT balance updates separately from other holdings
      if (normalizedSymbol === "USDT") {
        console.log("Processing USDT balance update");
        console.log("USDT update details:", {
          currentUsdtBalance: state.balance.usdtBalance,
          updateAmount: amount,
          operation: amount > 0 ? "adding USDT (sell)" : "subtracting USDT (buy)",
        });

        // Update USDT balance directly
        const newUsdtBalance = state.balance.usdtBalance + amount;
        
        // Prevent negative balance
        if (newUsdtBalance < 0) {
          console.error(
            "Insufficient USDT balance - would result in:",
            newUsdtBalance
          );
          throw new Error("Insufficient USDT balance");
        }

        state.balance.usdtBalance = newUsdtBalance;
        
        // Update USDT holding for display purposes
        holdings.USDT = {
          ...holdings.USDT,
          amount: newUsdtBalance,
          valueInUSD: newUsdtBalance,
        };

        console.log("Updated USDT balance to:", newUsdtBalance);
      } else {
        console.log("Processing cryptocurrency holding update");
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

          console.log(
            "Updated existing holding for",
            normalizedSymbol,
            "- new amount:",
            newAmount,
            "- operation:",
            amount > 0 ? "buy" : "sell"
          );

          // Remove holding if amount becomes zero or negative
          if (newAmount <= 0) {
            console.log(
              `Removing ${normalizedSymbol} holding - amount is zero or negative`
            );
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
          console.log(
            "Created new holding for",
            normalizedSymbol,
            "- amount:",
            amount
          );
        }
      }

      // Recalculate total portfolio value
      state.balance.totalPortfolioValue = calculateTotalPortfolioValue(
        holdings,
        state.balance.usdtBalance
      );

      console.log("Updated USDT balance:", state.balance.usdtBalance);
      console.log("Updated total portfolio value:", state.balance.totalPortfolioValue);
      console.log("Portfolio breakdown:");
      Object.keys(holdings).forEach((symbol) => {
        const holding = holdings[symbol];
        console.log({
          symbol,
          amount: holding.amount,
          valueInUSD: holding.valueInUSD,
          currentPrice: holding.currentPrice,
        });
      });

      // Persist to database
      console.log("Persisting balance and portfolio to database...");

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
            console.log("✅ Got UUID for persistence:", uuid);
            
            // Update both USDT balance and total portfolio value in users table
            await UserRepository.updateUserBalanceAndPortfolioValue(
              uuid, 
              usdtBalance, 
              totalPortfolioValue, 
              totalPnL
            );
            
            // Update portfolio holdings in the same operation
            await UserRepository.updatePortfolio(uuid, holdingsCopy);
            
            // Check if user should be added to leaderboard (first trade)
            await UserService.checkAndAddUserToLeaderboard(uuid);
            
            console.log("✅ All database updates completed successfully");
          })
          .catch((error) => {
            console.error(
              "❌ Error in updateHolding persistence:",
              error
            );
          });
      } catch (error) {
        console.error("❌ Error in updateHolding (before async):", error);
      }

      console.log("updateHolding reducer completed");
      console.log("====================================");
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
        
        // Check if user should be added to leaderboard (first trade)
        UserService.checkAndAddUserToLeaderboard(uuid);
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
        UUIDService.getOrCreateUser().then(async (uuid) => {
          await UserRepository.updatePortfolio(uuid, state.balance.holdings);
          
          // Check if user should be added to leaderboard (first trade)
          await UserService.checkAndAddUserToLeaderboard(uuid);
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
      console.log("====================================");
      console.log("updateTrade reducer called");
      console.log("Payload:", JSON.stringify(action.payload, null, 2));
      console.log("Current USDT balance:", state.balance.usdtBalance);
      console.log("====================================");

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
        console.error("Insufficient USDT balance - would result in:", newUsdtBalance);
        throw new Error("Insufficient USDT balance");
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

      console.log("Updated USDT balance:", state.balance.usdtBalance);
      console.log("Updated total portfolio value:", state.balance.totalPortfolioValue);

      // Persist to database in a single operation
      console.log("Persisting trade to database...");

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
            console.log("✅ Got UUID for trade persistence:", uuid);
            
            await UserRepository.updateUserBalanceAndPortfolioValue(
              uuid, 
              usdtBalance, 
              totalPortfolioValue, 
              totalPnL
            );
            
            await UserRepository.updatePortfolio(uuid, holdingsCopy);
            
            // Check if user should be added to leaderboard (first trade)
            await UserService.checkAndAddUserToLeaderboard(uuid);
            
            console.log("✅ Trade database updates completed successfully");
          })
          .catch((error) => {
            console.error("❌ Error in updateTrade persistence:", error);
          });
      } catch (error) {
        console.error("❌ Error in updateTrade (before async):", error);
      }

      console.log("updateTrade reducer completed");
      console.log("====================================");
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
