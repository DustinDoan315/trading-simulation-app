import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import UserRepository from "../services/UserRepository";
import UUIDService from "../services/UUIDService";
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
  const marketValue = holding.amount * holding.currentPrice;
  const costBasis = holding.amount * holding.averageBuyPrice;
  holding.profitLoss = marketValue - costBasis;
  holding.profitLossPercentage =
    costBasis > 0 ? (holding.profitLoss / costBasis) * 100 : 0;
  return holding;
};

// Helper to recalculate total portfolio value
const recalculatePortfolioValue = (holdings: Record<string, Holding>) => {
  return Object.values(holdings).reduce(
    (sum, holding) => sum + holding.amount * holding.currentPrice,
    0
  );
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

// Async thunk to load balance from database
export const loadBalance = createAsyncThunk("balance/load", async () => {
  const uuid = await UUIDService.getOrCreateUser();
  const user = await UserRepository.getUser(uuid);
  const balance = user ? parseFloat(user.balance) : 100000;
  const portfolio = await UserRepository.getPortfolio(uuid);

  // Initialize holdings with USDT
  const holdings: Record<string, Holding> = {
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
  };

  console.log("====================================");
  console.log("Portfolio loaded:", portfolio);
  console.log("====================================");
  // Add portfolio holdings
  portfolio.forEach((item) => {
    holdings[item.symbol] = {
      amount: parseFloat(item.quantity),
      valueInUSD: parseFloat(item.quantity) * parseFloat(item.avgCost),
      symbol: item.symbol,
      name: item.symbol,
      image: `https://cryptologos.cc/logos/${item.symbol.toLowerCase()}-logo.png`,
      averageBuyPrice: parseFloat(item.avgCost),
      currentPrice: parseFloat(item.avgCost), // Will be updated with real price later
      profitLoss: 0,
      profitLossPercentage: 0,
    };
  });

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

      // Persist balance to database
      UUIDService.getOrCreateUser().then((uuid) => {
        UserRepository.updateUserBalance(uuid, state.balance.totalInUSD);
      });
    },
    resetBalance: (state) => {
      return { ...initialState };
    },
    updateHolding: (state, action: PayloadAction<HoldingUpdatePayload>) => {
      const { cryptoId, amount, valueInUSD, symbol, name, image } =
        action.payload;
      const holdings = state.balance.holdings;
      const currentHolding = holdings[cryptoId];
      const pricePerToken = valueInUSD / amount;

      // Special handling for USDT
      if (cryptoId === "USDT") {
        if (!currentHolding) {
          // Initialize USDT if not exists
          holdings[cryptoId] = {
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
        } else {
          // For USDT, we only subtract (spend) never add new holdings
          const newAmount = currentHolding.amount + amount;

          // Prevent negative balance
          if (newAmount < 0) {
            throw new Error("Insufficient USDT balance");
          }

          holdings[cryptoId] = {
            ...currentHolding,
            amount: newAmount,
            valueInUSD: newAmount,
          };
        }
      } else {
        // Non-USDT cryptocurrencies
        if (currentHolding) {
          const totalCost =
            currentHolding.amount * currentHolding.averageBuyPrice + valueInUSD;
          const totalAmount = currentHolding.amount + amount;

          holdings[cryptoId] = {
            ...currentHolding,
            amount: totalAmount,
            valueInUSD: currentHolding.valueInUSD + valueInUSD,
            averageBuyPrice: totalCost / totalAmount,
          };

          // Recalculate profit/loss with updated values
          calculateProfitLoss(holdings[cryptoId]);
        } else {
          holdings[cryptoId] = {
            amount,
            valueInUSD,
            symbol,
            name,
            image,
            averageBuyPrice: pricePerToken,
            currentPrice: pricePerToken,
            profitLoss: 0,
            profitLossPercentage: 0,
          };
        }
      }

      state.balance.totalInUSD = recalculatePortfolioValue(holdings);

      // Persist balance and holdings to database
        UUIDService.getOrCreateUser().then((uuid) => {
        UserRepository.updateUserBalance(uuid, state.balance.totalInUSD);
        UserRepository.updatePortfolio(uuid, holdings);
      });
    },
    updatePortfolio: (state, action: PayloadAction<UserBalance>) => {
      state.balance = action.payload;
      state.balance.totalInUSD = recalculatePortfolioValue(
        action.payload.holdings
      );

      // Persist to database
      UUIDService.getOrCreateUser().then((uuid) => {
        UserRepository.updateUserBalance(uuid, state.balance.totalInUSD);
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

        // Persist balance to database
        UUIDService.getOrCreateUser().then((uuid) => {
          UserRepository.updateUserBalance(uuid, state.balance.totalInUSD);
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
