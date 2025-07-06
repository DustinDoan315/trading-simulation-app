import {
  clearUser,
  fetchFavorites,
  fetchPortfolio,
  fetchTransactions,
  fetchUser,
  fetchUserSettings,
  fetchUserStats,
} from "@/features/userSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import { User } from "@/types/database";
import React, { ReactNode, createContext, useContext, useEffect } from "react";

interface UserContextType {
  user: User | null;
  userStats: any;
  portfolio: any[];
  transactions: any[];
  favorites: any[];
  userSettings: any;
  loading: boolean;
  error: string | null;
  refreshUser: (userId: string) => Promise<void>;
  refreshUserData: (userId: string) => Promise<void>;
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
    userSettings,
    loading,
    error,
  } = useAppSelector((state) => state.user);

  const refreshUser = async (userId: string) => {
    try {
      await dispatch(fetchUser(userId)).unwrap();
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const refreshUserData = async (userId: string) => {
    try {
      // Fetch all user-related data in parallel
      await Promise.all([
        dispatch(fetchUser(userId)),
        dispatch(fetchUserStats(userId)),
        dispatch(fetchPortfolio(userId)),
        dispatch(fetchTransactions({ userId, limit: 50 })),
        dispatch(fetchFavorites(userId)),
        dispatch(fetchUserSettings(userId)),
      ]);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

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
        userSettings,
        loading,
        error,
        refreshUser,
        refreshUserData,
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
