import UUIDService from '@/services/UUIDService';
import { DEFAULT_BALANCE_STRING, DEFAULT_USER } from '@/utils/constant';
import { logger } from '@/utils/logger';
import { store } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store';
import { User } from '@/types/database';
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
} from "react";
import {
  clearUser,
  createUser,
  fetchFavorites,
  fetchPortfolio,
  fetchTransactions,
  fetchUser,
  fetchUserStats,
} from "@/features/userSlice";


interface UserContextType {
  user: User | null;
  userStats: any;
  portfolio: any[];
  transactions: any[];
  favorites: any[];
  loading: boolean;
  error: string | null;
  refreshUser: (userId: string) => Promise<void>;
  refreshUserData: (userId: string) => Promise<void>;
  reinitializeUser: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();
  const {
    currentUser: user,
    userStats,
    portfolio,
    transactions,
    favorites,
    loading,
    error,
  } = useAppSelector((state) => state.user);

  const refreshUser = useCallback(
    async (userId: string) => {
      try {
        await dispatch(fetchUser(userId)).unwrap();
      } catch (error) {
        logger.error("Failed to refresh user", "UserContext", error);
      }
    },
    [dispatch]
  );

  const refreshUserData = useCallback(
    async (userId: string) => {
      try {
        await Promise.all([
          dispatch(fetchUser(userId)),
          dispatch(fetchUserStats(userId)),
          dispatch(fetchPortfolio(userId)),
          dispatch(fetchTransactions({ userId, limit: 50 })),
          dispatch(fetchFavorites(userId)),
        ]);
      } catch (error) {
        logger.error("Failed to refresh user data", "UserContext", error);
      }
    },
    [dispatch]
  );

  const reinitializeUser = useCallback(async () => {
    try {
      logger.info("Re-initializing user data", "UserContext");

      // Check if user already exists in Redux store
      const userData = store.getState().user;
      if (userData?.currentUser) {
        logger.info(
          "User exists in Redux store, verifying Supabase existence",
          "UserContext",
          {
            userId: userData.currentUser.id,
          }
        );

        // Verify user exists in Supabase
        try {
          await dispatch(fetchUser(userData.currentUser.id)).unwrap();
          logger.info("User verified in Supabase", "UserContext");
          return;
        } catch (error) {
          logger.warn(
            "User exists in Redux but not in Supabase, will recreate",
            "UserContext",
            { userId: userData.currentUser.id, error }
          );
          // Clear the user from Redux so we can recreate them
          dispatch(clearUser());
        }
      }

      const userId = await UUIDService.getOrCreateUser();

      try {
        await dispatch(fetchUser(userId)).unwrap();
        logger.info("Existing user fetched successfully", "UserContext");

        await refreshUserData(userId);
      } catch (error) {
        logger.info(
          "User not found in database, creating new user",
          "UserContext",
          { userId }
        );
        const timestamp = Date.now().toString().slice(-6);
        const username = `user_${userId.slice(0, 8)}_${timestamp}`;
        await dispatch(
          createUser({
            id: userId,
            username,
            display_name: username,
            avatar_emoji: "🚀",
            usdt_balance: DEFAULT_BALANCE_STRING,
          })
        ).unwrap();
      }
    } catch (error) {
      logger.error("Failed to re-initialize user", "UserContext", error);
      throw error;
    }
  }, [dispatch, refreshUserData]);

  const logout = () => {
    dispatch(clearUser());
  };

  return (
    <UserContext.Provider
      value={{
        user,
        userStats,
        portfolio,
        transactions,
        favorites,
        loading,
        error,
        refreshUser,
        refreshUserData,
        reinitializeUser,
        logout,
      }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
