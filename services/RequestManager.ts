import { logger } from "../utils/logger";
// services/RequestManager.ts

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

export class RequestManager {
  private static instance: RequestManager;
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private readonly CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

  private constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  static getInstance(): RequestManager {
    if (!RequestManager.instance) {
      RequestManager.instance = new RequestManager();
    }
    return RequestManager.instance;
  }

  /**
   * Execute a request with deduplication and caching
   */
  async executeRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    // Check cache first
    const cached = this.getFromCache<T>(key);
    if (cached) {
      logger.debug("Request served from cache", "RequestManager", { key });
      return cached;
    }

    // Check if there's a pending request
    const pending = this.pendingRequests.get(key);
    if (pending) {
      logger.debug("Request deduplicated", "RequestManager", { key });
      return pending.promise;
    }

    // Execute new request
    logger.debug("Executing new request", "RequestManager", { key });
    const promise = this.executeNewRequest(key, requestFn, ttl);
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Execute a new request and cache the result
   */
  private async executeNewRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      const data = await requestFn();

      // Cache the result
      this.setCache(key, data, ttl);

      logger.debug("Request completed successfully", "RequestManager", { key });
      return data;
    } catch (error) {
      logger.error("Request failed", "RequestManager", { key, error });
      throw error;
    }
  }

  /**
   * Get data from cache if it's still valid
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    // Check cache size limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Evict oldest cache entries
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest 20% of entries
    const toRemove = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Clean up expired cache entries and old pending requests
   */
  private cleanup(): void {
    const now = Date.now();

    // Clean up expired cache entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }

    // Clean up old pending requests (older than 30 seconds)
    for (const [key, pending] of this.pendingRequests.entries()) {
      if (now - pending.timestamp > 30000) {
        this.pendingRequests.delete(key);
      }
    }

    logger.debug("Cache cleanup completed", "RequestManager", {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
    });
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info("Cache cleared", "RequestManager");
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      maxCacheSize: this.MAX_CACHE_SIZE,
    };
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    logger.debug("Cache entry invalidated", "RequestManager", { key });
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    logger.debug("Cache entries invalidated by pattern", "RequestManager", {
      pattern: pattern.toString(),
      count,
    });
  }
}

export const requestManager = RequestManager.getInstance();
