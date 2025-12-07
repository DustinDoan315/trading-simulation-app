import * as Application from 'expo-application';
import * as bip39 from 'bip39';
import * as Crypto from 'expo-crypto';
import Toast from 'react-native-toast-message';
import { Buffer } from 'buffer';
import { DEFAULT_BALANCE, FORMATTING_THRESHOLDS } from '@/utils/constant';
import { logger } from '@/utils/logger';
import { Order } from '@/types/crypto';
import { Platform } from 'react-native';
import { ToastPos, ToastType } from '@/types/common';



global.Buffer = Buffer;

const USDollar = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatPrice = (price: number) => {
  return USDollar.format(price);
};

export const screenName = {
  home: "Home",
  short: "Short",
  subscription: "Subscription",
  library: "Library",
  create: "Create",
};

export const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

export const generateSeedPhrase = async () => {
  try {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    const buffer = Buffer.from(randomBytes);
    const mnemonic = bip39.entropyToMnemonic(buffer);

    console.log("Generated Seed Phrase:", mnemonic);
    return mnemonic;
  } catch (error) {
    console.error("Failed to generate seed phrase:", error);
    return null;
  }
};

export class OrderError extends Error {
  public readonly userFriendlyMessage: string;
  constructor(internalMessage: string, userFriendlyMessage: string) {
    super(internalMessage);
    this.name = "OrderError";
    this.userFriendlyMessage = userFriendlyMessage;
  }
}

export class TimestampUtils {
  static toISOTimestamp(timestamp: number | string | Date): string {
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }

    if (typeof timestamp === "string") {
      if (timestamp.includes("T") && timestamp.includes("Z")) {
        return timestamp;
      }
      const num = parseInt(timestamp, 10);
      if (!isNaN(num)) {
        return new Date(num * 1000).toISOString();
      }
      return new Date(timestamp).toISOString();
    }

    if (typeof timestamp === "number") {
      if (timestamp < 10000000000) {
        return new Date(timestamp * 1000).toISOString();
      } else {
        return new Date(timestamp).toISOString();
      }
    }

    throw new Error(`Invalid timestamp format: ${timestamp}`);
  }

  static toUnixTimestamp(timestamp: number | string | Date): number {
    if (timestamp instanceof Date) {
      return Math.floor(timestamp.getTime() / 1000);
    }

    if (typeof timestamp === "string") {
      return Math.floor(new Date(timestamp).getTime() / 1000);
    }

    if (typeof timestamp === "number") {
      if (timestamp < 10000000000) {
        return timestamp;
      } else {
        return Math.floor(timestamp / 1000);
      }
    }

    throw new Error(`Invalid timestamp format: ${timestamp}`);
  }

  static isValidTimestamp(timestamp: number | string | Date): boolean {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      const now = new Date();
      const minDate = new Date("2020-01-01");
      const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      return date >= minDate && date <= maxDate;
    } catch {
      return false;
    }
  }
}

const showToast = (
  type: ToastType,
  text1: string,
  text2: string,
  position: ToastPos = "top"
) => {
  Toast.show({
    type,
    text1,
    text2,
    position,
    visibilityTime: type === "error" ? 4000 : 3000,
    autoHide: true,
  });
};

const MIN_AMOUNT = 0.1;

export interface OrderValidationContext {
  getHoldings: () => Record<string, any>;
  getUsdtBalance?: () => number;
}

export interface OrderDispatchContext {
  addTradeHistory: (order: Order) => void;
  updateHolding: (payload: any) => void;
  syncTransaction?: (order: Order) => void;
  updateTrade?: (payload: { cryptoUpdate: any; usdtUpdate: any }) => void;
}

export function validateOrder(
  order: Order,
  context: OrderValidationContext
): void {
  console.log("🔍 Validating order:", {
    symbol: order.symbol,
    type: order.type,
    amount: order.amount,
    total: order.total,
  });

  if (!order.symbol) {
    throw new OrderError("symbol.missing", "No token selected");
  }
  if (order.amount < MIN_AMOUNT) {
    const msg = `Minimum order amount is ${MIN_AMOUNT} ${order.symbol}`;
    throw new OrderError("amount.tooSmall", msg);
  }

  const holdings = context.getHoldings();
  console.log("📊 Current holdings:", holdings);

  if (order.type === "sell") {
    const h =
      holdings[order.symbol.toUpperCase()] ||
      holdings[order.symbol.toLowerCase()];
    console.log(
      `🔍 Looking for ${order.symbol} in holdings (tried both cases):`,
      h
    );

    if (!h) {
      const msg = `No ${order.symbol} balance found. You need to buy ${order.symbol} first before you can sell it.`;
      console.error("❌ No holding found for symbol:", order.symbol);
      console.error("❌ Available holdings keys:", Object.keys(holdings));
      throw new OrderError("balance.insufficient", msg);
    }

    if (h.amount < order.amount) {
      const msg = `Insufficient ${order.symbol} balance. You have ${h.amount} ${order.symbol}, trying to sell ${order.amount} ${order.symbol}`;
      console.error("❌ Insufficient balance:", {
        available: h.amount,
        requested: order.amount,
        symbol: order.symbol,
      });
      throw new OrderError("balance.insufficient", msg);
    }

    console.log("✅ Sufficient balance for sell order");
  } else if (order.type === "buy") {
    let usdtBalance = 0;

    if (context.getUsdtBalance) {
      usdtBalance = context.getUsdtBalance();
      console.log("🔍 USDT balance from context:", usdtBalance);
    }

    if (usdtBalance === 0) {
      const usdtHolding = holdings.USDT || holdings.usdt;
      console.log("🔍 USDT holding for buy order:", usdtHolding);

      if (usdtHolding) {
        usdtBalance = usdtHolding.amount;
      }
    }

    if (usdtBalance === 0) {
      const msg = "No USDT balance found for buying";
      console.error("❌ No USDT balance found");
      throw new OrderError("balance.insufficient", msg);
    }

    const totalWithFees = order.total + (order.fees || 0);
    const balanceBuffer = 0.01;

    if (usdtBalance < totalWithFees + balanceBuffer) {
      const shortfall = totalWithFees - usdtBalance;
      const msg = `Insufficient USDT balance. You have ${usdtBalance.toFixed(
        2
      )} USDT, trying to spend ${totalWithFees.toFixed(
        2
      )} USDT (${order.total.toFixed(2)} + ${(order.fees || 0).toFixed(
        2
      )} fees). Shortfall: ${
        shortfall > 0 ? shortfall.toFixed(2) : "0.00"
      } USDT`;
      console.error("❌ Insufficient USDT balance:", {
        available: usdtBalance,
        requested: totalWithFees,
        total: order.total,
        fees: order.fees || 0,
        shortfall: shortfall > 0 ? shortfall : 0,
      });
      throw new OrderError("balance.insufficient", msg);
    }

    console.log("✅ Sufficient USDT balance for buy order");
  }
}

function dispatchUpdates(
  order: Order,
  isBuy: boolean,
  imageUrl: string,
  context: OrderDispatchContext
) {
  if (!order.amount || order.amount <= 0 || !Number.isFinite(order.amount)) {
    throw new OrderError(
      "amount.invalid",
      `Invalid order amount: ${order.amount}`
    );
  }
  if (!order.total || order.total <= 0 || !Number.isFinite(order.total)) {
    throw new OrderError(
      "total.invalid",
      `Invalid order total: ${order.total}`
    );
  }
  if (
    order.fees === undefined ||
    order.fees < 0 ||
    !Number.isFinite(order.fees)
  ) {
    throw new OrderError("fees.invalid", `Invalid order fees: ${order.fees}`);
  }

  console.log("🔄 Dispatching order updates:", {
    orderType: order.type,
    symbol: order.symbol,
    amount: order.amount,
    total: order.total,
    fees: order.fees,
    isBuy,
  });

  context.addTradeHistory(order);

  const normalizedSymbol = order.symbol.toUpperCase();

  if (normalizedSymbol !== "USDT") {
    const cryptoUpdateAmount = isBuy ? order.amount : -order.amount;
    const cryptoUpdateValue = isBuy ? order.total : -order.total;

    const totalFees = order.fees || 0;
    const usdtUpdateAmount = isBuy
      ? -(order.total + totalFees)
      : order.total - totalFees;

    if (!Number.isFinite(usdtUpdateAmount)) {
      throw new OrderError(
        "calculation.invalid",
        `Invalid USDT update amount: ${usdtUpdateAmount}`
      );
    }

    console.log("🔄 Updating trade (crypto + USDT):", {
      cryptoSymbol: normalizedSymbol,
      cryptoAmount: cryptoUpdateAmount,
      cryptoValue: cryptoUpdateValue,
      usdtAmount: usdtUpdateAmount,
      operation: isBuy ? "buy" : "sell",
    });

    if (context.updateTrade) {
      context.updateTrade({
        cryptoUpdate: {
          cryptoId: normalizedSymbol.toLowerCase(),
          amount: cryptoUpdateAmount,
          valueInUSD: cryptoUpdateValue,
          symbol: normalizedSymbol,
          name: order.name || normalizedSymbol,
          image_url: imageUrl,
        },
        usdtUpdate: {
          cryptoId: "usdt",
          amount: usdtUpdateAmount,
          valueInUSD: usdtUpdateAmount,
          symbol: "USDT",
          name: "Tether",
          image:
            "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
        },
      });
    } else {
      console.warn(
        "⚠️ updateTrade not available, falling back to separate updates"
      );

      context.updateHolding({
        cryptoId: normalizedSymbol.toLowerCase(),
        amount: cryptoUpdateAmount,
        valueInUSD: cryptoUpdateValue,
        symbol: normalizedSymbol,
        name: order.name || normalizedSymbol,
        image: imageUrl,
      });

      context.updateHolding({
        cryptoId: "usdt",
        amount: usdtUpdateAmount,
        valueInUSD: usdtUpdateAmount,
        symbol: "USDT",
        name: "Tether",
        image:
          "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
      });
    }
  }

  if (context.syncTransaction) {
    console.log("☁️ Syncing transaction to cloud...");
    context.syncTransaction(order);
  } else {
    console.warn(
      "⚠️ No syncTransaction function provided - transaction will not be synced to cloud"
    );
  }
}

export const handleOrderSubmission = async (
  order: Order,
  imageUrl: string,
  validationContext: OrderValidationContext,
  dispatchContext: OrderDispatchContext
): Promise<Order> => {
  console.debug("[Order] Submitting:", order);

  try {
    validateOrder(order, validationContext);

    const isBuy = order.type === "buy";

    const completed: Order = {
      ...order,
      status: "completed",
      executedPrice: order.price,
      executedAt: Date.now(),
      image: imageUrl,
    };

    dispatchUpdates(completed, isBuy, imageUrl, dispatchContext);

    const successMsg = `${isBuy ? "Bought" : "Sold"} ${order.amount} ${
      order.symbol
    } for ${formatPrice(order.total)}`;

    showToast("success", "Order executed", successMsg);

    console.debug("[Order] Success:", completed);
    return completed;
  } catch (err: unknown) {
    console.error("[Order] Failed:", err);

    const defaultMsg = "Order processing failed";
    const { message, userFriendlyMessage } =
      err instanceof OrderError
        ? { message: err.message, userFriendlyMessage: err.userFriendlyMessage }
        : { message: defaultMsg, userFriendlyMessage: defaultMsg };

    const errorText = `Failed to ${order.type} ${order.symbol}: ${userFriendlyMessage}`;
    showToast("error", "Order failed", errorText);

    throw new OrderError(message, userFriendlyMessage);
  }
};

export const handleOrderSubmissionWithLimitCheck = async (
  order: Order,
  imageUrl: string,
  validationContext: OrderValidationContext,
  dispatchContext: OrderDispatchContext
): Promise<Order> => {
  console.debug("[Order] Submitting with limit check:", order);

  try {
    validateOrder(order, validationContext);

    const isBuy = order.type === "buy";

    const completed: Order = {
      ...order,
      status: "completed",
      executedPrice: order.price,
      executedAt: Date.now(),
      image: imageUrl,
    };

    dispatchUpdates(completed, isBuy, imageUrl, dispatchContext);

    const successMsg = `${isBuy ? "Bought" : "Sold"} ${order.amount} ${
      order.symbol
    } for ${formatPrice(order.total)}`;

    showToast("success", "Order executed", successMsg);

    console.debug("[Order] Success with limit check:", completed);
    return completed;
  } catch (err: unknown) {
    console.error("[Order] Failed with limit check:", err);

    const defaultMsg = "Order processing failed";
    const { message, userFriendlyMessage } =
      err instanceof OrderError
        ? { message: err.message, userFriendlyMessage: err.userFriendlyMessage }
        : { message: defaultMsg, userFriendlyMessage: defaultMsg };

    const errorText = `Failed to ${order.type} ${order.symbol}: ${userFriendlyMessage}`;
    showToast("error", "Order failed", errorText);

    throw new OrderError(message, userFriendlyMessage);
  }
};

export const calculatePortfolioMetrics = (balance: any) => {
  if (!balance || !balance.holdings) {
    return {
      totalValue: 0,
      totalAssets: 0,
      totalPnL: 0,
      totalPnLPercentage: 0,
      usdtBalance: 0,
      cryptoValue: 0,
    };
  }

  const holdings = balance.holdings;
  let totalValue = balance.usdtBalance || 0;
  let totalPnL = 0;
  let totalCostBasis = 0;
  let assetCount = 0;
  let cryptoValue = 0;

  Object.values(holdings).forEach((holding: any) => {
    if (holding.symbol !== "USDT") {
      const marketValue = holding.amount * holding.currentPrice;
      const costBasis = holding.amount * holding.averageBuyPrice;

      totalValue += marketValue;
      cryptoValue += marketValue;
      totalPnL += marketValue - costBasis;
      totalCostBasis += costBasis;
      assetCount++;
    }
  });

  const totalPnLPercentage =
    totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

  return {
    totalValue,
    totalAssets: assetCount,
    totalPnL,
    totalPnLPercentage,
    usdtBalance: balance.usdtBalance || 0,
    cryptoValue,
  };
};

export const formatPortfolioValue = (value: number): string => {
  if (value >= FORMATTING_THRESHOLDS.MILLION) {
    return `$${(value / FORMATTING_THRESHOLDS.MILLION).toFixed(3)}M`;
  } else if (value >= FORMATTING_THRESHOLDS.THOUSAND) {
    return `$${(value / FORMATTING_THRESHOLDS.THOUSAND).toFixed(3)}K`;
  } else {
    return `$${value.toFixed(3)}`;
  }
};

export const getPnLColor = (value: number): string => {
  return value >= 0 ? "#10BA68" : "#F9335D";
};

export const formatPnL = (value: number): string => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const handleUserReinitialization = async <T>(
  error: any,
  reinitializeUser: () => Promise<void>,
  retryFunction: () => Promise<T>
): Promise<T> => {
  if (
    error.message?.includes("User not authenticated") ||
    error.message?.includes("Failed to initialize user authentication") ||
    error.message?.includes("User not found")
  ) {
    logger.info(
      "Authentication error detected, attempting to re-initialize user",
      "helper"
    );

    try {
      await reinitializeUser();
      logger.info("User re-initialized, retrying operation", "helper");
      return await retryFunction();
    } catch (reinitError) {
      logger.error("Failed to re-initialize user", "helper", reinitError);
      throw new Error(
        "Authentication failed. Please restart the app and try again."
      );
    }
  }

  throw error;
};

export const calculateUSDTBalanceFromPortfolio = (portfolio: any[]): number => {
  try {
    // Handle undefined or null portfolio
    if (!portfolio || !Array.isArray(portfolio)) {
      console.warn(
        "calculateUSDTBalanceFromPortfolio: portfolio is undefined or not an array, returning default balance"
      );
      return DEFAULT_BALANCE; // Return default balance instead of 0
    }

    if (portfolio.length === 0) {
      console.log(
        "calculateUSDTBalanceFromPortfolio: portfolio is empty (fresh reset), returning default balance"
      );
      return DEFAULT_BALANCE;
    }

    const usdtEntry = portfolio.find(
      (item) => item && item.symbol && item.symbol.toUpperCase() === "USDT"
    );

    if (usdtEntry) {
      return parseFloat(usdtEntry.quantity || "0");
    }

    console.log(
      "calculateUSDTBalanceFromPortfolio: no USDT entry found in portfolio, returning 0"
    );
    return 0;
  } catch (error) {
    console.error("Error calculating USDT balance from portfolio:", error);
    return DEFAULT_BALANCE; // Return default balance on error instead of 0
  }
};

export const calculateTotalPortfolioValue = (portfolio: any[]): number => {
  try {
    // Handle undefined or null portfolio
    if (!portfolio || !Array.isArray(portfolio)) {
      console.warn(
        "calculateTotalPortfolioValue: portfolio is undefined or not an array, returning 0"
      );
      return 0;
    }

    return portfolio.reduce((total, item) => {
      if (!item) return total;
      const itemValue = parseFloat(item.total_value || "0");
      return total + itemValue;
    }, 0);
  } catch (error) {
    console.error("Error calculating total portfolio value:", error);
    return 0;
  }
};

export const calculateTotalPnL = (portfolio: any[]): number => {
  try {
    // Handle undefined or null portfolio
    if (!portfolio || !Array.isArray(portfolio)) {
      console.warn(
        "calculateTotalPnL: portfolio is undefined or not an array, returning 0"
      );
      return 0;
    }

    return portfolio.reduce((total, item) => {
      if (!item) return total;
      const itemPnL = parseFloat(item.profit_loss || "0");
      return total + itemPnL;
    }, 0);
  } catch (error) {
    console.error("Error calculating total PnL:", error);
    return 0;
  }
};

export const calculateTotalPnLPercentage = (
  totalPnL: number,
  initialBalance: number = DEFAULT_BALANCE
): number => {
  try {
    if (initialBalance <= 0) return 0;
    return (totalPnL / initialBalance) * 100;
  } catch (error) {
    console.error("Error calculating total PnL percentage:", error);
    return 0;
  }
};

export const ensureHttpsUrl = (url: string): string => {
  if (!url || typeof url !== "string") {
    return url;
  }

  if (url.startsWith("http://")) {
    const httpsUrl = url.replace("http://", "https://");
    logger.info(`Converted HTTP to HTTPS: ${url} -> ${httpsUrl}`, "helper");
    return httpsUrl;
  }

  return url;
};

export const validateAndFixUserData = (
  userData: any,
  portfolio: any[] = []
): any => {
  try {
    const now = new Date().toISOString();

    const safePortfolio = Array.isArray(portfolio) ? portfolio : [];

    const usdtBalance = userData.usdt_balance
      ? parseFloat(userData.usdt_balance)
      : calculateUSDTBalanceFromPortfolio(safePortfolio);
    const totalPortfolioValue = userData.total_portfolio_value
      ? parseFloat(userData.total_portfolio_value)
      : calculateTotalPortfolioValue(safePortfolio);
    const totalPnL = userData.total_pnl
      ? parseFloat(userData.total_pnl)
      : calculateTotalPnL(safePortfolio);
    const initialBalance = userData.initial_balance
      ? parseFloat(userData.initial_balance)
      : DEFAULT_BALANCE;
    const totalPnLPercentage = userData.total_pnl_percentage
      ? parseFloat(userData.total_pnl_percentage)
      : calculateTotalPnLPercentage(totalPnL, initialBalance);

    // Ensure all required fields are present
    const timestamp = Date.now().toString().slice(-6); // Get last 6 digits of timestamp
    const fixedUserData = {
      id: userData.id,
      username:
        userData.username ||
        `user_${userData.id?.slice(0, 8) || "unknown"}_${timestamp}`,
      display_name:
        userData.display_name ||
        `User ${userData.id?.slice(0, 8) || "unknown"}`,
      avatar_emoji: userData.avatar_emoji || "🚀",
      usdt_balance: usdtBalance.toString(),
      total_portfolio_value: totalPortfolioValue.toString(),
      initial_balance: initialBalance.toString(),
      total_pnl: totalPnL.toString(),
      total_pnl_percentage: totalPnLPercentage.toString(),
      total_trades: userData.total_trades || 0,
      total_buy_volume: userData.total_buy_volume || "0.00",
      total_sell_volume: userData.total_sell_volume || "0.00",
      win_rate: userData.win_rate || "0.00",
      global_rank: userData.global_rank || undefined,
      last_trade_at: userData.last_trade_at || undefined,
      join_date: userData.join_date || now,
      last_active: userData.last_active || now,
      created_at: userData.created_at || now,
      updated_at: now,
    };

    console.log("✅ User data validated and fixed:", {
      id: fixedUserData.id,
      usdt_balance: fixedUserData.usdt_balance,
      total_portfolio_value: fixedUserData.total_portfolio_value,
      total_pnl: fixedUserData.total_pnl,
      total_pnl_percentage: fixedUserData.total_pnl_percentage,
    });

    return fixedUserData;
  } catch (error) {
    console.error("Error validating and fixing user data:", error);
    return userData;
  }
};
