export const DEFAULT_BALANCE = 100000;
export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_CRYPTO = "USDT";
export const DEFAULT_CRYPTO_IMAGE = {
  tether:
    "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
  bitcoin:
    "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1547033579",
  ethereum:
    "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1595348880",
};
export const DEFAULT_CRYPTO_NAME = {
  tether: "Tether",
  bitcoin: "Bitcoin",
  ethereum: "Ethereum",
};
export const DEFAULT_CRYPTO_SYMBOL = {
  tether: "USDT",
  bitcoin: "BTC",
  ethereum: "ETH",
};
export const DEFAULT_CRYPTO_ID = {
  tether: "tether",
  bitcoin: "bitcoin",
  ethereum: "ethereum",
};
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
