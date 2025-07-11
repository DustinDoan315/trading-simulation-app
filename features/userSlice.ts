import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserService } from '../services/UserService';
import {
  Collection,
  CollectionMember,
  CreateCollectionParams,
  CreateFavoriteParams,
  CreatePortfolioParams,
  CreateTransactionParams,
  CreateUserParams,
  Favorite,
  Portfolio,
  Transaction,
  UpdateUserParams,
  User,
  UserWithStats,
} from "../types/database";


// Async thunks
export const createUser = createAsyncThunk(
  "user/createUser",
  async (params: CreateUserParams) => {
    const user = await UserService.createUser(params);
    return user;
  }
);

export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async (userId: string) => {
    const user = await UserService.getUserById(userId);
    return user;
  }
);

export const updateUser = createAsyncThunk(
  "user/updateUser",
  async ({ id, params }: { id: string; params: UpdateUserParams }) => {
    const user = await UserService.updateUser(id, params);
    return user;
  }
);

export const updateUserBalance = createAsyncThunk(
  "user/updateUserBalance",
  async ({ id, newBalance }: { id: string; newBalance: string }) => {
    await UserService.updateUserBalance(id, newBalance);
    return { id, newBalance };
  }
);

export const fetchPortfolio = createAsyncThunk(
  "user/fetchPortfolio",
  async (userId: string) => {
    const portfolio = await UserService.getPortfolio(userId);
    return portfolio;
  }
);

export const createPortfolioAsset = createAsyncThunk(
  "user/createPortfolioAsset",
  async (params: CreatePortfolioParams) => {
    const asset = await UserService.createPortfolioAsset(params);
    return asset;
  }
);

export const createTransaction = createAsyncThunk(
  "user/createTransaction",
  async (params: CreateTransactionParams) => {
    const transaction = await UserService.createTransaction(params);
    return transaction;
  }
);

export const fetchTransactions = createAsyncThunk(
  "user/fetchTransactions",
  async ({ userId, limit }: { userId: string; limit?: number }) => {
    const transactions = await UserService.getTransactions(userId, limit);
    return transactions;
  }
);

export const fetchCollections = createAsyncThunk(
  "user/fetchCollections",
  async (userId?: string) => {
    const collections = await UserService.getCollections(userId);
    return collections;
  }
);

export const createCollection = createAsyncThunk(
  "user/createCollection",
  async (params: CreateCollectionParams) => {
    const collection = await UserService.createCollection(params);
    return collection;
  }
);

export const fetchFavorites = createAsyncThunk(
  "user/fetchFavorites",
  async (userId: string) => {
    const favorites = await UserService.getFavorites(userId);
    return favorites;
  }
);

export const addFavorite = createAsyncThunk(
  "user/addFavorite",
  async (params: CreateFavoriteParams) => {
    const favorite = await UserService.addFavorite(params);
    return favorite;
  }
);

export const removeFavorite = createAsyncThunk(
  "user/removeFavorite",
  async ({ userId, cryptoId }: { userId: string; cryptoId: string }) => {
    await UserService.removeFavorite(userId, cryptoId);
    return { userId, cryptoId };
  }
);



export const fetchUserStats = createAsyncThunk(
  "user/fetchUserStats",
  async (userId: string) => {
    const stats = await UserService.getUserStats(userId);
    return stats;
  }
);

// User Settings functions removed - table deleted
// export const fetchUserSettings = createAsyncThunk(
//   "user/fetchUserSettings",
//   async (userId: string) => {
//     const settings = await UserService.getUserSettings(userId);
//     return settings;
//   }
// );

// export const createUserSettings = createAsyncThunk(
//   "user/createUserSettings",
//   async (params: CreateUserSettingsParams) => {
//     const settings = await UserService.createUserSettings(params);
//     return settings;
//   }
// );

// export const updateUserSettings = createAsyncThunk(
//   "user/updateUserSettings",
//   async ({ id, params }: { id: string; params: UpdateUserSettingsParams }) => {
//     const settings = await UserService.updateUserSettings(id, params);
//     return settings;
//   }
// );

// State interface
interface UserState {
  currentUser: User | null;
  userStats: UserWithStats | null;
  // userSettings: UserSettings | null; // Removed - table deleted
  portfolio: Portfolio[];
  transactions: Transaction[];
  collections: Collection[];
  favorites: Favorite[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Initial state
const initialState: UserState = {
  currentUser: null,
  userStats: null,
  // userSettings: null, // Removed - table deleted
  portfolio: [],
  transactions: [],
  collections: [],
  favorites: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// User slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUser: (state) => {
      state.currentUser = null;
      state.userStats = null;
      // state.userSettings = null; // Removed - table deleted
      state.portfolio = [];
      state.transactions = [];
      state.collections = [];
      state.favorites = [];
      state.error = null;
      state.lastUpdated = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updatePortfolioAsset: (state, action: PayloadAction<Portfolio>) => {
      const index = state.portfolio.findIndex(
        (asset) => asset.id === action.payload.id
      );
      if (index !== -1) {
        state.portfolio[index] = action.payload;
      }
    },
    removePortfolioAsset: (state, action: PayloadAction<string>) => {
      state.portfolio = state.portfolio.filter(
        (asset) => asset.id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    // Create user
    builder
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create user";
      });

    // Fetch user
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch user";
      });

    // Update user
    builder
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update user";
      });

    // Update user balance
    builder.addCase(updateUserBalance.fulfilled, (state, action) => {
      if (state.currentUser && state.currentUser.id === action.payload.id) {
        state.currentUser.usdt_balance = action.payload.newBalance;
        state.lastUpdated = new Date().toISOString();
      }
    });

    // Fetch portfolio
    builder
      .addCase(fetchPortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.loading = false;
        state.portfolio = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch portfolio";
      });

    // Create portfolio asset
    builder.addCase(createPortfolioAsset.fulfilled, (state, action) => {
      if (action.payload) {
        state.portfolio.push(action.payload);
        state.lastUpdated = new Date().toISOString();
      }
    });

    // Fetch transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch transactions";
      });

    // Create transaction
    builder.addCase(createTransaction.fulfilled, (state, action) => {
      if (action.payload) {
        state.transactions.unshift(action.payload);
        state.lastUpdated = new Date().toISOString();
      }
    });

    // Fetch collections
    builder
      .addCase(fetchCollections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCollections.fulfilled, (state, action) => {
        state.loading = false;
        state.collections = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchCollections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch collections";
      });

    // Create collection
    builder.addCase(createCollection.fulfilled, (state, action) => {
      if (action.payload) {
        state.collections.unshift(action.payload);
        state.lastUpdated = new Date().toISOString();
      }
    });

    // Fetch favorites
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch favorites";
      });

    // Add favorite
    builder.addCase(addFavorite.fulfilled, (state, action) => {
      if (action.payload) {
        state.favorites.unshift(action.payload);
        state.lastUpdated = new Date().toISOString();
      }
    });

    // Remove favorite
    builder.addCase(removeFavorite.fulfilled, (state, action) => {
      state.favorites = state.favorites.filter(
        (favorite) =>
          !(
            favorite.user_id === action.payload.userId &&
            favorite.crypto_id === action.payload.cryptoId
          )
      );
      state.lastUpdated = new Date().toISOString();
    });



    // Fetch user stats
    builder
      .addCase(fetchUserStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.loading = false;
        state.userStats = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch user stats";
      });

    // User Settings functions removed - table deleted
    // Fetch user settings
    // builder
    //   .addCase(fetchUserSettings.pending, (state) => {
    //     state.loading = true;
    //     state.error = null;
    //   })
    //   .addCase(fetchUserSettings.fulfilled, (state, action) => {
    //     state.loading = false;
    //     state.userSettings = action.payload;
    //     state.lastUpdated = new Date().toISOString();
    //   })
    //   .addCase(fetchUserSettings.rejected, (state, action) => {
    //     state.loading = false;
    //     state.error = action.error.message || "Failed to fetch user settings";
    //   });

    // Create user settings
    // builder.addCase(createUserSettings.fulfilled, (state, action) => {
    //   if (action.payload) {
    //     state.userSettings = action.payload;
    //     state.lastUpdated = new Date().toISOString();
    //   }
    // });

    // Update user settings
    // builder.addCase(updateUserSettings.fulfilled, (state, action) => {
    //   if (action.payload) {
    //     state.userSettings = action.payload;
    //     state.lastUpdated = new Date().toISOString();
    //   }
    // });
  },
});

export const {
  clearUser,
  setLoading,
  setError,
  updatePortfolioAsset,
  removePortfolioAsset,
} = userSlice.actions;
export default userSlice.reducer;
