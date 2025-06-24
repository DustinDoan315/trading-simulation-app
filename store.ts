import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "@react-native-async-storage/async-storage";
import cryptoPricesReducer from "@/features/cryptoPricesSlice";
import favoritesReducer from "@/features/favoritesSlice";
import balanceReducer from "@/features/balanceSlice";
import searchHistoryReducer from "@/features/searchHistorySlice";
import languageReducer from "@/features/languageSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["favorites", "searchHistory", "balance", "cryptoPrices", "language"],
};

const rootReducer = combineReducers({
  cryptoPrices: cryptoPricesReducer,
  favorites: favoritesReducer,
  balance: balanceReducer,
  searchHistory: searchHistoryReducer,
  language: languageReducer,
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
