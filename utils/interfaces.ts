/**
 * @fileoverview Comprehensive TypeScript Interfaces for Blockchain Wallet Application
 * @module WalletInterfaces
 * @description Defines type-safe interfaces for robust blockchain wallet management
 * @version 1.0.0
 * @requires typescript
 * @license MIT
 */

/**
 * Represents the core user profile and authentication state
 * @interface UserState
 * @description Manages user authentication and profile information
 */
export interface UserState {
  /** Unique identifier for the user */
  id: string;

  /** User's full name */
  name: string;

  /** Primary email address */
  email: string;

  /** Previous email address for tracking */
  previousEmail?: string;

  /** Indicates current authentication status */
  isLoggedIn: boolean;

  /** Timestamp of user account creation */
  createdAt: Date;

  /** Account verification status */
  isVerified: boolean;
}

/**
 * Defines authentication credentials and security protocols
 * @interface SecurityCredentials
 * @description Manages cryptographic keys and encryption methods
 */
export interface SecurityCredentials {
  /** Asymmetric public key for blockchain transactions */
  publicKey: string;

  /** Encrypted private key for transaction signing */
  privateKey: string;

  /** Preferred encryption methodology */
  encryptionMethod: "AES-256" | "RSA-2048" | "ECDSA-secp256k1";

  /** Timestamp of last key rotation */
  lastRotated: Date;
}

/**
 * Represents a blockchain wallet with comprehensive transaction capabilities
 * @interface WalletState
 * @description Tracks wallet properties, balances, and network associations
 */
export interface WalletState {
  /** Unique wallet identifier */
  id: string;

  /** Associated user identifier */
  userId: string;

  /** Wallet's blockchain address */
  address: string;

  /** Current balance in native cryptocurrency */
  balance: number;

  /** Wallet type determining security level */
  type: "hot" | "cold" | "hybrid";

  /** Blockchain network configuration */
  network: BlockchainNetwork;

  /** Indicates whether wallet has been securely backed up */
  isBackedUp: boolean;

  /** Timestamp of last transaction */
  lastActivityTimestamp: Date;
}

/**
 * Defines blockchain network configuration parameters
 * @interface BlockchainNetwork
 * @description Provides detailed network specifications
 */
export interface BlockchainNetwork {
  /** Network name */
  name: string;

  /** Unique network chain identifier */
  chainId: number;

  /** Native cryptocurrency symbol */
  currencySymbol: string;

  /** Blockchain explorer URL for transaction verification */
  explorerUrl: string;

  /** Average block confirmation time */
  averageBlockTime: number;
}

/**
 * Comprehensive transaction representation
 * @interface TransactionDetails
 * @description Tracks blockchain transaction metadata and status
 */
export interface TransactionDetails {
  /** Unique transaction identifier */
  id: string;

  /** Source wallet identifier */
  fromWalletId: string;

  /** Destination wallet address */
  toAddress: string;

  /** Transaction amount */
  amount: number;

  /** Transaction fee */
  fee: number;

  /** Current transaction processing status */
  status: TransactionStatus;

  /** Precise transaction timestamp */
  timestamp: Date;

  /** Number of network confirmations */
  confirmations: number;

  /** Transaction hash for blockchain verification */
  transactionHash: string;
}

/**
 * Defines possible transaction processing states
 * @typedef {string} TransactionStatus
 */
export type TransactionStatus =
  | "pending"
  | "confirmed"
  | "failed"
  | "canceled"
  | "processing"
  | "rollback";

/**
 * Represents token metadata and balance information
 * @interface TokenInfo
 * @description Tracks individual token properties across networks
 */
export interface TokenInfo {
  /** Token contract address */
  address: string;

  /** Human-readable token name */
  name: string;

  /** Token ticker symbol */
  symbol: string;

  /** Decimal precision for token calculations */
  decimals: number;

  /** Current token balance */
  balance: number;

  /** Current market price (optional) */
  price?: number;
}
