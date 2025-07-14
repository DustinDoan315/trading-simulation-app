import AsyncStorage from '@react-native-async-storage/async-storage';
import { CryptoCurrency, getMarketData } from './CryptoService';


/**
 * Enhanced Crypto Service with advanced caching and rate limiting
 * This service provides better handling of CoinGecko API limitations
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

interface CacheConfig {
  key: string;
  ttl: number; // Time to live in milliseconds
  staleTtl: number; // Stale time to live in milliseconds
  version: string; // Cache version for invalidation
}

// Cache configurations
const CACHE_CONFIGS = {
  marketData: {
    key: '@enhanced_market_data',
    ttl: 1000 * 60 * 15, // 15 minutes
    staleTtl: 1000 * 60 * 60 * 2, // 2 hours
    version: '1.0.0',
  },
  priceHistory: {
    key: '@enhanced_price_history',
    ttl: 1000 * 60 * 30, // 30 minutes
    staleTtl: 1000 * 60 * 60 * 4, // 4 hours
    version: '1.0.0',
  },
  cryptoDetails: {
    key: '@enhanced_crypto_details',
    ttl: 1000 * 60 * 60, // 1 hour
    staleTtl: 1000 * 60 * 60 * 6, // 6 hours
    version: '1.0.0',
  },
} as const;

/**
 * Generic cache manager
 */
class CacheManager {
  /**
   * Get data from cache
   */
  static async get<T>(config: CacheConfig, useStale = false): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(config.key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();

      // Check version
      if (entry.version !== config.version) {
        console.log(`Cache version mismatch for ${config.key}, clearing`);
        await this.clear(config.key);
        return null;
      }

      // Check if cache is expired
      if (now - entry.timestamp > config.ttl) {
        if (useStale && now - entry.timestamp <= config.staleTtl) {
          console.log(`Using stale cache for ${config.key}`);
          return entry.data;
        }
        return null;
      }

      console.log(`Using fresh cache for ${config.key}`);
      return entry.data;
    } catch (error) {
      console.error(`Error reading cache for ${config.key}:`, error);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  static async set<T>(config: CacheConfig, data: T): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: config.version,
      };

      await AsyncStorage.setItem(config.key, JSON.stringify(entry));
      console.log(`Cached data for ${config.key}`);
    } catch (error) {
      console.error(`Error caching data for ${config.key}:`, error);
    }
  }

  /**
   * Clear specific cache
   */
  static async clear(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`Cleared cache for ${key}`);
    } catch (error) {
      console.error(`Error clearing cache for ${key}:`, error);
    }
  }

  /**
   * Clear all enhanced caches
   */
  static async clearAll(): Promise<void> {
    try {
      const keys = Object.values(CACHE_CONFIGS).map(config => config.key);
      await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
      console.log('Cleared all enhanced caches');
    } catch (error) {
      console.error('Error clearing all caches:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<Record<string, { size: number; age: number }>> {
    const stats: Record<string, { size: number; age: number }> = {};
    
    try {
      for (const [name, config] of Object.entries(CACHE_CONFIGS)) {
        const cached = await AsyncStorage.getItem(config.key);
        if (cached) {
          const entry: CacheEntry<any> = JSON.parse(cached);
          const age = Date.now() - entry.timestamp;
          stats[name] = {
            size: cached.length,
            age,
          };
        }
      }
    } catch (error) {
      console.error('Error getting cache stats:', error);
    }
    
    return stats;
  }
}

/**
 * Enhanced market data service with intelligent caching
 */
export class EnhancedCryptoService {
  private static instance: EnhancedCryptoService;
  private lastMarketDataUpdate = 0;
  private updateInterval = 30000; // 30 seconds
  private isUpdating = false;

  private constructor() {}

  static getInstance(): EnhancedCryptoService {
    if (!EnhancedCryptoService.instance) {
      EnhancedCryptoService.instance = new EnhancedCryptoService();
    }
    return EnhancedCryptoService.instance;
  }

  /**
   * Get market data with enhanced caching
   */
  async getMarketData(
    forceRefresh = false,
    limit = 50,
    includeSupplyMetrics = true
  ): Promise<CryptoCurrency[]> {
    try {
      // Try to get cached data first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = await CacheManager.get<CryptoCurrency[]>(
          CACHE_CONFIGS.marketData
        );
        if (cachedData) {
          return cachedData;
        }
      }

      // Check if we should update based on time interval
      const now = Date.now();
      if (!forceRefresh && now - this.lastMarketDataUpdate < this.updateInterval) {
        const staleData = await CacheManager.get<CryptoCurrency[]>(
          CACHE_CONFIGS.marketData,
          true // Use stale data
        );
        if (staleData) {
          console.log('Using stale market data due to update interval');
          return staleData;
        }
      }

      // Fetch fresh data
      console.log('Fetching fresh market data from API');
      const marketData = await getMarketData(true, limit, includeSupplyMetrics);
      
      // Cache the fresh data
      await CacheManager.set(CACHE_CONFIGS.marketData, marketData);
      this.lastMarketDataUpdate = now;

      return marketData;
    } catch (error) {
      console.error('Error in enhanced market data fetch:', error);
      
      // Try to return stale cached data as fallback
      const staleData = await CacheManager.get<CryptoCurrency[]>(
        CACHE_CONFIGS.marketData,
        true
      );
      
      if (staleData) {
        console.log('Using stale market data as fallback');
        return staleData;
      }

      throw error;
    }
  }

  /**
   * Get price history with enhanced caching
   */
  async getPriceHistory(
    id: string,
    days = 7
  ): Promise<{ prices: [number, number][] }> {
    const cacheKey = `${CACHE_CONFIGS.priceHistory.key}_${id}_${days}`;
    const config = { ...CACHE_CONFIGS.priceHistory, key: cacheKey };

    try {
      // Try to get cached data first
      const cachedData = await CacheManager.get<{ prices: [number, number][] }>(config);
      if (cachedData) {
        return cachedData;
      }

      // Import the function dynamically to avoid circular dependencies
      const { getPriceHistory } = await import('./CryptoService');
      
      console.log(`Fetching fresh price history for ${id} (${days} days)`);
      const priceHistory = await getPriceHistory(id, days);
      
      // Cache the data
      await CacheManager.set(config, priceHistory);
      
      return priceHistory;
    } catch (error) {
      console.error(`Error fetching price history for ${id}:`, error);
      
      // Try to return stale cached data as fallback
      const staleData = await CacheManager.get<{ prices: [number, number][] }>(
        config,
        true
      );
      
      if (staleData) {
        console.log(`Using stale price history for ${id} as fallback`);
        return staleData;
      }

      throw error;
    }
  }

  /**
   * Get crypto details with enhanced caching
   */
  async getCryptoDetails(id: string): Promise<any> {
    const cacheKey = `${CACHE_CONFIGS.cryptoDetails.key}_${id}`;
    const config = { ...CACHE_CONFIGS.cryptoDetails, key: cacheKey };

    try {
      // Try to get cached data first
      const cachedData = await CacheManager.get<any>(config);
      if (cachedData) {
        return cachedData;
      }

      // Import the function dynamically to avoid circular dependencies
      const { getCryptoDetails } = await import('./CryptoService');
      
      console.log(`Fetching fresh crypto details for ${id}`);
      const details = await getCryptoDetails(id);
      
      // Cache the data
      await CacheManager.set(config, details);
      
      return details;
    } catch (error) {
      console.error(`Error fetching crypto details for ${id}:`, error);
      
      // Try to return stale cached data as fallback
      const staleData = await CacheManager.get<any>(config, true);
      
      if (staleData) {
        console.log(`Using stale crypto details for ${id} as fallback`);
        return staleData;
      }

      throw error;
    }
  }

  /**
   * Start background updates
   */
  startBackgroundUpdates(): void {
    if (this.isUpdating) {
      console.log('Background updates already running');
      return;
    }

    this.isUpdating = true;
    console.log('Starting enhanced crypto service background updates');

    // Initial update
    this.performBackgroundUpdate();

    // Set up interval
    setInterval(() => {
      this.performBackgroundUpdate();
    }, this.updateInterval);
  }

  /**
   * Stop background updates
   */
  stopBackgroundUpdates(): void {
    this.isUpdating = false;
    console.log('Stopped enhanced crypto service background updates');
  }

  /**
   * Perform background update
   */
  private async performBackgroundUpdate(): Promise<void> {
    if (!this.isUpdating) return;

    try {
      console.log('Performing background market data update');
      await this.getMarketData(false, 50, true);
    } catch (error) {
      console.error('Background update failed:', error);
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    await CacheManager.clearAll();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<Record<string, { size: number; age: number }>> {
    return await CacheManager.getStats();
  }

  /**
   * Update cache configuration
   */
  updateCacheConfig(
    cacheType: keyof typeof CACHE_CONFIGS,
    updates: Partial<CacheConfig>
  ): void {
    if (CACHE_CONFIGS[cacheType]) {
      Object.assign(CACHE_CONFIGS[cacheType], updates);
      console.log(`Updated cache config for ${cacheType}`);
    }
  }
}

// Export singleton instance
export const enhancedCryptoService = EnhancedCryptoService.getInstance(); 