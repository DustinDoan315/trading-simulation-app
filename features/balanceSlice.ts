import UserRepository from "../services/UserRepository";
import UUIDService from "../services/UUIDService";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Holding, HoldingUpdatePayload, Order } from "../types/crypto";

export interface UserBalance {
  totalInUSD: number;
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

// Helper to recalculate total portfolio value
const recalculatePortfolioValue = (holdings: Record<string, Holding>) => {
  if (!holdings || typeof holdings !== "object") {
    console.warn(
      "Invalid holdings object for portfolio value calculation:",
      holdings
    );
    return 0;
  }

  return Object.values(holdings).reduce((sum, holding) => {
    if (
      !holding ||
      typeof holding.amount !== "number" ||
      typeof holding.valueInUSD !== "number"
    ) {
      console.warn("Invalid holding data in portfolio calculation:", holding);
      return sum;
    }

    // For USDT, use the amount directly since 1 USDT = 1 USD
    if (holding.symbol === "USDT") {
      return sum + holding.amount;
    }
    // For other tokens, use the valueInUSD which represents the actual USD value
    return sum + holding.valueInUSD;
  }, 0);
};

const initialState: BalanceState = {
  balance: {
    totalInUSD: 100000,
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

// Async thunk to load balance from AsyncStorage
export const loadBalance = createAsyncThunk("balance/load", async () => {
  const uuid = await UUIDService.getOrCreateUser();
  const user = await UserRepository.getUser(uuid);
  const balance = user ? parseFloat(user.balance) : 100000;
  const portfolio = await UserRepository.getPortfolio(uuid);

  console.log("====================================");
  console.log("Portfolio loaded:", portfolio);
  console.log("User balance:", balance);
  console.log("====================================");

  // Initialize holdings object
  const holdings: Record<string, Holding> = {};

  // Add portfolio holdings first
  console.log("Loading portfolio items:", portfolio);
  portfolio.forEach((item) => {
    console.log("Processing portfolio item:", item);
    holdings[item.symbol] = {
      amount: parseFloat(item.quantity),
      valueInUSD: parseFloat(item.quantity) * parseFloat(item.avg_cost),
      symbol: item.symbol,
      name: item.symbol,
      image:
        item.image ||
        `https://cryptologos.cc/logos/${item.symbol.toLowerCase()}-logo.png`,
      averageBuyPrice: parseFloat(item.avg_cost),
      currentPrice: parseFloat(item.avg_cost), // Will be updated with real price later
      profitLoss: 0,
      profitLossPercentage: 0,
    };
    console.log(`Loaded ${item.symbol}:`, holdings[item.symbol]);
  });

  // If no USDT in portfolio, initialize with the balance amount
  if (!holdings.USDT) {
    console.log(
      "No USDT found in portfolio, initializing with balance:",
      balance
    );
    holdings.USDT = {
      amount: balance,
      valueInUSD: balance,
      symbol: "USDT",
      name: "Tether",
      image:
        "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
      averageBuyPrice: 1,
      currentPrice: 1,
      profitLoss: 0,
      profitLossPercentage: 0,
    };
  } else {
    console.log("USDT found in portfolio:", holdings.USDT);
  }

  return {
    totalInUSD: balance,
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
          state.balance.totalInUSD - state.previousBalance.totalInUSD;
        state.changePercentage =
          state.previousBalance.totalInUSD !== 0
            ? (state.changeValue / state.previousBalance.totalInUSD) * 100
            : 0;
      }

      // Persist balance to database - use USDT balance only
      const usdtBalance = state.balance.holdings.USDT
        ? state.balance.holdings.USDT.amount
        : 0;
      UUIDService.getOrCreateUser().then((uuid) => {
        UserRepository.updateUserBalance(uuid, usdtBalance);
      });
    },
    resetBalance: (state) => {
      return { ...initialState };
    },
    updateHolding: (state, action: PayloadAction<HoldingUpdatePayload>) => {
      console.log("====================================");
      console.log("updateHolding reducer called");
      console.log("Payload:", JSON.stringify(action.payload, null, 2));
      console.log("====================================");

      const { cryptoId, amount, valueInUSD, symbol, name, image } =
        action.payload;

      // Normalize cryptoId to uppercase to prevent duplicates
      const normalizedCryptoId = cryptoId.toUpperCase();
      const holdings = state.balance.holdings;
      const currentHolding = holdings[normalizedCryptoId];
      const pricePerToken = valueInUSD / amount;

      console.log(
        "Current holding for",
        normalizedCryptoId,
        ":",
        currentHolding
      );

      // Special handling for USDT
      if (normalizedCryptoId === "USDT") {
        console.log("Processing USDT update");
        console.log("USDT update details:", {
          currentAmount: currentHolding?.amount,
          updateAmount: amount,
          updateValueInUSD: valueInUSD,
          symbol: symbol,
        });

        if (!currentHolding) {
          // Initialize USDT if not exists
          holdings[normalizedCryptoId] = {
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
          };
          console.log("Initialized new USDT holding with 100,000");
        } else {
          // For USDT, we can both add (when selling tokens) and subtract (when buying tokens)
          const newAmount = currentHolding.amount + amount;
          console.log("USDT balance calculation:", {
            currentAmount: currentHolding.amount,
            updateAmount: amount,
            newAmount: newAmount,
            operation:
              amount > 0 ? "adding USDT (sell)" : "subtracting USDT (buy)",
          });

          // Prevent negative balance
          if (newAmount < 0) {
            console.error(
              "Insufficient USDT balance - would result in:",
              newAmount
            );
            throw new Error("Insufficient USDT balance");
          }

          holdings[normalizedCryptoId] = {
            ...currentHolding,
            amount: newAmount,
            valueInUSD: newAmount, // USDT value is always equal to amount
          };
          console.log("Updated USDT holding - new amount:", newAmount);
        }
      } else {
        console.log("Processing non-USDT cryptocurrency update");
        // Non-USDT cryptocurrencies
        if (currentHolding) {
          const totalAmount = currentHolding.amount + amount;

          // For sell operations, we need to handle valueInUSD differently
          let newValueInUSD;
          if (amount < 0) {
            // Selling: reduce valueInUSD proportionally
            const sellRatio = Math.abs(amount) / currentHolding.amount;
            newValueInUSD = currentHolding.valueInUSD * (1 - sellRatio);
          } else {
            // Buying: add the new value
            newValueInUSD = currentHolding.valueInUSD + valueInUSD;
          }

          // Calculate new average buy price
          const totalCost =
            currentHolding.amount * currentHolding.averageBuyPrice + valueInUSD;
          const newAverageBuyPrice =
            totalAmount > 0 ? totalCost / totalAmount : 0;

          holdings[normalizedCryptoId] = {
            ...currentHolding,
            amount: totalAmount,
            valueInUSD: newValueInUSD,
            averageBuyPrice: newAverageBuyPrice,
          };

          // Recalculate profit/loss with updated values
          calculateProfitLoss(holdings[normalizedCryptoId]);
          console.log(
            "Updated existing holding for",
            normalizedCryptoId,
            "- new amount:",
            totalAmount,
            "- new valueInUSD:",
            newValueInUSD,
            "- operation:",
            amount > 0 ? "buy" : "sell"
          );

          // Remove holding if amount becomes zero or negative
          if (totalAmount <= 0) {
            console.log(
              `Removing ${normalizedCryptoId} holding - amount is zero or negative`
            );
            delete holdings[normalizedCryptoId];
          }
        } else {
          holdings[normalizedCryptoId] = {
            amount,
            valueInUSD,
            symbol: symbol.toUpperCase(),
            name,
            image,
            averageBuyPrice: pricePerToken,
            currentPrice: pricePerToken,
            profitLoss: 0,
            profitLossPercentage: 0,
          };
          console.log(
            "Created new holding for",
            normalizedCryptoId,
            "- amount:",
            amount
          );
        }
      }

      state.balance.totalInUSD = recalculatePortfolioValue(holdings);
      console.log("Updated total portfolio value:", state.balance.totalInUSD);
      console.log(
        "Portfolio breakdown:",
        Object.entries(holdings).map(([symbol, holding]) => ({
          symbol,
          amount: holding.amount,
          valueInUSD: holding.valueInUSD,
          currentPrice: holding.currentPrice,
        }))
      );

      // Persist balance and holdings to database
      console.log("About to persist to database...");

      try {
        // Extract values from state before async operations to avoid Proxy issues
        const totalInUSD = state.balance.totalInUSD;
        const holdingsCopy = JSON.parse(JSON.stringify(holdings));
        const usdtBalance = holdingsCopy.USDT ? holdingsCopy.USDT.amount : 0;

        console.log(
          "Holdings copy created successfully:",
          JSON.stringify(holdingsCopy, null, 2)
        );
        console.log("Total in USD extracted:", totalInUSD);
        console.log("USDT balance extracted:", usdtBalance);

        UUIDService.getOrCreateUser()
          .then((uuid) => {
            console.log("✅ Got UUID for persistence:", uuid);

            // Update user balance with USDT balance only (not total portfolio value)
            const usdtBalance = holdingsCopy.USDT
              ? holdingsCopy.USDT.amount
              : 0;
            console.log(
              "Updating user balance with USDT balance only:",
              usdtBalance
            );
            return UserRepository.updateUserBalance(uuid, usdtBalance);
          })
          .then(() => {
            console.log("✅ User balance updated successfully");

            // Get UUID again for portfolio update
            return UUIDService.getOrCreateUser();
          })
          .then((uuid) => {
            console.log("✅ Got UUID for portfolio update:", uuid);
            console.log("Calling UserRepository.updatePortfolio...");

            return UserRepository.updatePortfolio(uuid, holdingsCopy);
          })
          .then(() => {
            console.log("✅ Portfolio updated successfully");
          })
          .catch((error) => {
            console.error(
              "❌ Error in updateHolding persistence chain:",
              error
            );
            console.error(
              "❌ Error stack:",
              error instanceof Error ? error.stack : "No stack trace"
            );
          });
      } catch (error) {
        console.error("❌ Error in updateHolding (before async):", error);
        console.error(
          "❌ Error stack:",
          error instanceof Error ? error.stack : "No stack trace"
        );
      }

      console.log("updateHolding reducer completed");
      console.log("====================================");
    },
    updatePortfolio: (state, action: PayloadAction<UserBalance>) => {
      state.balance = action.payload;
      state.balance.totalInUSD = recalculatePortfolioValue(
        action.payload.holdings
      );

      // Persist to database - use USDT balance only for user balance
      const usdtBalance = action.payload.holdings.USDT
        ? action.payload.holdings.USDT.amount
        : 0;
      UUIDService.getOrCreateUser().then((uuid) => {
        UserRepository.updateUserBalance(uuid, usdtBalance);
        UserRepository.updatePortfolio(uuid, action.payload.holdings);
      });
    },
    updateCurrentPrice: (
      state,
      action: PayloadAction<{ cryptoId: string; currentPrice: number }>
    ) => {
      const { cryptoId, currentPrice } = action.payload;
      const holding = state.balance.holdings[cryptoId];

      if (holding) {
        holding.currentPrice = currentPrice;
        calculateProfitLoss(holding);
        state.balance.totalInUSD = recalculatePortfolioValue(
          state.balance.holdings
        );

        // Persist balance to database - use USDT balance only
        const usdtBalance = state.balance.holdings.USDT
          ? state.balance.holdings.USDT.amount
          : 0;
        UUIDService.getOrCreateUser().then((uuid) => {
          UserRepository.updateUserBalance(uuid, usdtBalance);
        });
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
} = balanceSlice.actions;
export default balanceSlice.reducer;
