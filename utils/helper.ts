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

export const handleOrderSubmission = async (
  order: Order,
  currentPrice: string | undefined,
  token: any
) => {
  try {
    if (!currentPrice) {
      throw new Error("Current price not available");
    }

    if (!token?.symbol) {
      throw new Error("No token selected");
    }

    const totalCost =
      order.type === "buy"
        ? order.amount * Number(currentPrice)
        : order.amount * Number(currentPrice);

    // In a real app, this would call an API or blockchain transaction
    console.log(`Executing ${order.type} order:`, {
      symbol: token.symbol,
      amount: order.amount,
      price: currentPrice,
      totalCost,
    });

    // Update balances in Redux store
    const cryptoId = token.symbol.toLowerCase();
    const valueInUSD = order.amount * Number(currentPrice);

    // Update the token holding
    store.dispatch(
      balanceSlice.actions.updateHolding({
        cryptoId,
        amount: order.type === "buy" ? order.amount : -order.amount,
        valueInUSD: order.type === "buy" ? valueInUSD : -valueInUSD,
        symbol: token.symbol,
      })
    );

    // Update USDT balance for the transaction
    store.dispatch(
      balanceSlice.actions.updateHolding({
        cryptoId: "tether",
        amount: order.type === "buy" ? -totalCost : totalCost,
        valueInUSD: order.type === "buy" ? -totalCost : totalCost,
        symbol: "USDT",
      })
    );

    alert(
      `Order executed: ${order.type} ${order.amount} ${token.symbol} at ${currentPrice} USDT`
    );
  } catch (error: unknown) {
    console.error("Order failed:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    alert("Order failed: " + message);
  }
};
