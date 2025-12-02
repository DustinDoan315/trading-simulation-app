import AsyncStorage from '@react-native-async-storage/async-storage';
import UserRepository from './UserRepository';
import UUIDService from './UUIDService';
import { AppDispatch } from '../store';
import { DEFAULT_BALANCE } from '@/utils/constant';
import { log } from 'console';
import { resetBalance, setBalance } from '../features/balanceSlice';


/**
 * Functional service for interacting with cryptocurrency APIs and blockchain data
 * Designed for React Native + Web3 integration
 */

// Types for cryptocurrency data
export interface CryptoCurrency {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  circulating_supply: number;
  total_supply: number;
  circulating_percentage?: number;
  supply_inflation_rate?: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  last_updated: string;
  market_cap_change_percentage_24h: number;
  market_cap_change_24h: number;
  hot: boolean;
}

export interface UserBalance {
  usdtBalance: number; // Available USDT for trading
  totalPortfolioValue: number; // Total portfolio value including all assets
  holdings: {
    [key: string]: {
      amount: number;
      valueInUSD: number;
      symbol: string;
      name: string;
      image?: string;
      averageBuyPrice: number; // Average purchase price per token
      currentPrice: number; // Current market price
      profitLoss: number; // Unrealized profit/loss in USD
      profitLossPercentage: number; // Percentage gain/loss
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

// API Response Types
interface CoinSearchResult {
  id: string;
  symbol: string;
  name: string;
  large: string;
}

interface MarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  last_updated: string;
  market_cap_change_percentage_24h: number;
  market_cap_change_24h: number;
}

// Enhanced caching and rate limiting constants
const CACHE_EXPIRY_MS = 1000 * 60 * 15; // 15 minutes (increased from 5)
const STALE_CACHE_EXPIRY_MS = 1000 * 60 * 60 * 2; // 2 hours for stale data
const MARKET_DATA_CACHE_KEY = "@crypto_market_data";
const USER_BALANCE_CACHE_KEY = "@user_balance";
const PRICE_ALERTS_CACHE_KEY = "@price_alerts";
const RATE_LIMIT_CACHE_KEY = "@rate_limit_info";

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 50,
  maxRequestsPerHour: 1000,
  baseDelayMs: 1000,
  maxDelayMs: 300000, // 5 minutes
  exponentialBackoffFactor: 2,
};

// Request queue for preventing concurrent API calls
let requestQueue: Promise<any> | null = null;
let lastRequestTime = 0;
let consecutiveErrors = 0;

interface RateLimitInfo {
  lastRequestTime: number;
  requestCount: number;
  windowStart: number;
  consecutiveErrors: number;
  currentDelay: number;
}

/**
 * Get rate limit information from cache
 */
const getRateLimitInfo = async (): Promise<RateLimitInfo> => {
  try {
    const cached = await AsyncStorage.getItem(RATE_LIMIT_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error("Error reading rate limit info:", error);
  }
  
  return {
    lastRequestTime: 0,
    requestCount: 0,
    windowStart: Date.now(),
    consecutiveErrors: 0,
    currentDelay: RATE_LIMIT_CONFIG.baseDelayMs,
  };
};

/**
 * Update rate limit information
 */
const updateRateLimitInfo = async (info: RateLimitInfo): Promise<void> => {
  try {
    await AsyncStorage.setItem(RATE_LIMIT_CACHE_KEY, JSON.stringify(info));
  } catch (error) {
    console.error("Error updating rate limit info:", error);
  }
};

/**
 * Check if we should delay the request due to rate limiting
 */
const shouldDelayRequest = async (): Promise<number> => {
  const info = await getRateLimitInfo();
  const now = Date.now();
  
  // Reset window if more than 1 minute has passed
  if (now - info.windowStart > 60000) {
    info.requestCount = 0;
    info.windowStart = now;
  }
  
  // Check if we're within rate limits
  if (info.requestCount >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
    const timeToWait = 60000 - (now - info.windowStart);
    return Math.max(timeToWait, info.currentDelay);
  }
  
  // Apply exponential backoff if we have consecutive errors
  if (info.consecutiveErrors > 0) {
    return info.currentDelay;
  }
  
  return 0;
};

/**
 * Update rate limit info after request
 */
const updateRateLimitAfterRequest = async (success: boolean): Promise<void> => {
  const info = await getRateLimitInfo();
  const now = Date.now();
  
  info.lastRequestTime = now;
  info.requestCount++;
  
  if (success) {
    info.consecutiveErrors = 0;
    info.currentDelay = RATE_LIMIT_CONFIG.baseDelayMs;
  } else {
    info.consecutiveErrors++;
    info.currentDelay = Math.min(
      info.currentDelay * RATE_LIMIT_CONFIG.exponentialBackoffFactor,
      RATE_LIMIT_CONFIG.maxDelayMs
    );
  }
  
  await updateRateLimitInfo(info);
};

/**
 * Get cached market data if available and not expired
 *
 * @param ignoreExpiry - Whether to ignore cache expiry
 * @param useStaleData - Whether to use stale data if fresh data is not available
 * @returns Promise with cached data or null
 */
const getCachedMarketData = async (
  ignoreExpiry = false,
  useStaleData = false
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
      // If we can use stale data and it's within stale cache expiry, return it
      if (useStaleData && now - timestamp <= STALE_CACHE_EXPIRY_MS) {
        console.log("Using stale cached market data (within 2 hours)");
        return data;
      }
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
    
    console.log("Market data cached successfully");
  } catch (error) {
    console.error("Error caching market data:", error);
  }
};

/**
 * Execute API request with rate limiting and queuing
 */
const executeApiRequest = async <T>(
  requestFn: () => Promise<T>,
  context: string
): Promise<T> => {
  // Check if there's already a pending request
  if (requestQueue) {
    console.log(`${context}: Waiting for pending request to complete`);
    return requestQueue;
  }

  // Check rate limiting
  const delayMs = await shouldDelayRequest();
  if (delayMs > 0) {
    console.log(`${context}: Rate limited, waiting ${delayMs}ms`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  // Create new request promise
  requestQueue = (async () => {
    try {
      const result = await requestFn();
      await updateRateLimitAfterRequest(true);
      return result;
    } catch (error) {
      await updateRateLimitAfterRequest(false);
      throw error;
    } finally {
      requestQueue = null;
    }
  })();

  return requestQueue;
};

/**
 * Fetch cryptocurrency market data with enhanced caching and rate limiting
 *
 * @param forceRefresh - Whether to bypass cache and force a refresh
 * @param limit - Number of cryptocurrencies to fetch
 * @param includeSupplyMetrics - Whether to include supply metrics in the data
 * @returns Promise with cryptocurrency data
 */
export const getMarketData = async (
  forceRefresh = false,
  limit = 20,
  includeSupplyMetrics = true
): Promise<CryptoCurrency[]> => {
  try {
    // Try to get cached data first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = await getCachedMarketData();
      if (cachedData) {
        console.log("Using fresh cached market data");
        return cachedData;
      }
    }

    // Execute API request with rate limiting
    const data = await executeApiRequest(async () => {
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
          if (response.status === 429) {
            console.warn("CoinGecko API rate limit exceeded");
            throw new Error(`API rate limit exceeded (429)`);
          }
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data: CryptoCurrency[] = await response.json();

        // Enhance with supply metrics if requested
        const enhancedData = includeSupplyMetrics
          ? enhanceSupplyMetrics(data)
          : data;

        // Cache the enhanced data
        await cacheMarketData(enhancedData);

        console.log(`Successfully fetched ${data.length} market data entries from API`);
        return enhancedData;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error("Request timed out");
        }
        throw error;
      }
    }, "getMarketData");

    return data;
  } catch (error) {
    console.error("Error fetching market data:", error);

    // If online fetch fails, try to return cached data (including stale)
    const cachedData = await getCachedMarketData(true, true);
    if (cachedData) {
      console.log("Using cached market data as fallback");
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
    return await executeApiRequest(async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
      );

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("CoinGecko API rate limit exceeded");
          throw new Error(`API rate limit exceeded (429)`);
        }
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    }, `getCryptoDetails-${id}`);
  } catch (error) {
    console.error(`Error fetching details for ${id}:`, error);
    throw error;
  }
};

/**
 * Get detailed information for a specific cryptocurrency
 *
 * @param id - Cryptocurrency ID
 * @returns Promise with detailed cryptocurrency data
 */
export const getCoinData = async (id: string): Promise<any> => {
  try {
    return await executeApiRequest(async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}`
      );

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("CoinGecko API rate limit exceeded");
          throw new Error(`API rate limit exceeded (429)`);
        }
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    }, `getCoinData-${id}`);
  } catch (error) {
    console.error(`Error fetching details for ${id}:`, error);
    throw error;
  }
};

/**
 * Get detailed market data for a specific cryptocurrency
 *
 * @param id - Cryptocurrency ID
 * @returns Promise with detailed cryptocurrency data
 */
export const getCoinMarketData = async (id: string): Promise<any> => {
  console.log(`Fetching market data for ${id}`);

  try {
    return await executeApiRequest(async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}`
      );

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("CoinGecko API rate limit exceeded");
          throw new Error(`API rate limit exceeded (429)`);
        }
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    }, `getCoinMarketData-${id}`);
  } catch (error) {
    console.error(`Error fetching details for ${id}:`, error);
    throw error;
  }
};

/**
 * Get user's cryptocurrency holdings and balance
 *
 * @param dispatch - Redux dispatch function
 * @returns Promise with user balance data
 */
export const getUserBalance = async (): Promise<UserBalance> => {
  try {
    const uuid = await UUIDService.getOrCreateUser();
    const user = await UserRepository.getUser(uuid);

    return {
      usdtBalance: user ? parseFloat(user.usdt_balance) : DEFAULT_BALANCE,
      totalPortfolioValue: user ? parseFloat(user.total_portfolio_value) : DEFAULT_BALANCE,
      holdings: {}, // Holdings will be loaded separately
    };
  } catch (error) {
    console.error("Error getting user balance:", error);
    return {
      usdtBalance: DEFAULT_BALANCE,
      totalPortfolioValue: DEFAULT_BALANCE,
      holdings: {},
    };
  }
};

/**
 * Update user's cryptocurrency balance
 *
 * @param newBalance - Updated balance data
 */
export const updateUserBalance = async (
  newBalance: UserBalance
): Promise<void> => {
  try {
    const uuid = await UUIDService.getOrCreateUser();
    await UserRepository.updateUserBalance(uuid, newBalance.usdtBalance);
  } catch (error) {
    console.error("Error updating user balance:", error);
  }
};

/**
 * Reset user's balance to default values
 */
export const resetUserBalance = async (): Promise<void> => {
  try {
    const uuid = await UUIDService.getOrCreateUser();
    await UserRepository.updateUserBalance(uuid, DEFAULT_BALANCE);
  } catch (error) {
    console.error("Error resetting user balance:", error);
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
    return await executeApiRequest(async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`
      );

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("CoinGecko API rate limit exceeded");
          throw new Error(`API rate limit exceeded (429)`);
        }
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    }, `getPriceHistory-${id}-${days}`);
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
    totalValue: (balance.totalPortfolioValue || 0).toString(),
    usdtBalance: (balance.usdtBalance || 0).toString(),
    tokens: Object.entries(balance.holdings).map(([id, data]) => ({
      id,
      amount: (data.amount || 0).toString(),
      value: (data.valueInUSD || 0).toString(),
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

    return await executeApiRequest(async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(
          query
        )}`
      );

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("CoinGecko API rate limit exceeded");
          throw new Error(`API rate limit exceeded (429)`);
        }
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const coins: CoinSearchResult[] = data.coins || [];

      // Get market data for each coin to populate price information
      const coinIds = coins
        .slice(0, limit)
        .map((coin: CoinSearchResult) => coin.id)
        .join(",");
      
      const marketResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`
      );

      if (!marketResponse.ok) {
        if (marketResponse.status === 429) {
          console.warn("CoinGecko API rate limit exceeded");
          throw new Error(`API rate limit exceeded (429)`);
        }
        throw new Error(
          `Market data API request failed with status ${marketResponse.status}`
        );
      }

      const marketData: MarketData[] = await marketResponse.json();
      const marketDataMap = new Map(
        marketData.map((item: MarketData) => [item.id, item])
      );

      // Map to the same structure as our CryptoCurrency interface
      return coins.slice(0, limit).map((coin: CoinSearchResult) => {
        const marketInfo = marketDataMap.get(coin.id) as MarketData | undefined;
        return {
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          image: coin.large,
          current_price: marketInfo?.current_price || 0,
          price_change_percentage_24h:
            marketInfo?.price_change_percentage_24h || 0,
          market_cap: marketInfo?.market_cap || 0,
          total_volume: marketInfo?.total_volume || 0,
          circulating_supply: marketInfo?.circulating_supply || 0,
          total_supply: marketInfo?.total_supply || 0,
          max_supply: marketInfo?.max_supply || null,
          ath: marketInfo?.ath || 0,
          ath_change_percentage: marketInfo?.ath_change_percentage || 0,
          ath_date: marketInfo?.ath_date || "",
          last_updated: marketInfo?.last_updated || "",
          market_cap_rank: marketInfo?.market_cap_rank || 0,
          market_cap_change_percentage_24h:
            marketInfo?.market_cap_change_percentage_24h || 0,
          market_cap_change_24h: marketInfo?.market_cap_change_24h || 0,
          hot: false,
        };
      });
    }, `searchCryptocurrencies-${query}`);
  } catch (error) {
    console.error("Error searching cryptocurrencies:", error);
    return [];
  }
};

/**
 * Calculate additional supply metrics for cryptocurrencies
 *
 * @param cryptos - Array of cryptocurrency data
 * @returns Enhanced cryptocurrency data with additional metrics
 */
export const enhanceSupplyMetrics = (
  cryptos: CryptoCurrency[]
): CryptoCurrency[] => {
  return cryptos.map((crypto) => {
    // Calculate percentage of circulating supply vs total supply
    const circulating_percentage =
      crypto.total_supply > 0
        ? (crypto.circulating_supply / crypto.total_supply) * 100
        : 0;

    return {
      ...crypto,
      circulating_percentage: parseFloat(circulating_percentage.toFixed(2)),
    };
  });
};

/**
 * Get supply dilution metrics for a specific cryptocurrency
 *
 * @param id - Cryptocurrency ID
 * @returns Detailed supply metrics and dilution data
 */
export const getSupplyDilutionMetrics = async (
  id: string
): Promise<{
  currentSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  circulatingPercentage: number;
  remainingSupply: number | null;
  dilutionRisk: "None" | "Low" | "Medium" | "High";
  estimatedYearToFullDilution: number | null;
}> => {
  try {
    const cryptoDetails = await getCryptoDetails(id);
    const market_data = cryptoDetails.market_data;

    const currentSupply = market_data.circulating_supply || 0;
    const totalSupply = market_data.total_supply || 0;
    const maxSupply = market_data.max_supply;

    const circulatingPercentage =
      totalSupply > 0 ? (currentSupply / totalSupply) * 100 : 0;

    const remainingSupply =
      maxSupply !== null ? maxSupply - currentSupply : null;

    // Calculate dilution risk based on circulating percentage
    let dilutionRisk: "None" | "Low" | "Medium" | "High" = "None";
    if (maxSupply && currentSupply) {
      const percentageOfMax = (currentSupply / maxSupply) * 100;
      if (percentageOfMax >= 90) dilutionRisk = "None";
      else if (percentageOfMax >= 70) dilutionRisk = "Low";
      else if (percentageOfMax >= 40) dilutionRisk = "Medium";
      else dilutionRisk = "High";
    }

    // Estimate years to full dilution based on recent issuance rate
    // This is a simplified calculation that would need historical data
    const estimatedYearToFullDilution = null; // Would require historical data analysis

    return {
      currentSupply,
      totalSupply,
      maxSupply,
      circulatingPercentage: parseFloat(circulatingPercentage.toFixed(2)),
      remainingSupply,
      dilutionRisk,
      estimatedYearToFullDilution,
    };
  } catch (error) {
    console.error(`Error fetching supply metrics for ${id}:`, error);
    throw error;
  }
};
