import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SearchHistoryItem {
  id: string;
  text: string;
  timestamp: number;
}

interface SearchHistoryState {
  items: SearchHistoryItem[];
}

const initialState: SearchHistoryState = {
  items: [],
};

export const searchHistorySlice = createSlice({
  name: "searchHistory",
  initialState,
  reducers: {
    addSearchHistory: (state, action: PayloadAction<SearchHistoryItem>) => {
      // Remove duplicates
      state.items = state.items.filter(
        (item) => item.text !== action.payload.text
      );
      state.items.unshift(action.payload);
      // Keep only last 10 items
      state.items = state.items.slice(0, 10);
    },
    clearSearchHistory: (state) => {
      state.items = [];
    },
    removeSearchHistoryItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addSearchHistory, clearSearchHistory, removeSearchHistoryItem } =
  searchHistorySlice.actions;
export default searchHistorySlice.reducer;
