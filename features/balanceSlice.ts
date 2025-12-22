import { ASYNC_STORAGE_KEYS, DEFAULT_BALANCE } from "../utils/constant";
import { Holding, HoldingUpdatePayload, Order } from "../types/crypto";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  calculateTotalPnL,
  calculateTotalPnLPercentage,
  calculateTotalPortfolioValue as calculateTotalPortfolioValueFromArray,
  calculateUSDTBalanceFromPortfolio,
  validateAndFixUserData,
} from "../utils/helper";
import {
  getCryptoIdFromSymbol,
  getCryptoImageUrl,
} from "../utils/cryptoMapping";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AsyncStorageService } from "../services/AsyncStorageService";
import UUIDService from "../services/UUIDService";
import UserRepository from "../services/UserRepository";
import { UserService } from "../services/UserService";

export interface UserBalance {
  usdtBalance: number;
  totalPortfolioValue: number;
  holdings: Record<string, Holding>;
}

interface BalanceState {
  balance: UserBalance;
  previousBalance: UserBalance | null;
  changePercentage: number;
  changeValue: number;
  tradeHistory: Order[];
  loading: boolean;
  error: string | null;
}

const calculateProfitLoss = (holding: Holding) => {
  if (
    !holding ||
    typeof holding.amount !== "number" ||
    typeof holding.currentPrice !== "number" ||
    typeof holding.averageBuyPrice !== "number"
  ) {
    console.warn("Invalid holding data for profit/loss calculation:", holding);
    holding.profitLoss = 0;
    holding.profitLossPercentage = 0;
    return holding;
  }

  const marketValue = holding.amount * holding.currentPrice;
  const costBasis = holding.amount * holding.averageBuyPrice;
  holding.profitLoss = marketValue - costBasis;
  holding.profitLossPercentage =
    costBasis > 0 ? (holding.profitLoss / costBasis) * 100 : 0;
  return holding;
};

const calculateTotalPortfolioValue = (
  holdings: Record<string, Holding>,
  usdtBalance: number
): number => {
  if (!holdings || typeof holdings !== "object") {
    console.warn(
      "Invalid holdings object for portfolio value calculation:",
      holdings
    );
    return usdtBalance;
  }

  let totalValue = usdtBalance;

  Object.keys(holdings).forEach((key) => {
    const holding = holdings[key];
    if (
      !holding ||
      typeof holding.amount !== "number" ||
      typeof holding.valueInUSD !== "number"
    ) {
      console.warn("Invalid holding data in portfolio calculation:", holding);
      return;
    }

    if (holding.symbol !== "USDT") {
      totalValue += holding.valueInUSD;
    }
  });

  return totalValue;
};

const updateLeaderboardRankings = async (uuid: string) => {};

const initialState: BalanceState = {
  balance: {
    usdtBalance: DEFAULT_BALANCE,
    totalPortfolioValue: DEFAULT_BALANCE,
    holdings: {
      USDT: {
        amount: DEFAULT_BALANCE,
        valueInUSD: DEFAULT_BALANCE,
        symbol: "USDT",
        name: "Tether",
        image_url:
          "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
        averageBuyPrice: 1,
        currentPrice: 1,
        profitLoss: 0,
        profitLossPercentage: 0,
      },
    },
  },
  previousBalance: null,
  changePercentage: 0,
  changeValue: 0,
  tradeHistory: [],
  loading: false,
  error: null,
};

interface PortfolioItem {
  symbol: string;
  quantity: string;
  avg_cost: string;
  current_price?: string;
  image_url?: string;
  image?: string;
}

export const loadBalance = createAsyncThunk("balance/load", async () => {
  const uuid = await UUIDService.getOrCreateUser();

  let user = await UserRepository.getUser(uuid);

  if (!user) {
    try {
      const userProfileStr = await AsyncStorage.getItem(
        ASYNC_STORAGE_KEYS.USER_PROFILE
      );
      if (userProfileStr) {
        const userProfile = JSON.parse(userProfileStr);
        if (userProfile.id === uuid) {
          user = userProfile;
        }
      }
    } catch (error) {
      console.error(
        "Loading balance - Error getting user from UUIDService cache:",
        error
      );
    }
  }

  if (!user) {
    try {
      user = await UserService.getUserById(uuid);
      if (user) {
        await AsyncStorageService.createOrUpdateUser(user);
      }
    } catch (error) {
      console.error(
        "Loading balance - Error getting user from database:",
        error
      );
    }
  }

  if (!user) {
    try {
      user = await AsyncStorageService.recreateUserData(uuid, DEFAULT_BALANCE);
    } catch (error) {
      console.error("Loading balance - Error recreating user data:", error);
    }
  }

  let portfolio: PortfolioItem[] = [];
  try {
    portfolio = (await UserService.getPortfolio(uuid)) as PortfolioItem[];
  } catch (error) {
    console.error("Loading balance - Error fetching portfolio:", error);
    portfolio = [];
  }

  const safePortfolio = Array.isArray(portfolio) ? portfolio : [];

  const validatedUser = validateAndFixUserData(user, safePortfolio);

  const calculatedUSDTBalance =
    calculateUSDTBalanceFromPortfolio(safePortfolio);
  const calculatedTotalPortfolioValue =
    calculateTotalPortfolioValueFromArray(safePortfolio);
  const calculatedTotalPnL = calculateTotalPnL(safePortfolio);
  const calculatedTotalPnLPercentage = calculateTotalPnLPercentage(
    calculatedTotalPnL,
    parseFloat(validatedUser.initial_balance)
  );

  let usdtBalance = parseFloat(validatedUser.usdt_balance);

  if (isNaN(usdtBalance) || usdtBalance < 0) {
    usdtBalance = calculatedUSDTBalance;
  } else {
  }

  const usdtBalanceDiff = Math.abs(
    calculatedUSDTBalance - parseFloat(validatedUser.usdt_balance)
  );
  const portfolioValueDiff = Math.abs(
    calculatedTotalPortfolioValue -
      parseFloat(validatedUser.total_portfolio_value)
  );

  if (usdtBalanceDiff > 0.01 || portfolioValueDiff > 0.01) {
    try {
      await UserRepository.updateUserBalanceAndPortfolioValue(
        uuid,
        usdtBalance,
        calculatedTotalPortfolioValue,
        calculatedTotalPnL,
        calculatedTotalPnLPercentage
      );
    } catch (error) {
      console.error("Loading balance - Error updating user data:", error);
    }
  }

  const holdings: Record<string, Holding> = {};

  portfolio.forEach((item) => {
    if (item.symbol.toUpperCase() !== "USDT") {
      const quantity = parseFloat(item.quantity);
      const currentPrice = parseFloat(item.current_price || item.avg_cost);
      const avgCost = parseFloat(item.avg_cost);
      const valueInUSD = quantity * currentPrice;
      const profitLoss = valueInUSD - quantity * avgCost;
      const profitLossPercentage =
        avgCost > 0 ? (profitLoss / (quantity * avgCost)) * 100 : 0;

      const symbol = item.symbol.toUpperCase();
      const cryptoId = getCryptoIdFromSymbol(symbol);

      holdings[symbol] = {
        amount: quantity,
        valueInUSD: valueInUSD,
        symbol: symbol,
        name: item.symbol,
        cryptoId: cryptoId || undefined,
        image_url:
          item.image_url || item.image || getCryptoImageUrl(item.symbol),
        averageBuyPrice: avgCost,
        currentPrice: currentPrice,
        profitLoss: profitLoss,
        profitLossPercentage: profitLossPercentage,
      };
    }
  });

  holdings.USDT = {
    amount: usdtBalance,
    valueInUSD: usdtBalance,
    symbol: "USDT",
    name: "Tether",
    image_url:
      "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
    averageBuyPrice: 1,
    currentPrice: 1,
    profitLoss: 0,
    profitLossPercentage: 0,
  };

  const totalPortfolioValue = calculateTotalPortfolioValue(
    holdings,
    usdtBalance
  );

  return {
    usdtBalance,
    totalPortfolioValue,
    holdings,
  };
});

export const balanceSlice = createSlice({
  name: "balance",
  initialState,
  reducers: {
    addTradeHistory: (state, action: PayloadAction<Order>) => {
      state.tradeHistory.push(action.payload);
    },
    setBalance: (state, action: PayloadAction<UserBalance>) => {
      state.previousBalance = state.balance;
      state.balance = action.payload;

      if (state.previousBalance) {
        state.changeValue =
          state.balance.totalPortfolioValue -
          state.previousBalance.totalPortfolioValue;
        state.changePercentage =
          state.previousBalance.totalPortfolioValue !== 0
            ? (state.changeValue / state.previousBalance.totalPortfolioValue) *
              100
            : 0;
      }

      const usdtBalance = state.balance.usdtBalance;
      const totalPortfolioValue = state.balance.totalPortfolioValue;
      const holdingsCopy = JSON.parse(JSON.stringify(state.balance.holdings));

      UUIDService.getOrCreateUser().then((uuid) => {
        let totalPnL = 0;
        Object.values(holdingsCopy).forEach((holding: any) => {
          if (holding.symbol !== "USDT") {
            totalPnL += holding.profitLoss || 0;
          }
        });

        const totalPnLPercentage =
          DEFAULT_BALANCE > 0 ? (totalPnL / DEFAULT_BALANCE) * 100 : 0;
        UserRepository.updateUserBalanceAndPortfolioValue(
          uuid,
          usdtBalance,
          totalPortfolioValue,
          totalPnL,
          totalPnLPercentage
        );
        const portfolioItems = Object.entries(holdingsCopy)
          .filter(([symbol, holding]) => symbol.toUpperCase() !== "USDT")
          .map(([symbol, holding]) => ({
            id: `${uuid}-${symbol}`,
            user_id: uuid,
            symbol: symbol.toUpperCase(),
            quantity: holding.amount.toString(),
            avg_cost: holding.averageBuyPrice.toString(),
            current_price: holding.currentPrice.toString(),
            total_value: holding.valueInUSD.toString(),
            profit_loss: (holding.profitLoss || 0).toString(),
            profit_loss_percent: (holding.profitLossPercentage || 0).toString(),
            image_url: holding.image_url,
            last_updated: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
        UserRepository.savePortfolio(uuid, portfolioItems);

        UserService.updateLeaderboardRankings(uuid);
      });
    },
    resetBalance: (state) => {
      return { ...initialState };
    },
    updateHolding: (state, action: PayloadAction<HoldingUpdatePayload>) => {
      const { cryptoId, amount, valueInUSD, symbol, name, image_url } =
        action.payload;

      const normalizedSymbol = symbol.toUpperCase();
      const holdings = state.balance.holdings;
      const currentHolding = holdings[normalizedSymbol];

      if (normalizedSymbol === "USDT") {
        const newUsdtBalance = state.balance.usdtBalance + amount;

        if (newUsdtBalance < 0) {
          console.error(
            "Insufficient USDT balance - would result in:",
            newUsdtBalance
          );
          throw new Error("Insufficient USDT balance");
        }

        state.balance.usdtBalance = newUsdtBalance;

        holdings.USDT = {
          ...holdings.USDT,
          amount: newUsdtBalance,
          valueInUSD: newUsdtBalance,
        };
      } else {
        const pricePerToken = amount !== 0 ? Math.abs(valueInUSD / amount) : 0;

        if (currentHolding) {
          const newAmount = currentHolding.amount + amount;

          if (amount > 0) {
            const totalCost =
              currentHolding.amount * currentHolding.averageBuyPrice +
              valueInUSD;
            const newAverageBuyPrice =
              newAmount > 0 ? totalCost / newAmount : 0;
            const newValueInUSD = currentHolding.valueInUSD + valueInUSD;

            holdings[normalizedSymbol] = {
              ...currentHolding,
              amount: newAmount,
              valueInUSD: newValueInUSD,
              averageBuyPrice: newAverageBuyPrice,
            };
          } else {
            const sellRatio = Math.abs(amount) / currentHolding.amount;
            const newValueInUSD = currentHolding.valueInUSD * (1 - sellRatio);

            holdings[normalizedSymbol] = {
              ...currentHolding,
              amount: newAmount,
              valueInUSD: newValueInUSD,
            };
          }

          calculateProfitLoss(holdings[normalizedSymbol]);

          if (newAmount <= 0) {
            delete holdings[normalizedSymbol];
          }
        } else {
          holdings[normalizedSymbol] = {
            amount,
            valueInUSD,
            symbol: normalizedSymbol,
            name,
            image_url,
            averageBuyPrice: pricePerToken,
            currentPrice: pricePerToken,
            profitLoss: 0,
            profitLossPercentage: 0,
          };
        }
      }

      state.balance.totalPortfolioValue = calculateTotalPortfolioValue(
        holdings,
        state.balance.usdtBalance
      );

      try {
        const usdtBalance = state.balance.usdtBalance;
        const totalPortfolioValue = state.balance.totalPortfolioValue;
        const holdingsCopy = JSON.parse(JSON.stringify(holdings));

        let totalPnL = 0;
        Object.values(holdingsCopy).forEach((holding: any) => {
          if (holding.symbol !== "USDT") {
            totalPnL += holding.profitLoss || 0;
          }
        });

        UUIDService.getOrCreateUser()
          .then(async (uuid) => {
            const totalPnLPercentage =
              DEFAULT_BALANCE > 0 ? (totalPnL / DEFAULT_BALANCE) * 100 : 0;
            await UserRepository.updateUserBalanceAndPortfolioValue(
              uuid,
              usdtBalance,
              totalPortfolioValue,
              totalPnL,
              totalPnLPercentage
            );

            const portfolioItems = Object.entries(holdingsCopy)
              .filter(
                ([symbol, holding]: [string, any]) =>
                  symbol.toUpperCase() !== "USDT"
              )
              .map(([symbol, holding]: [string, any]) => ({
                id: `${uuid}-${symbol}`,
                user_id: uuid,
                symbol: symbol.toUpperCase(),
                quantity: holding.amount.toString(),
                avg_cost: holding.averageBuyPrice.toString(),
                current_price: holding.currentPrice.toString(),
                total_value: holding.valueInUSD.toString(),
                profit_loss: (holding.profitLoss || 0).toString(),
                profit_loss_percent: (
                  holding.profitLossPercentage || 0
                ).toString(),
                image_url: holding.image_url,
                last_updated: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }));
            await UserRepository.savePortfolio(uuid, portfolioItems);
          })
          .catch((error) => {
            console.error("❌ Error in updateHolding persistence:", error);
          });
      } catch (error) {
        console.error("❌ Error in updateHolding (before async):", error);
      }
    },
    updatePortfolio: (state, action: PayloadAction<UserBalance>) => {
      state.balance = action.payload;
      state.balance.totalPortfolioValue = calculateTotalPortfolioValue(
        action.payload.holdings,
        action.payload.usdtBalance
      );

      const usdtBalance = action.payload.usdtBalance;
      const totalPortfolioValue = action.payload.totalPortfolioValue;
      const holdingsCopy = JSON.parse(JSON.stringify(action.payload.holdings));

      UUIDService.getOrCreateUser().then((uuid) => {
        let totalPnL = 0;
        Object.values(holdingsCopy).forEach((holding: any) => {
          if (holding.symbol !== "USDT") {
            totalPnL += holding.profitLoss || 0;
          }
        });

        const totalPnLPercentage =
          DEFAULT_BALANCE > 0 ? (totalPnL / DEFAULT_BALANCE) * 100 : 0;
        UserRepository.updateUserBalanceAndPortfolioValue(
          uuid,
          usdtBalance,
          totalPortfolioValue,
          totalPnL,
          totalPnLPercentage
        );
        const portfolioItems = Object.entries(holdingsCopy)
          .filter(
            ([symbol, holding]: [string, any]) =>
              symbol.toUpperCase() !== "USDT"
          )
          .map(([symbol, holding]: [string, any]) => ({
            id: `${uuid}-${symbol}`,
            user_id: uuid,
            symbol: symbol.toUpperCase(),
            quantity: holding.amount.toString(),
            avg_cost: holding.averageBuyPrice.toString(),
            current_price: holding.currentPrice.toString(),
            total_value: holding.valueInUSD.toString(),
            profit_loss: (holding.profitLoss || 0).toString(),
            profit_loss_percent: (holding.profitLossPercentage || 0).toString(),
            image_url: holding.image_url,
            last_updated: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
        UserRepository.savePortfolio(uuid, portfolioItems);

        UserService.updateLeaderboardRankings(uuid);
      });
    },
    updateCurrentPrice: (
      state,
      action: PayloadAction<{ cryptoId: string; currentPrice: number }>
    ) => {
      const { cryptoId, currentPrice } = action.payload;
      const normalizedSymbol = cryptoId.toUpperCase();
      const holding = state.balance.holdings[normalizedSymbol];

      if (holding) {
        holding.currentPrice = currentPrice;
        holding.valueInUSD = holding.amount * currentPrice;
        calculateProfitLoss(holding);

        state.balance.totalPortfolioValue = calculateTotalPortfolioValue(
          state.balance.holdings,
          state.balance.usdtBalance
        );

        const usdtBalance = state.balance.usdtBalance;
        const totalPortfolioValue = state.balance.totalPortfolioValue;
        const holdingsCopy = JSON.parse(JSON.stringify(state.balance.holdings));

        UUIDService.getOrCreateUser().then(async (uuid) => {
          const portfolioItems = Object.entries(holdingsCopy)
            .filter(
              ([symbol, holding]: [string, any]) =>
                symbol.toUpperCase() !== "USDT"
            )
            .map(([symbol, holding]: [string, any]) => ({
              id: `${uuid}-${symbol}`,
              user_id: uuid,
              symbol: symbol.toUpperCase(),
              quantity: holding.amount.toString(),
              avg_cost: holding.averageBuyPrice.toString(),
              current_price: holding.currentPrice.toString(),
              total_value: holding.valueInUSD.toString(),
              profit_loss: (holding.profitLoss || 0).toString(),
              profit_loss_percent: (
                holding.profitLossPercentage || 0
              ).toString(),
              image_url: holding.image_url,
              last_updated: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }));
          await UserRepository.savePortfolio(uuid, portfolioItems);

          await UserService.updateLeaderboardRankings(uuid);

          const realTimeTotalPnL = Object.values(holdingsCopy).reduce(
            (sum: number, holding: any) => {
              return (
                sum + (holding.symbol !== "USDT" ? holding.profitLoss || 0 : 0)
              );
            },
            0
          );

          const realTimeTotalPnLPercentage =
            DEFAULT_BALANCE > 0
              ? (realTimeTotalPnL / DEFAULT_BALANCE) * 100
              : 0;

          await UserService.updateUser(uuid, {
            total_pnl: realTimeTotalPnL.toString(),
            total_pnl_percentage: realTimeTotalPnLPercentage.toString(),
            total_portfolio_value: totalPortfolioValue.toString(),
          } as any);
        });
      }
    },
    syncUsdtBalance: (state, action: PayloadAction<number>) => {
      const newBalance = action.payload;
      state.balance.usdtBalance = newBalance;

      if (state.balance.holdings.USDT) {
        state.balance.holdings.USDT.amount = newBalance;
        state.balance.holdings.USDT.valueInUSD = newBalance;
      }

      state.balance.totalPortfolioValue = calculateTotalPortfolioValue(
        state.balance.holdings,
        state.balance.usdtBalance
      );
    },
    updateTrade: (
      state,
      action: PayloadAction<{
        cryptoUpdate: HoldingUpdatePayload;
        usdtUpdate: HoldingUpdatePayload;
      }>
    ) => {
      const { cryptoUpdate, usdtUpdate } = action.payload;
      const holdings = state.balance.holdings;

      const normalizedCryptoSymbol = cryptoUpdate.symbol.toUpperCase();
      const currentCryptoHolding = holdings[normalizedCryptoSymbol];

      if (currentCryptoHolding) {
        const newAmount = currentCryptoHolding.amount + cryptoUpdate.amount;

        if (cryptoUpdate.amount > 0) {
          const totalCost =
            currentCryptoHolding.amount * currentCryptoHolding.averageBuyPrice +
            cryptoUpdate.valueInUSD;
          const newAverageBuyPrice = newAmount > 0 ? totalCost / newAmount : 0;
          const newValueInUSD =
            currentCryptoHolding.valueInUSD + cryptoUpdate.valueInUSD;

          holdings[normalizedCryptoSymbol] = {
            ...currentCryptoHolding,
            amount: newAmount,
            valueInUSD: newValueInUSD,
            averageBuyPrice: newAverageBuyPrice,
          };
        } else {
          const sellRatio =
            Math.abs(cryptoUpdate.amount) / currentCryptoHolding.amount;
          const newValueInUSD =
            currentCryptoHolding.valueInUSD * (1 - sellRatio);

          holdings[normalizedCryptoSymbol] = {
            ...currentCryptoHolding,
            amount: newAmount,
            valueInUSD: newValueInUSD,
          };
        }

        calculateProfitLoss(holdings[normalizedCryptoSymbol]);

        if (newAmount <= 0) {
          delete holdings[normalizedCryptoSymbol];
        }
      } else {
        const pricePerToken =
          cryptoUpdate.amount !== 0
            ? Math.abs(cryptoUpdate.valueInUSD / cryptoUpdate.amount)
            : 0;
        holdings[normalizedCryptoSymbol] = {
          amount: cryptoUpdate.amount,
          valueInUSD: cryptoUpdate.valueInUSD,
          symbol: normalizedCryptoSymbol,
          name: cryptoUpdate.name,
          image_url: cryptoUpdate.image_url,
          averageBuyPrice: pricePerToken,
          currentPrice: pricePerToken,
          profitLoss: 0,
          profitLossPercentage: 0,
        };
      }

      const newUsdtBalance = state.balance.usdtBalance + usdtUpdate.amount;

      if (newUsdtBalance < 0) {
        console.error(
          "Insufficient USDT balance - would result in:",
          newUsdtBalance
        );
        throw new Error("Insufficient USDT balance");
      }

      state.balance.usdtBalance = newUsdtBalance;

      holdings.USDT = {
        ...holdings.USDT,
        amount: newUsdtBalance,
        valueInUSD: newUsdtBalance,
      };

      state.balance.totalPortfolioValue = calculateTotalPortfolioValue(
        holdings,
        state.balance.usdtBalance
      );

      console.log("Persisting trade to database...");

      try {
        const usdtBalance = state.balance.usdtBalance;
        const totalPortfolioValue = state.balance.totalPortfolioValue;
        const holdingsCopy = JSON.parse(JSON.stringify(holdings));

        let totalPnL = 0;
        Object.values(holdingsCopy).forEach((holding: any) => {
          if (holding.symbol !== "USDT") {
            totalPnL += holding.profitLoss || 0;
          }
        });

        UUIDService.getOrCreateUser()
          .then(async (uuid) => {
            const totalPnLPercentage =
              DEFAULT_BALANCE > 0 ? (totalPnL / DEFAULT_BALANCE) * 100 : 0;
            await UserRepository.updateUserBalanceAndPortfolioValue(
              uuid,
              usdtBalance,
              totalPortfolioValue,
              totalPnL,
              totalPnLPercentage
            );

            const portfolioItems = Object.entries(holdingsCopy)
              .filter(
                ([symbol, holding]: [string, any]) =>
                  symbol.toUpperCase() !== "USDT"
              )
              .map(([symbol, holding]: [string, any]) => ({
                id: `${uuid}-${symbol}`,
                user_id: uuid,
                symbol: symbol.toUpperCase(),
                quantity: holding.amount.toString(),
                avg_cost: holding.averageBuyPrice.toString(),
                current_price: holding.currentPrice.toString(),
                total_value: holding.valueInUSD.toString(),
                profit_loss: (holding.profitLoss || 0).toString(),
                profit_loss_percent: (
                  holding.profitLossPercentage || 0
                ).toString(),
                image_url: holding.image_url,
                last_updated: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }));
            await UserRepository.savePortfolio(uuid, portfolioItems);

            await UserService.updateLeaderboardRankings(uuid);

            const realTimeTotalPnL = Object.values(holdingsCopy).reduce(
              (sum: number, holding: any) => {
                return (
                  sum +
                  (holding.symbol !== "USDT" ? holding.profitLoss || 0 : 0)
                );
              },
              0
            );

            const realTimeTotalPnLPercentage =
              DEFAULT_BALANCE > 0
                ? (realTimeTotalPnL / DEFAULT_BALANCE) * 100
                : 0;

            await UserService.updateUser(uuid, {
              total_pnl: realTimeTotalPnL.toString(),
              total_pnl_percentage: realTimeTotalPnLPercentage.toString(),
                total_portfolio_value: totalPortfolioValue.toString(),
              } as any);
            })
          .catch((error) => {
            console.error("❌ Error in updateTrade persistence:", error);
          });
      } catch (error) {
        console.error("❌ Error in updateTrade (before async):", error);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload;
      })
      .addCase(loadBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load balance";
      });
  },
});

export const {
  setBalance,
  resetBalance,
  updateHolding,
  addTradeHistory,
  updateCurrentPrice,
  updatePortfolio,
  syncUsdtBalance,
  updateTrade,
} = balanceSlice.actions;
export default balanceSlice.reducer;
