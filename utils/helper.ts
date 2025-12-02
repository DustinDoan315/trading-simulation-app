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
    // Generate random bytes using expo-crypto
    const randomBytes = await Crypto.getRandomBytesAsync(16);

    // Convert to a Buffer that bip39 can use
    const buffer = Buffer.from(randomBytes);

    // Generate mnemonic directly from the buffer
    const mnemonic = bip39.entropyToMnemonic(buffer);

    console.log("Generated Seed Phrase:", mnemonic);
    return mnemonic;
  } catch (error) {
    console.error("Failed to generate seed phrase:", error);
    return null;
  }
};

// --- Error Class ---
export class OrderError extends Error {
  public readonly userFriendlyMessage: string;
  constructor(internalMessage: string, userFriendlyMessage: string) {
    super(internalMessage);
    this.name = "OrderError";
    this.userFriendlyMessage = userFriendlyMessage;
  }
}

// --- Timestamp Utilities ---
export class TimestampUtils {
  /**
   * Converts various timestamp formats to ISO string for Supabase
   */
  static toISOTimestamp(timestamp: number | string | Date): string {
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }

    if (typeof timestamp === "string") {
      // If it's already an ISO string, return as is
      if (timestamp.includes("T") && timestamp.includes("Z")) {
        return timestamp;
      }
      // Try to parse as number
      const num = parseInt(timestamp, 10);
      if (!isNaN(num)) {
        return new Date(num * 1000).toISOString();
      }
      // Try to parse as date string
      return new Date(timestamp).toISOString();
    }

    if (typeof timestamp === "number") {
      // Check if it's Unix timestamp in seconds (10 digits) or milliseconds (13 digits)
      if (timestamp < 10000000000) {
        // Unix timestamp in seconds
        return new Date(timestamp * 1000).toISOString();
      } else {
        // Unix timestamp in milliseconds
        return new Date(timestamp).toISOString();
      }
    }

    throw new Error(`Invalid timestamp format: ${timestamp}`);
  }

  /**
   * Converts timestamp to Unix timestamp in seconds for local storage
   */
  static toUnixTimestamp(timestamp: number | string | Date): number {
    if (timestamp instanceof Date) {
      return Math.floor(timestamp.getTime() / 1000);
    }

    if (typeof timestamp === "string") {
      return Math.floor(new Date(timestamp).getTime() / 1000);
    }

    if (typeof timestamp === "number") {
      // Check if it's already in seconds
      if (timestamp < 10000000000) {
        return timestamp;
      } else {
        // Convert from milliseconds to seconds
        return Math.floor(timestamp / 1000);
      }
    }

    throw new Error(`Invalid timestamp format: ${timestamp}`);
  }

  /**
   * Validates if a timestamp is reasonable (not too far in past or future)
   */
  static isValidTimestamp(timestamp: number | string | Date): boolean {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      const now = new Date();
      const minDate = new Date("2020-01-01"); // Reasonable minimum date
      const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year in future

      return date >= minDate && date <= maxDate;
    } catch {
      return false;
    }
  }
}

// --- Toast Helper ---
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

// --- Core Logic ---
const MIN_AMOUNT = 0.1;

// Define types for the functions we need
export interface OrderValidationContext {
  getHoldings: () => Record<string, any>;
  getUsdtBalance?: () => number; // Optional USDT balance getter
}

export interface OrderDispatchContext {
  addTradeHistory: (order: Order) => void;
  updateHolding: (payload: any) => void;
  syncTransaction?: (order: Order) => void;
  updateTrade?: (payload: { cryptoUpdate: any; usdtUpdate: any }) => void;
}

/** Throws OrderError on validation failure */
export function validateOrder(order: Order, context: OrderValidationContext): void {
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
    // Try both uppercase and lowercase to handle case sensitivity
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
    // For buy orders, check USDT balance
    let usdtBalance = 0;
    
    // First try to get USDT balance from context if available
    if (context.getUsdtBalance) {
      usdtBalance = context.getUsdtBalance();
      console.log("🔍 USDT balance from context:", usdtBalance);
    }
    
    // Fallback to checking holdings if no context balance
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

    if (usdtBalance < order.total) {
      const msg = `Insufficient USDT balance. You have ${usdtBalance} USDT, trying to spend ${order.total} USDT`;
      console.error("❌ Insufficient USDT balance:", {
        available: usdtBalance,
        requested: order.total,
      });
      throw new OrderError("balance.insufficient", msg);
    }

    console.log("✅ Sufficient USDT balance for buy order");
  }
}

/** Dispatch both crypto and USDT adjustments with improved logic */
function dispatchUpdates(
  order: Order,
  isBuy: boolean,
  imageUrl: string,
  context: OrderDispatchContext
) {
  console.log("🔄 Dispatching order updates:", {
    orderType: order.type,
    symbol: order.symbol,
    amount: order.amount,
    total: order.total,
    isBuy,
  });

  context.addTradeHistory(order);

  const normalizedSymbol = order.symbol.toUpperCase();

  // Only process if it's not a USDT trade
  if (normalizedSymbol !== "USDT") {
    const cryptoUpdateAmount = isBuy ? order.amount : -order.amount;
    const cryptoUpdateValue = isBuy ? order.total : -order.total;
    const usdtUpdateAmount = isBuy ? -order.total : order.total;

    console.log("🔄 Updating trade (crypto + USDT):", {
      cryptoSymbol: normalizedSymbol,
      cryptoAmount: cryptoUpdateAmount,
      cryptoValue: cryptoUpdateValue,
      usdtAmount: usdtUpdateAmount,
      operation: isBuy ? "buy" : "sell",
    });

    // Use the new updateTrade action to handle both updates in a single call
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
          image: "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
        },
      });
    } else {
      // Fallback to the old method if updateTrade is not available
      console.warn("⚠️ updateTrade not available, falling back to separate updates");
      
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
        image: "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
      });
    }
  }

  // Sync transaction to cloud
  if (context.syncTransaction) {
    console.log("☁️ Syncing transaction to cloud...");
    // Fire and forget - don't block the order processing
    context.syncTransaction(order);
  } else {
    console.warn(
      "⚠️ No syncTransaction function provided - transaction will not be synced to cloud"
    );
  }
}

/**
 * Submits an order, updates state, and shows notifications.
 * @param order Order details
 * @param imageUrl URL for the asset image
 * @param validationContext Context for validation
 * @param dispatchContext Context for dispatching actions
 */
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

/**
 * Enhanced order submission with daily transaction limit checking
 * @param order Order details
 * @param imageUrl URL for the asset image
 * @param validationContext Context for validation
 * @param dispatchContext Context for dispatching actions
 */
export const handleOrderSubmissionWithLimitCheck = async (
  order: Order,
  imageUrl: string,
  validationContext: OrderValidationContext,
  dispatchContext: OrderDispatchContext
): Promise<Order> => {
  console.debug("[Order] Submitting with limit check:", order);

  try {
    // Balance validation is handled in handleOrderSubmissionWithLimitCheck

    const isBuy = order.type === "buy";

    const completed: Order = {
      ...order,
      status: "completed",
      executedPrice: order.price,
      executedAt: Date.now(),
      image: imageUrl,
    };

    // Dispatch updates (this handles the local state changes)
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

/**
 * Calculate portfolio metrics from balance holdings
 * @param balance - The user's balance object from Redux store
 * @returns Object containing portfolio metrics
 */
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

  // Calculate values for all holdings (excluding USDT to avoid double counting)
  Object.values(holdings).forEach((holding: any) => {
    if (holding.symbol !== "USDT") {
      const marketValue = holding.amount * holding.currentPrice;
      const costBasis = holding.amount * holding.averageBuyPrice;
      
      totalValue += marketValue;
      cryptoValue += marketValue;
      totalPnL += (marketValue - costBasis);
      totalCostBasis += costBasis;
      assetCount++;
    }
  });

  const totalPnLPercentage = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

  return {
    totalValue,
    totalAssets: assetCount,
    totalPnL,
    totalPnLPercentage,
    usdtBalance: balance.usdtBalance || 0,
    cryptoValue,
  };
};

/**
 * Format portfolio value for display
 * @param value - The portfolio value to format
 * @returns Formatted string
 */
export const formatPortfolioValue = (value: number): string => {
  if (value >= FORMATTING_THRESHOLDS.MILLION) {
    return `$${(value / FORMATTING_THRESHOLDS.MILLION).toFixed(3)}M`;
  } else if (value >= FORMATTING_THRESHOLDS.THOUSAND) {
    return `$${(value / FORMATTING_THRESHOLDS.THOUSAND).toFixed(3)}K`;
  } else {
    return `$${value.toFixed(3)}`;
  }
};

/**
 * Get color for P&L display
 * @param value - The P&L value
 * @returns Color string
 */
export const getPnLColor = (value: number): string => {
  return value >= 0 ? "#10BA68" : "#F9335D";
};

/**
 * Format P&L for display
 * @param value - The P&L value
 * @returns Formatted string with sign
 */
export const formatPnL = (value: number): string => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Utility function to handle user re-initialization when authentication is lost
 * This can be used across the app to handle "User not authenticated" errors
 */
export const handleUserReinitialization = async <T>(
  error: any,
  reinitializeUser: () => Promise<void>,
  retryFunction: () => Promise<T>
): Promise<T> => {
  // Check if this is an authentication error
  if (
    error.message?.includes("User not authenticated") ||
    error.message?.includes("Failed to initialize user authentication") ||
    error.message?.includes("User not found")
  ) {
    logger.info("Authentication error detected, attempting to re-initialize user", "helper");
    
    try {
      // Try to re-initialize user data
      await reinitializeUser();
      
      // Retry the original function
      logger.info("User re-initialized, retrying operation", "helper");
      return await retryFunction();
    } catch (reinitError) {
      logger.error("Failed to re-initialize user", "helper", reinitError);
      throw new Error("Authentication failed. Please restart the app and try again.");
    }
  }
  
  // If it's not an authentication error, re-throw the original error
  throw error;
};

/**
 * Calculate USDT balance from portfolio data
 * This function calculates the USDT balance by finding the USDT entry in the portfolio
 * and returning its quantity as the available USDT balance
 * If portfolio is empty (fresh reset), returns default balance
 */
export const calculateUSDTBalanceFromPortfolio = (portfolio: any[]): number => {
  try {
    // Handle undefined or null portfolio
    if (!portfolio || !Array.isArray(portfolio)) {
      console.warn('calculateUSDTBalanceFromPortfolio: portfolio is undefined or not an array, returning default balance');
      return DEFAULT_BALANCE; // Return default balance instead of 0
    }
    
    // If portfolio is empty, this likely means a fresh reset - return default balance
    if (portfolio.length === 0) {
      console.log('calculateUSDTBalanceFromPortfolio: portfolio is empty (fresh reset), returning default balance');
      return DEFAULT_BALANCE;
    }
    
    const usdtEntry = portfolio.find(item => 
      item && item.symbol && item.symbol.toUpperCase() === 'USDT'
    );
    
    if (usdtEntry) {
      return parseFloat(usdtEntry.quantity || '0');
    }
    
    // If no USDT entry found but portfolio has other items, return 0
    // This means user has spent all their USDT
    console.log('calculateUSDTBalanceFromPortfolio: no USDT entry found in portfolio, returning 0');
    return 0;
  } catch (error) {
    console.error('Error calculating USDT balance from portfolio:', error);
    return DEFAULT_BALANCE; // Return default balance on error instead of 0
  }
};

/**
 * Calculate total portfolio value including USDT
 * This function sums up the total_value of all portfolio items
 */
export const calculateTotalPortfolioValue = (portfolio: any[]): number => {
  try {
    // Handle undefined or null portfolio
    if (!portfolio || !Array.isArray(portfolio)) {
      console.warn('calculateTotalPortfolioValue: portfolio is undefined or not an array, returning 0');
      return 0;
    }
    
    return portfolio.reduce((total, item) => {
      if (!item) return total;
      const itemValue = parseFloat(item.total_value || '0');
      return total + itemValue;
    }, 0);
  } catch (error) {
    console.error('Error calculating total portfolio value:', error);
    return 0;
  }
};

/**
 * Calculate total PnL from portfolio data
 * This function sums up the profit_loss of all portfolio items
 */
export const calculateTotalPnL = (portfolio: any[]): number => {
  try {
    // Handle undefined or null portfolio
    if (!portfolio || !Array.isArray(portfolio)) {
      console.warn('calculateTotalPnL: portfolio is undefined or not an array, returning 0');
      return 0;
    }
    
    return portfolio.reduce((total, item) => {
      if (!item) return total;
      const itemPnL = parseFloat(item.profit_loss || '0');
      return total + itemPnL;
    }, 0);
  } catch (error) {
    console.error('Error calculating total PnL:', error);
    return 0;
  }
};

/**
 * Calculate total PnL percentage based on initial balance
 */
export const calculateTotalPnLPercentage = (totalPnL: number, initialBalance: number = DEFAULT_BALANCE): number => {
  try {
    if (initialBalance <= 0) return 0;
    return (totalPnL / initialBalance) * 100;
  } catch (error) {
    console.error('Error calculating total PnL percentage:', error);
    return 0;
  }
};

/**
 * Ensure URL uses HTTPS protocol for iOS App Transport Security compliance
 * @param url - The URL to validate and fix
 * @returns HTTPS URL or the original URL if it's not HTTP/HTTPS
 */
export const ensureHttpsUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return url;
  }

  // If it's an HTTP URL, convert to HTTPS
  if (url.startsWith('http://')) {
    const httpsUrl = url.replace('http://', 'https://');
    logger.info(`Converted HTTP to HTTPS: ${url} -> ${httpsUrl}`, "helper");
    return httpsUrl;
  }

  // Return as-is if already HTTPS or not HTTP-based
  return url;
};

/**
 * Validate and fix user data consistency
 * This function ensures all required fields are present and calculates missing values
 */
export const validateAndFixUserData = (userData: any, portfolio: any[] = []): any => {
  try {
    const now = new Date().toISOString();
    
    // Ensure portfolio is an array
    const safePortfolio = Array.isArray(portfolio) ? portfolio : [];
    
    // Calculate values from portfolio if not present
    const usdtBalance = userData.usdt_balance ? parseFloat(userData.usdt_balance) : calculateUSDTBalanceFromPortfolio(safePortfolio);
    const totalPortfolioValue = userData.total_portfolio_value ? parseFloat(userData.total_portfolio_value) : calculateTotalPortfolioValue(safePortfolio);
    const totalPnL = userData.total_pnl ? parseFloat(userData.total_pnl) : calculateTotalPnL(safePortfolio);
    const initialBalance = userData.initial_balance ? parseFloat(userData.initial_balance) : DEFAULT_BALANCE;
    const totalPnLPercentage = userData.total_pnl_percentage ? parseFloat(userData.total_pnl_percentage) : calculateTotalPnLPercentage(totalPnL, initialBalance);
    
    // Ensure all required fields are present
    const timestamp = Date.now().toString().slice(-6); // Get last 6 digits of timestamp
    const fixedUserData = {
      id: userData.id,
      username: userData.username || `user_${userData.id?.slice(0, 8) || 'unknown'}_${timestamp}`,
      display_name: userData.display_name || `User ${userData.id?.slice(0, 8) || 'unknown'}`,
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
    
    console.log('✅ User data validated and fixed:', {
      id: fixedUserData.id,
      usdt_balance: fixedUserData.usdt_balance,
      total_portfolio_value: fixedUserData.total_portfolio_value,
      total_pnl: fixedUserData.total_pnl,
      total_pnl_percentage: fixedUserData.total_pnl_percentage,
    });
    
    return fixedUserData;
  } catch (error) {
    console.error('Error validating and fixing user data:', error);
    return userData;
  }
};
