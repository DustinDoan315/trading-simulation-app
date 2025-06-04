import * as bip39 from "bip39";
import * as Crypto from "expo-crypto";
import { Buffer } from "buffer";
import { store } from "@/store";
import { balanceSlice } from "@/features/balanceSlice";
import Toast from "react-native-toast-message";
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

export const handleOrderSubmission = async (
  order: Order,
  symbol: any,
  image_url: string,
  showNotification?: (notification: {
    message: string;
    type: "success" | "error" | "info";
  }) => void
) => {
  console.log("Submitting order:", {
    ...order,
    symbol,
    image_url,
  });

  try {
    if (!symbol) {
      throw new Error("No token selected");
    }

    // Validate minimum token amount
    if (order.amount < 0.1) {
      const errorMessage = `Minimum order amount is 0.1 ${symbol}`;
      Toast.show({
        type: "warning",
        text1: "Minimum amount not met",
        text2: errorMessage,
        visibilityTime: 3000,
        autoHide: true,
        position: "top",
      });
      throw new Error(errorMessage);
    }

    // For sell orders, check balance before processing
    if (order.type === "sell") {
      const state = store.getState();
      const cryptoId = symbol.toLowerCase();
      const assetHolding = state.balance.balance.holdings[cryptoId];

      if (!assetHolding || assetHolding.amount < order.amount) {
        const errorMessage = `Insufficient ${symbol} balance`;
        if (showNotification) {
          showNotification({
            message: errorMessage,
            type: "error",
          });
        }
        throw new Error(errorMessage);
      }
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

    if (order.type === "buy") {
      // For buy orders, update token holding and subtract from USDT
      store.dispatch(
        balanceSlice.actions.updateHolding({
          cryptoId,
          amount: order.amount,
          valueInUSD: order.total,
          symbol: symbol,
          image_url: image_url,
          name: order.name || "Unknown",
        })
      );

      store.dispatch(
        balanceSlice.actions.updateHolding({
          cryptoId: "tether",
          amount: -order.total,
          valueInUSD: -order.total,
          symbol: "USDT",
          name: "Tether",
        })
      );
    } else {
      // For sell orders, update token holding and add to USDT
      store.dispatch(
        balanceSlice.actions.updateHolding({
          cryptoId,
          amount: -order.amount,
          valueInUSD: -order.total,
          symbol: symbol,
          image_url: image_url,
          name: order.name || "Unknown",
        })
      );

      store.dispatch(
        balanceSlice.actions.updateHolding({
          cryptoId: "tether",
          amount: order.total,
          valueInUSD: order.total,
          symbol: "USDT",
          name: "Tether",
        })
      );
    }
    console.log("Order submitted:", completedOrder);

    Toast.show({
      type: "success",
      text1: "Order executed",
      text2: `${order.type === "buy" ? "Bought" : "Sold"} ${
        order.amount
      } ${symbol} for ${formatPrice(order.total)}`,
      visibilityTime: 3000,
      autoHide: true,
      position: "top",
    });

    return completedOrder;
  } catch (error: unknown) {
    console.error("Order failed:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    Toast.show({
      type: "error",
      text1: "Order failed",
      text2: `Failed to ${order.type} ${symbol}: ${message}`,
      visibilityTime: 4000,
      autoHide: true,
      position: "top",
    });

    throw new Error(message);
  }
};
