import * as bip39 from "bip39";
import * as Crypto from "expo-crypto";
import { Buffer } from "buffer";
import { store } from "@/store";
import { balanceSlice } from "@/features/balanceSlice";
import Toast from "react-native-toast-message";
import { Order } from "@/app/types/crypto";
import { Platform } from "react-native";
import * as Application from 'expo-application';

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

// Custom error class for order processing
class OrderError extends Error {
  constructor(message: string, public userFriendlyMessage: string) {
    super(message);
    this.name = "OrderError";
  }
}

// Helper to show consistent notifications
const showToast = (
  type: "success" | "error" | "warning" | "info",
  text1: string,
  text2: string,
  position: "top" | "bottom" = "top"
) => {
  Toast.show({
    type,
    text1,
    text2,
    visibilityTime: type === "error" ? 4000 : 3000,
    autoHide: true,
    position,
  });
};

export const handleOrderSubmission = async (
  order: Order,
  symbol: string, // Changed from 'any' to string for type safety
  image: string,
  showNotification?: (notification: {
    message: string;
    type: "success" | "error" | "info";
  }) => void
): Promise<Order> => {
  console.debug("[Order] Submitting:", { ...order, symbol, image });

  try {
    // Input validation
    if (!symbol) throw new OrderError("No token selected", "No token selected");

    const MIN_AMOUNT = 0.1;
    if (order.amount < MIN_AMOUNT) {
      const msg = `Minimum order amount is ${MIN_AMOUNT} ${symbol}`;
      throw new OrderError(msg, msg);
    }

    // Balance check for sell orders
    if (order.type === "sell") {
      const state = store.getState();
      const holding = state.balance.balance.holdings[symbol.toLowerCase()];

      if (!holding || holding.amount < order.amount) {
        const msg = `Insufficient ${symbol} balance`;
        if (showNotification) showNotification({ message: msg, type: "error" });
        throw new OrderError(msg, msg);
      }
    }

    // Create completed order object
    const completedOrder: Order = {
      ...order,
      status: "completed",
      executedPrice: order.price,
      executedAt: Date.now(),
      image,
    };

    // Prepare dispatch parameters
    const cryptoId = symbol.toLowerCase();
    const assetName = order.name || "Unknown";
    const isBuyOrder = order.type === "buy";
    const sign = isBuyOrder ? 1 : -1;

    // Dispatch trade history
    store.dispatch(balanceSlice.actions.addTradeHistory(completedOrder));

    // Update crypto holding
    store.dispatch(
      balanceSlice.actions.updateHolding({
        cryptoId,
        amount: sign * order.amount,
        valueInUSD: sign * order.total,
        symbol,
        image,
        name: assetName,
      })
    );

    // Update USDT holding
    store.dispatch(
      balanceSlice.actions.updateHolding({
        cryptoId: "USDT",
        amount: -sign * order.total,
        valueInUSD: -sign * order.total,
        symbol: "USDT",
        name: "Tether",
      })
    );

    // Success notification
    showToast(
      "success",
      "Order executed",
      `${isBuyOrder ? "Bought" : "Sold"} ${
        order.amount
      } ${symbol} for ${formatPrice(order.total)}`
    );

    console.debug("[Order] Submitted successfully:", completedOrder);
    return completedOrder;
  } catch (error: unknown) {
    console.error("[Order] Failed:", error);

    const defaultError = "Order processing failed";
    const { message, userFriendlyMessage } =
      error instanceof OrderError
        ? {
            message: error.message,
            userFriendlyMessage: error.userFriendlyMessage,
          }
        : { message: defaultError, userFriendlyMessage: defaultError };

    // Show error notification
    showToast(
      "error",
      "Order failed",
      `Failed to ${order.type} ${symbol}: ${userFriendlyMessage}`
    );

    // Propagate error for further handling
    throw new OrderError(message, userFriendlyMessage);
  }
};

export const getDeviceUUID = async (): Promise<string> => {
  if (Platform.OS === 'ios') {
    return await Application.getIosIdForVendorAsync() || 'fallback-ios-uuid';
  } else {
    return Application.getAndroidId() || 'fallback-android-uuid';
  }
};
