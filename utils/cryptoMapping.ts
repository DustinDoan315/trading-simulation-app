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


const COINGECKO_IMAGE_URLS: Record<string, string> = {

  "BTC": "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400",
  "ETH": "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501400",
  "USDT": "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
  "BNB": "https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png?1696501400",
  "SOL": "https://coin-images.coingecko.com/coins/images/4128/large/solana.png?1696501400",
  "USDC": "https://coin-images.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1696501400",
  "XRP": "https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png?1696501400",
  "ADA": "https://coin-images.coingecko.com/coins/images/975/large/Cardano_Logo.png?1696501400",
  "AVAX": "https://coin-images.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png?1696501400",
  "DOGE": "https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png?1696501400",
  "TRX": "https://coin-images.coingecko.com/coins/images/1094/large/tron-logo.png?1696501400",
  "DOT": "https://coin-images.coingecko.com/coins/images/12171/large/polkadot_new_logo.png?1696501400",
  "LINK": "https://coin-images.coingecko.com/coins/images/877/large/chainlink.png?1696501400",
  "MATIC": "https://coin-images.coingecko.com/coins/images/4713/large/matic-token-icon.png?1696501400",
  "TON": "https://coin-images.coingecko.com/coins/images/17980/large/ton_symbol.png?1696501400",
  "DAI": "https://coin-images.coingecko.com/coins/images/9956/large/4943.png?1696501400",
  "SHIB": "https://coin-images.coingecko.com/coins/images/11939/large/shiba.png?1696501400",
  "LTC": "https://coin-images.coingecko.com/coins/images/2/large/litecoin.png?1696501400",
  "BCH": "https://coin-images.coingecko.com/coins/images/780/large/bitcoin_cash.png?1696501400",
  "UNI": "https://coin-images.coingecko.com/coins/images/12504/large/uniswap-uni.png?1696501400",
  "XLM": "https://coin-images.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png?1696501400",
  "ATOM": "https://coin-images.coingecko.com/coins/images/1481/large/cosmos_hub.png?1696501400",
  "ETC": "https://coin-images.coingecko.com/coins/images/453/large/ethereum-classic-logo.png?1696501400",
  "XMR": "https://coin-images.coingecko.com/coins/images/69/large/monero_logo.png?1696501400",
  "FIL": "https://coin-images.coingecko.com/coins/images/12817/large/filecoin.png?1696501400",
  "APT": "https://coin-images.coingecko.com/coins/images/26455/large/aptos_round.png?1696501400",
  "HBAR": "https://coin-images.coingecko.com/coins/images/4648/large/hedera.png?1696501400",
  "CRO": "https://coin-images.coingecko.com/coins/images/7310/large/cybercoin.png?1696501400",
  "NEAR": "https://coin-images.coingecko.com/coins/images/10365/large/near_icon.png?1696501400",
  "OP": "https://coin-images.coingecko.com/coins/images/25244/large/Optimism.png?1696501400",
  "VET": "https://coin-images.coingecko.com/coins/images/1167/large/VeChain-Logo-768x725.png?1696501400",
  "MKR": "https://coin-images.coingecko.com/coins/images/1364/large/Mark_Maker.png?1696501400",
  "IMX": "https://coin-images.coingecko.com/coins/images/17233/large/imx.png?1696501400",
  "LDO": "https://coin-images.coingecko.com/coins/images/13573/large/Lido_DAO.png?1696501400",
  "ARB": "https://coin-images.coingecko.com/coins/images/16547/large/photo_2023-03-29_21-47-00.jpg?1696501400",
  "STX": "https://coin-images.coingecko.com/coins/images/2069/large/Stacks_logo_full.png?1696501400",
  "THETA": "https://coin-images.coingecko.com/coins/images/2538/large/theta-token-logo.png?1696501400",
  "FTM": "https://coin-images.coingecko.com/coins/images/4001/large/Fantom.png?1696501400",
  "ALGO": "https://coin-images.coingecko.com/coins/images/4380/large/download.png?1696501400",
  "ICP": "https://coin-images.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png?1696501400",
  "AAVE": "https://coin-images.coingecko.com/coins/images/12645/large/AAVE.png?1696501400",
  "EOS": "https://coin-images.coingecko.com/coins/images/738/large/eos-eos-logo.png?1696501400",
  "FLOW": "https://coin-images.coingecko.com/coins/images/13446/large/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.png?1696501400",
  "XTZ": "https://coin-images.coingecko.com/coins/images/976/large/Tezos-logo.png?1696501400",
  "SAND": "https://coin-images.coingecko.com/coins/images/12129/large/sandbox_logo.jpg?1696501400",
  "MANA": "https://coin-images.coingecko.com/coins/images/878/large/decentraland-mana.png?1696501400",
  "AXS": "https://coin-images.coingecko.com/coins/images/13025/large/axie_infinity_logo.png?1696501400",
  "GALA": "https://coin-images.coingecko.com/coins/images/12493/large/GALA-COINGECKO.png?1696501400",
  "CHZ": "https://coin-images.coingecko.com/coins/images/8834/large/Chiliz.png?1696501400",
  "HOT": "https://coin-images.coingecko.com/coins/images/3348/large/Holochain.png?1696501400",
  "DASH": "https://coin-images.coingecko.com/coins/images/19/large/dash-logo.png?1696501400",
  "ZEC": "https://coin-images.coingecko.com/coins/images/486/large/zec.png?1696501400",
  "BAT": "https://coin-images.coingecko.com/coins/images/677/large/basic-attention-token.png?1696501400",
  "ENJ": "https://coin-images.coingecko.com/coins/images/1102/large/enjin-coin-logo.png?1696501400",
  "NEO": "https://coin-images.coingecko.com/coins/images/480/large/NEO_512_512.png?1696501400",
  "WAVES": "https://coin-images.coingecko.com/coins/images/425/large/waves.png?1696501400",
  "ZIL": "https://coin-images.coingecko.com/coins/images/2687/large/Zilliqa-logo.png?1696501400",
  "QTUM": "https://coin-images.coingecko.com/coins/images/701/large/qtum.png?1696501400",
  "IOTA": "https://coin-images.coingecko.com/coins/images/692/large/IOTA_Swirl.png?1696501400",
  "XDC": "https://coin-images.coingecko.com/coins/images/2912/large/xdc-logo.png?1696501400",
  "ONE": "https://coin-images.coingecko.com/coins/images/4340/large/vechain.png?1696501400",
  "KSM": "https://coin-images.coingecko.com/coins/images/9568/large/mStzUy4.png?1696501400",
  "RVN": "https://coin-images.coingecko.com/coins/images/3383/large/Ravencoin.png?1696501400",
  "CAKE": "https://coin-images.coingecko.com/coins/images/12632/large/IMG_0440.PNG?1696501400",
  "COMP": "https://coin-images.coingecko.com/coins/images/10775/large/COMP.png?1696501400",
  "YFI": "https://coin-images.coingecko.com/coins/images/12149/large/yfi-192x192.png?1696501400",
  "SNX": "https://coin-images.coingecko.com/coins/images/3406/large/SNX.png?1696501400",
  "CRV": "https://coin-images.coingecko.com/coins/images/12124/large/Curve.png?1696501400",
  "SUSHI": "https://coin-images.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png?1696501400",
  "1INCH": "https://coin-images.coingecko.com/coins/images/13469/large/1inch.png?1696501400",
  "REN": "https://coin-images.coingecko.com/coins/images/3139/large/Ren.png?1696501400",
  "BAND": "https://coin-images.coingecko.com/coins/images/4775/large/band-protocol.png?1696501400",
  "OCEAN": "https://coin-images.coingecko.com/coins/images/3687/large/ocean-protocol-logo.jpg?1696501400",
  "ALPHA": "https://coin-images.coingecko.com/coins/images/12738/large/ec7316b1-8bd9-4a76-b531-a5e4a6092eac.jpg?1696501400",
  "AUDIO": "https://coin-images.coingecko.com/coins/images/12915/large/AUDIO_TOKEN.png?1696501400",
  "ANKR": "https://coin-images.coingecko.com/coins/images/4324/large/U85xTl2.png?1696501400",
  "STORJ": "https://coin-images.coingecko.com/coins/images/949/large/storj.png?1696501400",
  "SKL": "https://coin-images.coingecko.com/coins/images/10361/large/skale.png?1696501400",
  "DYDX": "https://coin-images.coingecko.com/coins/images/17500/large/hjnIm9b.png?1696501400",
  "RLC": "https://coin-images.coingecko.com/coins/images/646/large/rlc.png?1696501400",
  "RSR": "https://coin-images.coingecko.com/coins/images/12323/large/rsr.png?1696501400",
  "OGN": "https://coin-images.coingecko.com/coins/images/3298/large/ogn.png?1696501400",
  "CTSI": "https://coin-images.coingecko.com/coins/images/11038/large/cartesi.png?1696501400",
  "API3": "https://coin-images.coingecko.com/coins/images/13256/large/api3.jpg?1696501400",
  "UMA": "https://coin-images.coingecko.com/coins/images/10951/large/UMA.png?1696501400",
  "BADGER": "https://coin-images.coingecko.com/coins/images/13287/large/badger_dao_logo.jpg?1696501400",
  "PERP": "https://coin-images.coingecko.com/coins/images/12381/large/60d18e06844a844ad75901a9_mark_only_03.png?1696501400",
  "RAD": "https://coin-images.coingecko.com/coins/images/14013/large/radicle.png?1696501400",
  "MASK": "https://coin-images.coingecko.com/coins/images/14051/large/Mask_Network.jpg?1696501400",
  "AGLD": "https://coin-images.coingecko.com/coins/images/14367/large/loot-logo.png?1696501400",
  "ENS": "https://coin-images.coingecko.com/coins/images/19785/large/acatxTm.png?1696501400",
  "BLUR": "https://coin-images.coingecko.com/coins/images/28453/large/blur.png?1696501400",
  "PEPE": "https://coin-images.coingecko.com/coins/images/29850/large/pepe-token.jpeg?1696501400",
  "WIF": "https://coin-images.coingecko.com/coins/images/33587/large/wif.png?1696501400",
  "BONK": "https://coin-images.coingecko.com/coins/images/28600/large/bonk.jpg?1696501400",
  "FLOKI": "https://coin-images.coingecko.com/coins/images/16746/large/PNG_image.png?1696501400",
  "BOME": "https://coin-images.coingecko.com/coins/images/35667/large/bome.png?1696501400",
  "WLD": "https://coin-images.coingecko.com/coins/images/31069/large/worldcoin.jpg?1696501400",
  "JUP": "https://coin-images.coingecko.com/coins/images/34188/large/jupiter.png?1696501400",
  "PYTH": "https://coin-images.coingecko.com/coins/images/34412/large/pyth.png?1696501400",
};


export const getCryptoImageUrl = (symbol: string): string => {
  const normalizedSymbol = symbol.toUpperCase();
  

  if (COINGECKO_IMAGE_URLS[normalizedSymbol]) {
    return COINGECKO_IMAGE_URLS[normalizedSymbol];
  }
  

  return "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400";
}; 