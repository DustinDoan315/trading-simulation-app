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

const initialState: BalanceState = {
  balance: {
    totalInUSD: 100000.0,
    holdings: {
      tether: {
        amount: 100000.0,
        valueInUSD: 100000.0,
        symbol: "USDT",
        image_url: "https://cryptologos.cc/logos/tether-usdt-logo.png",
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
      const order = action.payload;
      if (order.image_url) {
        order.image_url = order.image_url;
      }
      state.tradeHistory.push(order);
    },
    setBalance: (state, action: PayloadAction<UserBalance>) => {
      state.previousBalance = state.balance;
      state.balance = action.payload;

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
        image_url?: string;
      }>
    ) => {
      const { cryptoId, amount, valueInUSD, symbol, image_url } =
        action.payload;
      const currentHolding = state.balance.holdings[cryptoId];

      if (currentHolding) {
        currentHolding.amount += amount;
        currentHolding.valueInUSD += valueInUSD;
      } else {
        state.balance.holdings[cryptoId] = {
          amount,
          valueInUSD,
          symbol,
          image_url,
        };
      }

      state.balance.totalInUSD = Object.values(state.balance.holdings).reduce(
        (sum, holding: { valueInUSD: number }) => sum + holding.valueInUSD,
        0
      );
    },
  },
});

export const { setBalance, resetBalance, updateHolding, addTradeHistory } =
  balanceSlice.actions;
export default balanceSlice.reducer;
