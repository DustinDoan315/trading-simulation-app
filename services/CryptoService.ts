/**
 * Functional service for interacting with cryptocurrency APIs and blockchain data
 * Designed for React Native + Web3 integration
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Types for cryptocurrency data
export interface CryptoCurrency {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  market_cap: number;
  total_volume: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  last_updated: string;
}

export interface UserBalance {
  totalInUSD: number;
  holdings: {
    [key: string]: {
      amount: number;
      valueInUSD: number;
    };
  };
}

export interface PriceAlert {
  id: string;
  cryptoId: string;
  targetPrice: number;
  isAbove: boolean;
  isTriggered: boolean;
  createdAt: number;
}

// Constants
const CACHE_EXPIRY_MS = 1000 * 60 * 5; // 5 minutes
const MARKET_DATA_CACHE_KEY = "@crypto_market_data";
const USER_BALANCE_CACHE_KEY = "@user_balance";
const PRICE_ALERTS_CACHE_KEY = "@price_alerts";

/**
 * Get cached market data if available and not expired
 *
 * @param ignoreExpiry - Whether to ignore cache expiry
 * @returns Promise with cached data or null
 */
const getCachedMarketData = async (
  ignoreExpiry = false
): Promise<CryptoCurrency[] | null> => {
  try {
    const cachedDataJson = await AsyncStorage.getItem(MARKET_DATA_CACHE_KEY);

    if (!cachedDataJson) {
      return null;
    }

    const { timestamp, data } = JSON.parse(cachedDataJson);
    const now = Date.now();

    // Check if cache is expired
    if (!ignoreExpiry && now - timestamp > CACHE_EXPIRY_MS) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error reading cached market data:", error);
    return null;
  }
};

/**
 * Cache market data with timestamp
 *
 * @param data - Market data to cache
 */
const cacheMarketData = async (data: CryptoCurrency[]): Promise<void> => {
  try {
    const cacheData = {
      timestamp: Date.now(),
      data,
    };

    await AsyncStorage.setItem(
      MARKET_DATA_CACHE_KEY,
      JSON.stringify(cacheData)
    );
  } catch (error) {
    console.error("Error caching market data:", error);
  }
};

/**
 * Fetch cryptocurrency market data with caching
 *
 * @param forceRefresh - Whether to bypass cache and force a refresh
 * @param limit - Number of cryptocurrencies to fetch
 * @returns Promise with cryptocurrency data
 */
export const getMarketData = async (
  forceRefresh = false,
  limit = 20
): Promise<CryptoCurrency[]> => {
  try {
    // Try to get cached data first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = await getCachedMarketData();
      if (cachedData) {
        return cachedData;
      }
    }

    // Fetch fresh data from API with request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data: CryptoCurrency[] = await response.json();

      // Cache the new data
      await cacheMarketData(data);

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Request timed out");
      }
      throw error;
    }
  } catch (error) {
    console.error("Error fetching market data:", error);

    // If online fetch fails, try to return potentially stale cached data
    const cachedData = await getCachedMarketData(true);
    if (cachedData) {
      return cachedData;
    }

    throw error;
  }
};

/**
 * Get detailed information for a specific cryptocurrency
 *
 * @param id - Cryptocurrency ID
 * @returns Promise with detailed cryptocurrency data
 */
export const getCryptoDetails = async (id: string): Promise<any> => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching details for ${id}:`, error);
    throw error;
  }
};

/**
 * Get user's cryptocurrency holdings and balance
 * In a real app, this would connect to a wallet or blockchain
 *
 * @returns Promise with user balance data
 */
export const getUserBalance = async (): Promise<UserBalance> => {
  // In a real blockchain app, this would interact with a wallet SDK
  // For example, with ethers.js:
  // const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  // const balance = await provider.getBalance(walletAddress);

  try {
    const storedBalance = await AsyncStorage.getItem(USER_BALANCE_CACHE_KEY);

    if (storedBalance) {
      return JSON.parse(storedBalance);
    }

    // Default mock balance if none stored
    const defaultBalance: UserBalance = {
      totalInUSD: 53145.76,
      holdings: {
        bitcoin: {
          amount: 0.5,
          valueInUSD: 42000,
        },
        ethereum: {
          amount: 5.2,
          valueInUSD: 9500,
        },
        tether: {
          amount: 1645.76,
          valueInUSD: 1645.76,
        },
      },
    };

    await AsyncStorage.setItem(
      USER_BALANCE_CACHE_KEY,
      JSON.stringify(defaultBalance)
    );
    return defaultBalance;
  } catch (error) {
    console.error("Error getting user balance:", error);
    throw error;
  }
};

/**
 * Update user's cryptocurrency balance
 * In a real app, this would sync with blockchain transactions
 *
 * @param newBalance - Updated balance data
 */
export const updateUserBalance = async (
  newBalance: UserBalance
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      USER_BALANCE_CACHE_KEY,
      JSON.stringify(newBalance)
    );
  } catch (error) {
    console.error("Error updating user balance:", error);
    throw error;
  }
};

/**
 * Get price history for a cryptocurrency
 *
 * @param id - Cryptocurrency ID
 * @param days - Number of days of history to retrieve
 * @returns Promise with price history data
 */
export const getPriceHistory = async (
  id: string,
  days = 7
): Promise<{ prices: [number, number][] }> => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching price history for ${id}:`, error);
    throw error;
  }
};

/**
 * Set a price alert for a cryptocurrency
 *
 * @param cryptoId - Cryptocurrency ID
 * @param targetPrice - Target price to trigger alert
 * @param isAbove - Whether to trigger when price goes above target
 * @returns Promise with the created alert
 */
export const setPriceAlert = async (
  cryptoId: string,
  targetPrice: number,
  isAbove: boolean
): Promise<PriceAlert> => {
  try {
    // Get existing alerts
    const existingAlertsJson = await AsyncStorage.getItem(
      PRICE_ALERTS_CACHE_KEY
    );
    const existingAlerts: PriceAlert[] = existingAlertsJson
      ? JSON.parse(existingAlertsJson)
      : [];

    // Create new alert
    const newAlert: PriceAlert = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      cryptoId,
      targetPrice,
      isAbove,
      isTriggered: false,
      createdAt: Date.now(),
    };

    // Save updated alerts
    const updatedAlerts = [...existingAlerts, newAlert];
    await AsyncStorage.setItem(
      PRICE_ALERTS_CACHE_KEY,
      JSON.stringify(updatedAlerts)
    );

    return newAlert;
  } catch (error) {
    console.error("Error setting price alert:", error);
    throw error;
  }
};

/**
 * Get all price alerts
 *
 * @returns Promise with all price alerts
 */
export const getPriceAlerts = async (): Promise<PriceAlert[]> => {
  try {
    const alertsJson = await AsyncStorage.getItem(PRICE_ALERTS_CACHE_KEY);
    return alertsJson ? JSON.parse(alertsJson) : [];
  } catch (error) {
    console.error("Error getting price alerts:", error);
    throw error;
  }
};

/**
 * Check if any price alerts should be triggered
 * In a real app, this would use push notifications
 *
 * @param marketData - Current market data
 * @returns Promise with triggered alerts
 */
export const checkPriceAlerts = async (
  marketData: CryptoCurrency[]
): Promise<PriceAlert[]> => {
  try {
    const alerts = await getPriceAlerts();
    const triggeredAlerts: PriceAlert[] = [];

    // Process each alert
    const updatedAlerts = alerts.map((alert) => {
      if (alert.isTriggered) return alert;

      const crypto = marketData.find((c) => c.id === alert.cryptoId);
      if (!crypto) return alert;

      const shouldTrigger = alert.isAbove
        ? crypto.current_price >= alert.targetPrice
        : crypto.current_price <= alert.targetPrice;

      if (shouldTrigger) {
        alert.isTriggered = true;
        triggeredAlerts.push(alert);
      }

      return alert;
    });

    // Save updated alerts
    await AsyncStorage.setItem(
      PRICE_ALERTS_CACHE_KEY,
      JSON.stringify(updatedAlerts)
    );

    return triggeredAlerts;
  } catch (error) {
    console.error("Error checking price alerts:", error);
    return [];
  }
};

// Additional Web3 integration functions

/**
 * Convert user balance to blockchain wallet format
 * This would be expanded in a real application to interact with actual wallets
 *
 * @param balance - User balance data
 * @returns Blockchain-ready balance data
 */
export const prepareForBlockchain = (balance: UserBalance): any => {
  // This is a placeholder for actual blockchain integration
  // In a real app, you'd use ethers.js or web3.js to format data for transactions
  return {
    totalValue: balance.totalInUSD.toString(),
    tokens: Object.entries(balance.holdings).map(([id, data]) => ({
      id,
      amount: data.amount.toString(),
      value: data.valueInUSD.toString(),
    })),
  };
};

/**
 * Search for cryptocurrencies
 *
 * @param query - Search query
 * @param limit - Maximum number of results
 * @returns Promise with search results
 */
export const searchCryptocurrencies = async (
  query: string,
  limit = 10
): Promise<CryptoCurrency[]> => {
  try {
    if (!query) return [];

    // First try to search through cached data as it's faster
    const cachedData = await getCachedMarketData(true);
    if (cachedData) {
      const filteredData = cachedData.filter(
        (crypto) =>
          crypto.name.toLowerCase().includes(query.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(query.toLowerCase())
      );

      if (filteredData.length > 0) {
        return filteredData.slice(0, limit);
      }
    }

    // If no cached results, fetch from API
    const response = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(
        query
      )}`
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const coins = data.coins || [];

    // Map to the same structure as our CryptoCurrency interface
    return coins.slice(0, limit).map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.large,
      current_price: 0, // Will need to be fetched separately
      price_change_percentage_24h: 0,
      market_cap: 0,
      total_volume: 0,
      circulating_supply: 0,
      total_supply: 0,
      max_supply: null,
      ath: 0,
      ath_change_percentage: 0,
      ath_date: "",
      last_updated: "",
    }));
  } catch (error) {
    console.error("Error searching cryptocurrencies:", error);
    return [];
  }
};
