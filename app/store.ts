import { configureStore } from '@reduxjs/toolkit';
import cryptoPricesReducer from './features/cryptoPricesSlice';

export const store = configureStore({
  reducer: {
    cryptoPrices: cryptoPricesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
