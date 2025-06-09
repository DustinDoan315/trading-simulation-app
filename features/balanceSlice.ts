import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserBalance } from "@/services/CryptoService";
import { Order } from "@/app/types/crypto";

interface BalanceState {
  balance: UserBalance;
  previousBalance: UserBalance | null;
  changePercentage: number;
  changeValue: number;
  tradeHistory: Order[];
}

// Define Holding type based on the structure in CryptoService
type Holding = {
  amount: number;
  valueInUSD: number;
  symbol: string;
  name: string;
  image_url?: string;
  averageBuyPrice: number;
  currentPrice: number;
  profitLoss: number;
  profitLossPercentage: number;
};

// More specific interface for holding updates
interface HoldingUpdatePayload {
  cryptoId: string;
  amount: number;
  valueInUSD: number;
  symbol: string;
  name: string;
  image_url?: string;
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
};

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
    },
    resetBalance: (state) => {
      return { ...initialState };
    },
    updateHolding: (state, action: PayloadAction<HoldingUpdatePayload>) => {
      const { cryptoId, amount, valueInUSD, symbol, name, image_url } =
        action.payload;
      const holdings = state.balance.holdings;
      const currentHolding = holdings[cryptoId];
      const pricePerToken = valueInUSD / amount;

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
          image_url,
          averageBuyPrice: pricePerToken,
          currentPrice: pricePerToken,
          profitLoss: 0,
          profitLossPercentage: 0,
        };
      }

      state.balance.totalInUSD = recalculatePortfolioValue(holdings);
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
      }
    },
  },
});

export const {
  setBalance,
  resetBalance,
  updateHolding,
  addTradeHistory,
  updateCurrentPrice,
} = balanceSlice.actions;
export default balanceSlice.reducer;
