import { create } from "zustand";

interface CryptoPricesState {
  prices: Record<string, number>;
  updatePrice: (symbol: string, price: number) => void;
  updatePrices: (newPrices: Record<string, number>) => void;
}

export const useCryptoPricesStore = create<CryptoPricesState>((set) => ({
  prices: {},
  updatePrice: (symbol, price) =>
    set((state) => ({
      prices: { ...state.prices, [symbol]: price },
    })),
  updatePrices: (newPrices) =>
    set((state) => ({
      prices: { ...state.prices, ...newPrices },
    })),
}));
