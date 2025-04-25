import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserBalance } from "../../services/CryptoService";

interface BalanceState {
  balance: UserBalance;
  previousBalance: UserBalance | null;
  changePercentage: number;
  changeValue: number;
}

const initialState: BalanceState = {
  balance: {
    totalInUSD: 100000.0,
    holdings: {
      bitcoin: {
        amount: 0.0,
        valueInUSD: 0.0,
        symbol: "BTC",
      },
      ethereum: {
        amount: 0.0,
        valueInUSD: 0.0,
        symbol: "ETH",
      },
      tether: {
        amount: 100000.0,
        valueInUSD: 100000.0,
        symbol: "USDT",
      },
    },
  },
  previousBalance: null,
  changePercentage: 0,
  changeValue: 0,
};

export const balanceSlice = createSlice({
  name: "balance",
  initialState,
  reducers: {
    setBalance: (state, action: PayloadAction<UserBalance>) => {
      // Store current balance as previous before updating
      state.previousBalance = state.balance;
      state.balance = action.payload;

      // Calculate changes if we have previous data
      if (state.previousBalance) {
        state.changeValue =
          state.balance.totalInUSD - state.previousBalance.totalInUSD;
        state.changePercentage =
          (state.changeValue / state.previousBalance.totalInUSD) * 100;
      }
    },
    resetBalance: (state) => {
      state.balance = initialState.balance;
    },
    updateHolding: (
      state,
      action: PayloadAction<{
        cryptoId: string;
        amount: number;
        valueInUSD: number;
        symbol: string;
      }>
    ) => {
      const { cryptoId, amount, valueInUSD, symbol } = action.payload;
      state.balance.holdings[cryptoId] = { amount, valueInUSD, symbol };
      // Recalculate total
      state.balance.totalInUSD = Object.values(state.balance.holdings).reduce(
        (sum, holding: { valueInUSD: number }) => sum + holding.valueInUSD,
        0
      );
    },
  },
});

export const { setBalance, resetBalance, updateHolding } = balanceSlice.actions;
export default balanceSlice.reducer;
