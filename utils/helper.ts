import * as Crypto from "expo-crypto";
import * as bip39 from "bip39";
import { Buffer } from "buffer";

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
