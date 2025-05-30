import * as bip39 from "bip39";
import * as Crypto from "expo-crypto";
import { Buffer } from "buffer";
import { Order } from "@/app/types/crypto";

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

    console.log("====================================");
    console.log("Random Bytes:", randomBytes);

    // Convert to a Buffer that bip39 can use
    const buffer = Buffer.from(randomBytes);

    console.log("====================================");
    console.log("buffer:", buffer);

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

import { store } from "@/store";
import { balanceSlice } from "@/features/balanceSlice";
import { useNotification } from "@/components/ui/Notification";

export const handleOrderSubmission = async (
  order: Order,
  symbol: any,
  image_url: string,
  showNotification?: (notification: {
    message: string;
    type: "success" | "error" | "info";
  }) => void
) => {
  try {
    if (!symbol) {
      throw new Error("No token selected");
    }

    // Update order status to completed
    const completedOrder: Order = {
      ...order,
      status: "completed",
      executedPrice: order.price,
      executedAt: Date.now(),
      image_url: image_url,
    };

    // Save trade to Redux store
    store.dispatch(balanceSlice.actions.addTradeHistory(completedOrder));

    // Update balances in Redux store
    const cryptoId = symbol.toLowerCase();

    // Update the token holding
    store.dispatch(
      balanceSlice.actions.updateHolding({
        cryptoId,
        amount: order.type === "buy" ? order.amount : -order.amount,
        valueInUSD: order.type === "buy" ? order.total : -order.total,
        symbol: symbol,
        image_url: image_url,
        name: order.name || "Unknown",
      })
    );

    // Update USDT balance for the transaction
    store.dispatch(
      balanceSlice.actions.updateHolding({
        cryptoId: "tether",
        amount: order.type === "buy" ? -order.total : order.total,
        valueInUSD: order.type === "buy" ? -order.total : order.total,
        symbol: "USDT",
        name: "Tether",
      })
    );
    console.log("Order submitted:", completedOrder);

    if (showNotification) {
      showNotification({
        message: `${order.type === "buy" ? "Bought" : "Sold"} ${
          order.amount
        } ${symbol} for ${formatPrice(order.total)}`,
        type: "success",
      });
    }

    return completedOrder;
  } catch (error: unknown) {
    console.error("Order failed:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (showNotification) {
      showNotification({
        message: `Failed to ${order.type} ${symbol}: ${message}`,
        type: "error",
      });
    }

    throw new Error(message);
  }
};
