import * as bip39 from "bip39";
import * as Crypto from "expo-crypto";
import { Buffer } from "buffer";
import { Order } from "@/app/types/crypto";
import { useBalanceStore } from "@/stores/balanceStore";

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

interface Token {
  symbol: string;
  name?: string;
  decimals?: number;
}

export const handleOrderSubmission = async (
  order: Order,
  currentPrice: string | undefined,
  token: Token
): Promise<{ success: boolean; message: string }> => {
  try {
    // Input validation
    if (!currentPrice) {
      throw new Error("Current price not available");
    }
    if (!token?.symbol) {
      throw new Error("No token selected");
    }
    if (order.amount <= 0) {
      throw new Error("Order amount must be positive");
    }

    const price = Number(currentPrice);
    if (isNaN(price) || price <= 0) {
      throw new Error("Invalid price");
    }

    const totalCost = order.amount * price;
    const cryptoId = token.symbol.toLowerCase();
    const valueInUSD = order.amount * price;

    // In a real app, this would call an API or blockchain transaction
    // Consider using CryptoService here for actual transactions
    const transactionDetails = {
      type: order.type,
      symbol: token.symbol,
      amount: order.amount,
      price: currentPrice,
      totalCost,
      timestamp: Date.now(),
    };

    // Update balances using Zustand store
    try {
      useBalanceStore.getState().setBalance({
        ...useBalanceStore.getState().balance,
        holdings: {
          ...useBalanceStore.getState().balance.holdings,
          [cryptoId]: {
            amount:
              (useBalanceStore.getState().balance.holdings[cryptoId]?.amount ||
                0) + (order.type === "buy" ? order.amount : -order.amount),
            valueInUSD:
              (useBalanceStore.getState().balance.holdings[cryptoId]
                ?.valueInUSD || 0) +
              (order.type === "buy" ? valueInUSD : -valueInUSD),
            symbol: token.symbol,
          },
          tether: {
            amount:
              (useBalanceStore.getState().balance.holdings.tether?.amount ||
                0) + (order.type === "buy" ? -totalCost : totalCost),
            valueInUSD:
              (useBalanceStore.getState().balance.holdings.tether?.valueInUSD ||
                0) + (order.type === "buy" ? -totalCost : totalCost),
            symbol: "USDT",
          },
        },
      });
    } catch (dispatchError) {
      console.error("Failed to update balances:", dispatchError);
      throw new Error("Failed to update account balances");
    }

    return {
      success: true,
      message: `Order executed: ${order.type} ${order.amount} ${token.symbol} at ${currentPrice} USDT`,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Order failed:", error);
    return {
      success: false,
      message: `Order failed: ${message}`,
    };
  }
};
