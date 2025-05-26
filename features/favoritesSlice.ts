import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FavoritesState {
  favoriteIds: string[];
}

const initialState: FavoritesState = {
  favoriteIds: [],
};

export const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const index = state.favoriteIds.indexOf(action.payload);
      if (index >= 0) {
        state.favoriteIds.splice(index, 1);
      } else {
        state.favoriteIds.push(action.payload);
      }
    },
    resetFavorites: (state) => {
      state.favoriteIds = [];
    },
  },
});

export const { toggleFavorite, resetFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
