import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserBalance } from "../../services/CryptoService";

interface BalanceState {
  balance: UserBalance;
}

const initialState: BalanceState = {
  balance: {
    totalInUSD: 100000.00,
    holdings: {
      bitcoin: {
        amount: 0.0,
        valueInUSD: 0.0,
      },
      ethereum: {
        amount: 0.0,
        valueInUSD: 0.0,
      },
      tether: {
        amount: 100000.00,
        valueInUSD: 100000.00,
      },
    },
  },
};

export const balanceSlice = createSlice({
  name: "balance",
  initialState,
  reducers: {
    setBalance: (state, action: PayloadAction<UserBalance>) => {
      state.balance = action.payload;
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
      }>
    ) => {
      const { cryptoId, amount, valueInUSD } = action.payload;
      state.balance.holdings[cryptoId] = { amount, valueInUSD };
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
