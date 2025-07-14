import AsyncStorage from '@react-native-async-storage/async-storage';
import { enhancedCryptoService } from '@/services/EnhancedCryptoService';

/**
 * Cache management utilities for monitoring and debugging
 */

export interface CacheInfo {
  key: string;
  size: number;
  age: number;
  isExpired: boolean;
  isStale: boolean;
}

export interface CacheSummary {
  totalEntries: number;
  totalSize: number;
  expiredEntries: number;
  staleEntries: number;
  freshEntries: number;
  entries: CacheInfo[];
}

/**
 * Get detailed information about all cached data
 */
export const getCacheInfo = async (): Promise<CacheSummary> => {
  const cacheKeys = [
    '@crypto_market_data',
    '@enhanced_market_data',
    '@enhanced_price_history',
    '@enhanced_crypto_details',
    '@rate_limit_info',
  ];

  const entries: CacheInfo[] = [];
  let totalSize = 0;
  let expiredEntries = 0;
  let staleEntries = 0;
  let freshEntries = 0;

  for (const key of cacheKeys) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        const age = Date.now() - (data.timestamp || 0);
        const size = cached.length;
        totalSize += size;

        // Determine cache status based on age
        let isExpired = false;
        let isStale = false;

        if (key === '@crypto_market_data' || key === '@enhanced_market_data') {
          isExpired = age > 15 * 60 * 1000; // 15 minutes
          isStale = age > 2 * 60 * 60 * 1000; // 2 hours
        } else if (key === '@enhanced_price_history') {
          isExpired = age > 30 * 60 * 1000; // 30 minutes
          isStale = age > 4 * 60 * 60 * 1000; // 4 hours
        } else if (key === '@enhanced_crypto_details') {
          isExpired = age > 60 * 60 * 1000; // 1 hour
          isStale = age > 6 * 60 * 60 * 1000; // 6 hours
        }

        if (isExpired) {
          expiredEntries++;
        } else if (isStale) {
          staleEntries++;
        } else {
          freshEntries++;
        }

        entries.push({
          key,
          size,
          age,
          isExpired,
          isStale,
        });
      }
    } catch (error) {
      console.error(`Error reading cache info for ${key}:`, error);
    }
  }

  return {
    totalEntries: entries.length,
    totalSize,
    expiredEntries,
    staleEntries,
    freshEntries,
    entries,
  };
};

/**
 * Clear all cached data
 */
export const clearAllCaches = async (): Promise<void> => {
  try {
    await enhancedCryptoService.clearAllCaches();
    console.log('All caches cleared successfully');
  } catch (error) {
    console.error('Error clearing caches:', error);
  }
};

/**
 * Clear specific cache by key
 */
export const clearCache = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`Cache cleared for key: ${key}`);
  } catch (error) {
    console.error(`Error clearing cache for ${key}:`, error);
  }
};

/**
 * Get cache statistics in a human-readable format
 */
export const getCacheStats = async (): Promise<string> => {
  try {
    const summary = await getCacheInfo();
    const stats = await enhancedCryptoService.getCacheStats();
    
    let result = '=== Cache Statistics ===\n';
    result += `Total Entries: ${summary.totalEntries}\n`;
    result += `Total Size: ${(summary.totalSize / 1024).toFixed(2)} KB\n`;
    result += `Fresh Entries: ${summary.freshEntries}\n`;
    result += `Stale Entries: ${summary.staleEntries}\n`;
    result += `Expired Entries: ${summary.expiredEntries}\n\n`;
    
    result += '=== Detailed Cache Info ===\n';
    summary.entries.forEach(entry => {
      const ageMinutes = Math.floor(entry.age / (1000 * 60));
      const sizeKB = (entry.size / 1024).toFixed(2);
      const status = entry.isExpired ? 'EXPIRED' : entry.isStale ? 'STALE' : 'FRESH';
      result += `${entry.key}: ${sizeKB}KB, ${ageMinutes}m old, ${status}\n`;
    });
    
    result += '\n=== Enhanced Service Stats ===\n';
    Object.entries(stats).forEach(([name, stat]) => {
      const ageMinutes = Math.floor(stat.age / (1000 * 60));
      const sizeKB = (stat.size / 1024).toFixed(2);
      result += `${name}: ${sizeKB}KB, ${ageMinutes}m old\n`;
    });
    
    return result;
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return 'Error getting cache statistics';
  }
};

/**
 * Monitor cache performance and log issues
 */
export const monitorCacheHealth = async (): Promise<void> => {
  try {
    const summary = await getCacheInfo();
    
    // Log cache health status
    if (summary.expiredEntries > 0) {
      console.warn(`Cache Health: ${summary.expiredEntries} expired entries found`);
    }
    
    if (summary.staleEntries > 0) {
      console.info(`Cache Health: ${summary.staleEntries} stale entries found`);
    }
    
    if (summary.freshEntries > 0) {
      console.log(`Cache Health: ${summary.freshEntries} fresh entries available`);
    }
    
    // Log total cache size
    const totalSizeMB = summary.totalSize / (1024 * 1024);
    if (totalSizeMB > 10) {
      console.warn(`Cache Health: Large cache size detected (${totalSizeMB.toFixed(2)} MB)`);
    }
    
  } catch (error) {
    console.error('Error monitoring cache health:', error);
  }
};

/**
 * Force refresh all cached data
 */
export const forceRefreshAllCaches = async (): Promise<void> => {
  try {
    console.log('Force refreshing all caches...');
    
    // Clear existing caches
    await clearAllCaches();
    
    // Force refresh market data
    await enhancedCryptoService.getMarketData(true, 50, true);
    
    console.log('All caches refreshed successfully');
  } catch (error) {
    console.error('Error force refreshing caches:', error);
  }
};

/**
 * Export cache data for debugging
 */
export const exportCacheData = async (): Promise<string> => {
  try {
    const summary = await getCacheInfo();
    const stats = await enhancedCryptoService.getCacheStats();
    
    const exportData = {
      timestamp: new Date().toISOString(),
      summary,
      stats,
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting cache data:', error);
    return 'Error exporting cache data';
  }
}; 