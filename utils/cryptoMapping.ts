// Top 100 highest market cap cryptocurrencies mapping
// Symbol -> Crypto ID mapping for API calls

export const SYMBOL_TO_CRYPTO_ID: Record<string, string> = {
  // Top 10
  "BTC": "bitcoin",
  "ETH": "ethereum",
  "USDT": "tether",
  "BNB": "binancecoin",
  "SOL": "solana",
  "USDC": "usd-coin",
  "XRP": "ripple",
  "ADA": "cardano",
  "AVAX": "avalanche-2",
  "DOGE": "dogecoin",

  // 11-20
  "TRX": "tron",
  "DOT": "polkadot",
  "LINK": "chainlink",
  "MATIC": "matic-network",
  "TON": "the-open-network",
  "DAI": "dai",
  "SHIB": "shiba-inu",
  "LTC": "litecoin",
  "BCH": "bitcoin-cash",
  "UNI": "uniswap",

  // 21-30
  "XLM": "stellar",
  "ATOM": "cosmos",
  "ETC": "ethereum-classic",
  "XMR": "monero",
  "FIL": "filecoin",
  "APT": "aptos",
  "HBAR": "hedera-hashgraph",
  "CRO": "crypto-com-chain",
  "NEAR": "near",
  "OP": "optimism",

  // 31-40
  "VET": "vechain",
  "MKR": "maker",
  "IMX": "immutable-x",
  "LDO": "lido-dao",
  "ARB": "arbitrum",
  "STX": "blockstack",
  "THETA": "theta-token",
  "FTM": "fantom",
  "ALGO": "algorand",
  "ICP": "internet-computer",

  // 41-50
  "AAVE": "aave",
  "EOS": "eos",
  "FLOW": "flow",
  "XTZ": "tezos",
  "SAND": "the-sandbox",
  "MANA": "decentraland",
  "AXS": "axie-infinity",
  "GALA": "gala",
  "CHZ": "chiliz",
  "HOT": "holochain",

  // 51-60
  "DASH": "dash",
  "ZEC": "zcash",
  "BAT": "basic-attention-token",
  "ENJ": "enjincoin",
  "NEO": "neo",
  "WAVES": "waves",
  "ZIL": "zilliqa",
  "QTUM": "qtum",
  "IOTA": "iota",
  "XDC": "xdce-crowd-sale",

  // 61-70
  "ONE": "harmony",
  "KSM": "kusama",
  "RVN": "ravencoin",
  "CAKE": "pancakeswap-token",
  "COMP": "compound-governance-token",
  "YFI": "yearn-finance",
  "SNX": "havven",
  "CRV": "curve-dao-token",
  "SUSHI": "sushi",
  "1INCH": "1inch",

  // 71-80
  "REN": "republic-protocol",
  "BAND": "band-protocol",
  "OCEAN": "ocean-protocol",
  "ALPHA": "alpha-finance",
  "AUDIO": "audius",
  "ANKR": "ankr",
  "STORJ": "storj",
  "SKL": "skale",
  "DYDX": "dydx",
  "RLC": "iexec-rlc",

  // 81-90
  "RSR": "reserve-rights-token",
  "OGN": "origin-protocol",
  "CTSI": "cartesi",
  "API3": "api3",
  "UMA": "uma",
  "BADGER": "badger-dao",
  "PERP": "perpetual-protocol",
  "RAD": "radicle",
  "MASK": "mask-network",
  "AGLD": "adventure-gold",

  // 91-100
  "ENS": "ethereum-name-service",
  "BLUR": "blur",
  "PEPE": "pepe",
  "WIF": "dogwifhat",
  "BONK": "bonk",
  "FLOKI": "floki",
  "BOME": "book-of-meme",
  "WLD": "worldcoin",
  "JUP": "jupiter",
  "PYTH": "pyth-network",
};

// Reverse mapping for convenience
export const CRYPTO_ID_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  Object.entries(SYMBOL_TO_CRYPTO_ID).map(([symbol, id]) => [id, symbol])
);

// Helper function to get crypto ID from symbol
export const getCryptoIdFromSymbol = (symbol: string): string | null => {
  const normalizedSymbol = symbol.toUpperCase();
  return SYMBOL_TO_CRYPTO_ID[normalizedSymbol] || null;
};

// Helper function to get symbol from crypto ID
export const getSymbolFromCryptoId = (cryptoId: string): string | null => {
  return CRYPTO_ID_TO_SYMBOL[cryptoId] || null;
};

// Helper function to check if symbol is supported
export const isSupportedSymbol = (symbol: string): boolean => {
  const normalizedSymbol = symbol.toUpperCase();
  return normalizedSymbol in SYMBOL_TO_CRYPTO_ID;
};

// Get all supported symbols
export const getSupportedSymbols = (): string[] => {
  return Object.keys(SYMBOL_TO_CRYPTO_ID);
};

// Get all supported crypto IDs
export const getSupportedCryptoIds = (): string[] => {
  return Object.values(SYMBOL_TO_CRYPTO_ID);
}; 