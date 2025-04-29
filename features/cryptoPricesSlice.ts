import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CryptoPriceState {
  prices: {
    [symbol: string]: number;
  };
}

const initialState: CryptoPriceState = {
  prices: {
    BTC: 83000,
    ETH: 4000,
    BNB: 600,
    SOL: 180,
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
