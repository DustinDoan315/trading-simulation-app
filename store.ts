import balanceReducer from '@/features/balanceSlice';
import cryptoPricesReducer from '@/features/cryptoPricesSlice';
import dualBalanceReducer from '@/features/dualBalanceSlice';
import favoritesReducer from '@/features/favoritesSlice';
import languageReducer from '@/features/languageSlice';
import searchHistoryReducer from '@/features/searchHistorySlice';
import storage from '@react-native-async-storage/async-storage';
import userReducer from '@/features/userSlice';
import { combineReducers } from 'redux';
import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import { useDispatch, useSelector } from 'react-redux';

import type { TypedUseSelectorHook } from "react-redux";

const persistConfig = {
  key: "root",
  storage,
  whitelist: [
    "favorites",
    "searchHistory",
    "balance",
    "dualBalance",
    "cryptoPrices",
    "language",
    "user",
  ],
};

const rootReducer = combineReducers({
  cryptoPrices: cryptoPricesReducer,
  favorites: favoritesReducer,
  balance: balanceReducer,
  dualBalance: dualBalanceReducer,
  searchHistory: searchHistoryReducer,
  language: languageReducer,
  user: userReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState> & {
  _persist: { version: number; rehydrated: boolean };
};
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
