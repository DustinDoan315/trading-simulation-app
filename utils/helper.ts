import * as Application from "expo-application";
import * as bip39 from "bip39";
import * as Crypto from "expo-crypto";
import Toast from "react-native-toast-message";
import { Buffer } from "buffer";
import { Order } from "@/types/crypto";
import { Platform } from "react-native";
import { ToastPos, ToastType } from "@/types/common";

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

// export const storePassword = async (password: string) => {
//   try {
//     // Store the password with a service name, making it identifiable
//     await Keychain.setGenericPassword("walletPassword", password, {
//       service: "crypto-wallet", // This is optional, can be used to group your sensitive data
//     });
//     console.log("Password stored securely!");
//   } catch (error) {
//     console.error("Failed to store password: ", error);
//   }
// };

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

// export const retrievePassword = async () => {
//   try {
//     const credentials = await Keychain.getGenericPassword({
//       service: "crypto-wallet",
//     });

//     if (credentials) {
//       console.log("Password retrieved:", credentials.password);
//       return credentials.password;
//     } else {
//       console.log("No password stored");
//       return null;
//     }
//   } catch (error) {
//     console.error("Failed to retrieve password: ", error);
//     return null;
//   }
// };

// // Create a wallet from the seed phrase and password
// export const createWalletFromSeed = async (seedPhrase: any) => {
//   try {
//     // Generate a wallet from the seed phrase
//     const wallet = HDNodeWallet.fromMnemonic(seedPhrase);

//     console.log("Wallet Address:", wallet.address);
//     console.log("Wallet Private Key:", wallet.privateKey);

//     return wallet;
//   } catch (error) {
//     console.error("Failed to create wallet: ", error);
//     return null;
//   }
// };

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
}

export interface OrderDispatchContext {
  addTradeHistory: (order: Order) => void;
  updateHolding: (payload: any) => void;
  syncTransaction?: (order: Order) => void;
}

/** Throws OrderError on validation failure */
function validateOrder(order: Order, context: OrderValidationContext): void {
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
  if (order.type === "sell") {
    const holdings = context.getHoldings();
    console.log("📊 Current holdings:", holdings);

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
  }
}

/** Dispatch both crypto and USDT adjustments */
function dispatchUpdates(
  order: Order,
  isBuy: boolean,
  imageUrl: string,
  context: OrderDispatchContext
) {
  const sign = isBuy ? 1 : -1;
  const symbolId = order.symbol.toLowerCase();

  console.log("🔄 Dispatching order updates:", {
    orderType: order.type,
    symbol: order.symbol,
    amount: order.amount,
    total: order.total,
    isBuy,
  });

  context.addTradeHistory(order);

  context.updateHolding({
    cryptoId: symbolId,
    amount: sign * order.amount,
    valueInUSD: sign * order.total,
    symbol: order.symbol,
    name: order.name || order.symbol,
    image: imageUrl,
  });

  if (symbolId !== "usdt") {
    const usdtUpdate = {
      cryptoId: "usdt",
      amount: -sign * order.total,
      valueInUSD: -sign * order.total,
      symbol: "USDT",
      name: "Tether",
    };
    console.log("🔄 Updating USDT balance:", usdtUpdate);
    context.updateHolding(usdtUpdate);
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
 * @param notify Optional callback({ message, type })
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
