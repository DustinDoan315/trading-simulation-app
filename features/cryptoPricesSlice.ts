import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CryptoPriceState {
  prices: {
    [symbol: string]: number;
  };
}

const initialState: CryptoPriceState = {
  prices: {
    BTC: 45000,
    ETH: 2500,
    BNB: 300,
    SOL: 166,
    ADA: 0.5,
    DOT: 7,
    LINK: 15,
    UNI: 7,
    MATIC: 0.8,
    LTC: 70,
  }
};

export const cryptoPricesSlice = createSlice({
  name: 'cryptoPrices',
  initialState,
  reducers: {
    updatePrice: (state, action: PayloadAction<{symbol: string, price: number}>) => {
      state.prices[action.payload.symbol] = action.payload.price;
    },
  },
});

export const { updatePrice } = cryptoPricesSlice.actions;
export default cryptoPricesSlice.reducer;
