import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/store";

type Language = "en" | "vi";

interface LanguageState {
  currentLanguage: Language;
}

const initialState: LanguageState = {
  currentLanguage: "en",
};

export const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.currentLanguage = action.payload;
    },
  },
});

export const { setLanguage } = languageSlice.actions;

export const selectCurrentLanguage = (state: RootState) =>
  state.language.currentLanguage;

export default languageSlice.reducer;
