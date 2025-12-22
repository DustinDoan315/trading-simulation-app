// AsyncStorage Keys - Centralized for consistency
export const ASYNC_STORAGE_KEYS = {
  // User related
  USER_ID: "@user_id",
  USER_PROFILE: "user_profile",
  USER_UUID: "user_uuid_13",

  // Onboarding
  ONBOARDING_COMPLETED: "@onboarding_completed",

  // Portfolio and transactions
  PORTFOLIO_DATA: "portfolio_data",
  TRANSACTIONS_DATA: "transactions_data",

  // Sync and queue
  SYNC_QUEUE: "sync_queue",
  SYNC_STATUS: "sync_status",
  LAST_SYNC: "last_sync",

  // Balance and user data
  USER_BALANCE: "user_balance",
  LAST_APP_RESET: "last_app_reset",

  // Crypto service cache
  RATE_LIMIT_CACHE: "rate_limit_cache",
  MARKET_DATA_CACHE: "market_data_cache",
  PRICE_ALERTS_CACHE: "price_alerts_cache",
} as const;

// Default values
export const DEFAULT_BALANCE = 100000;
export const DEFAULT_BALANCE_STRING = "100000.00";
export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_CRYPTO = "USDT";

// Default user values
export const DEFAULT_USER = {
  AVATAR_EMOJI: "🚀",
  INITIAL_BALANCE: DEFAULT_BALANCE_STRING,
  TOTAL_PNL: "0.00",
  TOTAL_PNL_PERCENTAGE: "0.00",
  TOTAL_TRADES: 0,
  TOTAL_BUY_VOLUME: "0.00",
  TOTAL_SELL_VOLUME: "0.00",
  WIN_RATE: "0.00",
} as const;

// Trading configuration
export const TRADING_CONFIG = {
  DEFAULT_DAILY_TRANSACTION_LIMIT: 10,
  DEFAULT_STARTING_BALANCE: DEFAULT_BALANCE_STRING,
  DEFAULT_STARTING_BALANCE_NUMBER: DEFAULT_BALANCE,
  TRADING_FEE_PERCENTAGE: 0.001,
  TRADING_FEE_DISPLAY: "0.1%",
  PERCENTAGE_BUTTONS: [25, 50, 75, 100] as const,
  PERCENTAGE_TOLERANCE: 0.01,
  PERCENTAGE_MATCH_TOLERANCE: 0.02,
  MAX_PERCENTAGE: 100,
  MIN_PERCENTAGE: 0,
  SMALL_NUMBER_THRESHOLD: 0.000001,
  SMALL_NUMBER_DECIMAL_PLACES: 8,
} as const;

// Crypto fallback prices (used when real-time price is unavailable)
export const CRYPTO_FALLBACK_PRICES = {
  BTC: 120000,
  ETH: 3100,
  SOL: 166,
  BNB: 700,
  ADA: 0.5,
  DOT: 7,
  LINK: 15,
  UNI: 7,
  MATIC: 0.8,
  LTC: 70,
  DEFAULT: 100,
} as const;

// Number formatting thresholds
export const FORMATTING_THRESHOLDS = {
  MILLION: 1000000,
  THOUSAND: 1000,
  BILLION: 1000000000,
} as const;

// Transaction limits
export const TRANSACTION_LIMITS = {
  DEFAULT_DAILY_LIMIT: 10,
  FETCH_LIMIT: 100,
} as const;

// Username generation
export const USERNAME_GENERATION = {
  ADJECTIVES: [
    "Crypto",
    "Trading",
    "Digital",
    "Smart",
    "Pro",
    "Elite",
    "Master",
    "Legend",
  ],
  NOUNS: [
    "Trader",
    "Investor",
    "Hodler",
    "Whale",
    "Shark",
    "Guru",
    "Ninja",
    "Wizard",
  ],
} as const;

// Onboarding screens configuration
export const ONBOARDING_SCREENS = [
  {
    id: "1",
    title: "Welcome to Learn Trading",
    content: "Practice trading with virtual money in a risk-free environment.",
    image: require("../assets/images/onboarding.png"),
  },
  {
    id: "2",
    title: "Learn & Compete",
    content: "Join trading competitions and climb the leaderboard.",
    image: require("../assets/images/rocket.png"),
  },
  {
    id: "3",
    title: "Track Your Progress",
    content: "Monitor your portfolio performance and trading statistics.",
    image: require("../assets/images/shield.png"),
  },
] as const;

// Crypto default images
export const DEFAULT_CRYPTO_IMAGE = {
  tether:
    "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
  bitcoin:
    "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1547033579",
  ethereum:
    "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1595348880",
};

// Crypto default names
export const DEFAULT_CRYPTO_NAME = {
  tether: "Tether",
  bitcoin: "Bitcoin",
  ethereum: "Ethereum",
};

// Crypto default symbols
export const DEFAULT_CRYPTO_SYMBOL = {
  tether: "USDT",
  bitcoin: "BTC",
  ethereum: "ETH",
};

// Crypto default IDs
export const DEFAULT_CRYPTO_ID = {
  tether: "tether",
  bitcoin: "bitcoin",
  ethereum: "ethereum",
};

// Default crypto holdings
export const DEFAULT_CRYPTO_HOLDINGS = {
  tether: {
    amount: DEFAULT_BALANCE,
    valueInUSD: DEFAULT_BALANCE,
    symbol: DEFAULT_CRYPTO_SYMBOL.tether,
    name: DEFAULT_CRYPTO_NAME.tether,
    image: DEFAULT_CRYPTO_IMAGE.tether,
    averageBuyPrice: 1,
    currentPrice: 1,
    profitLoss: 0,
    profitLossPercentage: 0,
  },
};

// Sync configuration
export const SYNC_CONFIG = {
  DEFAULT_INTERVAL_MS: 30000,
  MAX_CONCURRENT_UPDATES: 5,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 5000,
} as const;

export const BACKGROUND_SYNC_CONFIG = {
  INTERVAL_MS: 120000,
  MAX_CONCURRENT_UPDATES: 5,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 5000,
} as const;

// Non-tradeable tokens (do nothing when clicked)
// These tokens should not navigate to the chart screen when clicked
// Currently includes USDT/Tether as it's a stablecoin used for trading pairs
export const NON_TRADEABLE_TOKENS = [
  DEFAULT_CRYPTO_SYMBOL.tether, // USDT
  "USDT",
  "TETHER",
  "tether",
] as const;
