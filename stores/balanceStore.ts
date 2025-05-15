import { create } from "zustand";
import { UserBalance } from "@/services/CryptoService";
import { StorageService } from "../services/StorageService";

interface BalanceState {
  balance: UserBalance;
  changePercentage: number;
  changeValue: number;
  setBalance: (
    newBalance: UserBalance,
    changePercentage?: number,
    changeValue?: number
  ) => void;
  resetBalance: () => void;
  _saveToStorage: () => void;
}

const defaultBalance: UserBalance = {
  totalInUSD: 100000.0,
  changePercentage: 0,
  changeValue: 0,
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
};

export const useBalanceStore = create<BalanceState>((set, get) => {
  const storedBalance = StorageService.getItem("userBalance");
  const initialBalance = storedBalance
    ? JSON.parse(storedBalance)
    : defaultBalance;

  return {
    balance: initialBalance,
    changePercentage: initialBalance.changePercentage || 0,
    changeValue: initialBalance.changeValue || 0,
    setBalance: (newBalance, changePercentage = 0, changeValue = 0) => {
      const updatedBalance = {
        ...newBalance,
        changePercentage,
        changeValue,
      };
      StorageService.setItem("userBalance", JSON.stringify(updatedBalance));
      set({
        balance: updatedBalance,
        changePercentage,
        changeValue,
      });
    },
    resetBalance: () => {
      StorageService.setItem("userBalance", JSON.stringify(defaultBalance));
      set({
        balance: defaultBalance,
        changePercentage: 0,
        changeValue: 0,
      });
    },
    _saveToStorage: () => {
      const currentBalance = get().balance;
      StorageService.setItem(
        "userBalance",
        JSON.stringify({
          ...currentBalance,
          changePercentage: get().changePercentage,
          changeValue: get().changeValue,
        })
      );
    },
  };
});
