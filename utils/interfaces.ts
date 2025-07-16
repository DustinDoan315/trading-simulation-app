export interface UserState {
  id: string;
  name: string;
  email: string;
  previousEmail?: string;
  isLoggedIn: boolean;
  createdAt: Date;
  isVerified: boolean;
}

export interface SecurityCredentials {
  publicKey: string;
  privateKey: string;
  encryptionMethod: "AES-256" | "RSA-2048" | "ECDSA-secp256k1";
  lastRotated: Date;
}

export interface WalletState {
  id: string;
  user_id: string;
  address: string;
  balance: number;
  type: "hot" | "cold" | "hybrid";
  network: BlockchainNetwork;
  isBackedUp: boolean;
  lastActivityTimestamp: Date;
}

export interface BlockchainNetwork {
  name: string;
  chainId: number;
  currencySymbol: string;
  explorerUrl: string;
  averageBlockTime: number;
}

export interface TransactionDetails {
  id: string;
  fromWalletId: string;
  toAddress: string;
  amount: number;
  fee: number;
  status: TransactionStatus;
  timestamp: Date;
  confirmations: number;
  transactionHash: string;
}

export type TransactionStatus =
  | "pending"
  | "confirmed"
  | "failed"
  | "canceled"
  | "processing"
  | "rollback";

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: number;
  price?: number;
}
