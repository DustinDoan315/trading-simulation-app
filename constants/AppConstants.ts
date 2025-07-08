/**
 * Centralized application constants
 * Use these instead of hardcoded values throughout the app
 */

// Trading Configuration
export const TRADING_CONFIG = {
  DEFAULT_BALANCE: 100000,
  INITIAL_USDT: 100000,
  MIN_TRADE_AMOUNT: 0.01,
  MAX_TRADE_AMOUNT: 1000000,
  BALANCE_PRECISION: 8,
  PRICE_PRECISION: 6,
} as const;

// Network & API Configuration
export const NETWORK_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  BASE_RETRY_DELAY: 1000,
  MAX_RETRY_DELAY: 10000,
  CONNECTION_TIMEOUT: 30000,
  REQUEST_TIMEOUT: 15000,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  USER_ID: '@user_id',
  USER_PROFILE: 'user_profile',
  USER_BALANCE: 'user_balance',
  SYNC_QUEUE: '@sync_queue',
  SYNC_STATUS: '@sync_status',
  LAST_SYNC: 'last_sync',
  SECURE_STORE_PREFIX: 'trading_sim_',
} as const;

// UI Configuration
export const UI_CONFIG = {
  CHART_HEIGHT: 300,
  LIST_ITEM_HEIGHT: 60,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  SKELETON_ANIMATION_SPEED: 1200,
} as const;

// Default Crypto Data
export const DEFAULT_CRYPTO = {
  CURRENCY: "USD",
  BASE_SYMBOL: "USDT",
  IMAGES: {
    tether: "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
    bitcoin: "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1547033579",
    ethereum: "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1595348880",
  },
  NAMES: {
    tether: "Tether",
    bitcoin: "Bitcoin", 
    ethereum: "Ethereum",
  },
  SYMBOLS: {
    tether: "USDT",
    bitcoin: "BTC",
    ethereum: "ETH",
  },
  IDS: {
    tether: "tether",
    bitcoin: "bitcoin",
    ethereum: "ethereum",
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INSUFFICIENT_BALANCE: "Insufficient USDT balance",
  NETWORK_ERROR: "Network connection error",
  INVALID_AMOUNT: "Invalid trade amount",
  USER_NOT_FOUND: "User not found",
  SYNC_FAILED: "Data synchronization failed",
  INVALID_INPUT: "Invalid input provided",
} as const;

// App Limits
export const APP_LIMITS = {
  MAX_PORTFOLIO_ITEMS: 50,
  MAX_SYNC_QUEUE_SIZE: 100,
  MAX_SEARCH_HISTORY: 20,
  MAX_COLLECTION_SIZE: 100,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
} as const;

// Theme Colors (centralized)
export const THEME_COLORS = {
  PRIMARY: '#007bff',
  SUCCESS: '#28a745',
  WARNING: '#ffc107',
  DANGER: '#dc3545',
  INFO: '#17a2b8',
  LIGHT: '#f8f9fa',
  DARK: '#343a40',
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY: {
    100: '#f8f9fa',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#6c757d',
    700: '#495057',
    800: '#343a40',
    900: '#212529',
  },
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  TRADE_AMOUNT_MIN: 0.01,
  TRADE_AMOUNT_MAX: 1000000,
  PORTFOLIO_VALUE_MAX: 10000000,
} as const;

// Default Holdings Configuration
export const DEFAULT_HOLDINGS = {
  USDT: {
    amount: TRADING_CONFIG.DEFAULT_BALANCE,
    valueInUSD: TRADING_CONFIG.DEFAULT_BALANCE,
    symbol: DEFAULT_CRYPTO.SYMBOLS.tether,
    name: DEFAULT_CRYPTO.NAMES.tether,
    image_url: DEFAULT_CRYPTO.IMAGES.tether,
    averageBuyPrice: 1,
    currentPrice: 1,
    profitLoss: 0,
    profitLossPercentage: 0,
  },
} as const;

// API Endpoints (if you have external APIs)
export const API_ENDPOINTS = {
  CRYPTO_PRICES: 'https://api.coingecko.com/api/v3',
  PRICE_UPDATE_INTERVAL: 30000, // 30 seconds
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_BIOMETRIC_AUTH: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_PUSH_NOTIFICATIONS: false,
  ENABLE_ANALYTICS: false, // Set to false for privacy
  ENABLE_CRASH_REPORTING: false, // Set to false initially
} as const;