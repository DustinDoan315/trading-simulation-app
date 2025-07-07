import UserRepository from '../services/UserRepository';
import UUIDService from '../services/UUIDService';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Holding, HoldingUpdatePayload, Order } from '../types/crypto';


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
    usdtBalance: 100000,
    totalPortfolioValue: 100000,
    holdings: {
      USDT: {
        amount: 100000,
        valueInUSD: 100000,
        symbol: "USDT",
        name: "Tether",
        image:
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

// Async thunk to load balance from database
export const loadBalance = createAsyncThunk("balance/load", async () => {
  const uuid = await UUIDService.getOrCreateUser();
  const user = await UserRepository.getUser(uuid);
  const usdtBalance = user ? parseFloat(user.usdt_balance) : 100000;
  const portfolio = await UserRepository.getPortfolio(uuid);

  console.log("====================================");
  console.log("Loading balance - Portfolio:", portfolio);
  console.log("Loading balance - User USDT balance:", usdtBalance);
  console.log("====================================");

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
      
      holdings[item.symbol.toUpperCase()] = {
        amount: quantity,
        valueInUSD: valueInUSD,
        symbol: item.symbol.toUpperCase(),
        name: item.symbol,
        image:
          item.image ||
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
    image:
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

      const { cryptoId, amount, valueInUSD, symbol, name, image } =
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
            image,
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

        UUIDService.getOrCreateUser()
          .then((uuid) => {
            console.log("✅ Got UUID for persistence:", uuid);
            
            // Update both USDT balance and total portfolio value in users table
            return UserRepository.updateUserBalanceAndPortfolioValue(
              uuid, 
              usdtBalance, 
              totalPortfolioValue, 
              totalPnL
            );
          })
          .then(() => {
            console.log("✅ User balance and portfolio value updated successfully");
            return UUIDService.getOrCreateUser();
          })
          .then((uuid) => {
            console.log("✅ Updating portfolio holdings...");
            return UserRepository.updatePortfolio(uuid, holdingsCopy);
          })
          .then(() => {
            console.log("✅ Portfolio holdings updated successfully");
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
} = balanceSlice.actions;
export default balanceSlice.reducer;
