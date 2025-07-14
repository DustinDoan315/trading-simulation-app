import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { logger } from "./logger";

// Configuration interface
interface AppConfig {
  NEWS_API_KEY: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  ENVIRONMENT: "development" | "staging" | "production";
}

// Default configuration (fallback)
const DEFAULT_CONFIG: AppConfig = {
  NEWS_API_KEY: "",
  ENVIRONMENT: "development",
};

// Configuration keys for SecureStore
const SECURE_KEYS = {
  NEWS_API_KEY: "news_api_key",
  SUPABASE_URL: "supabase_url",
  SUPABASE_ANON_KEY: "supabase_anon_key",
};

class ConfigService {
  private config: AppConfig = { ...DEFAULT_CONFIG };
  private isInitialized = false;

  /**
   * Initialize configuration from multiple sources
   */
  async initialize(): Promise<void> {
    try {
      // 1. Try to load from environment variables (Expo Constants)
      await this.loadFromEnvironment();

      // 2. Try to load from SecureStore (for sensitive data)
      await this.loadFromSecureStore();

      // 3. Validate configuration
      this.validateConfig();

      this.isInitialized = true;
      logger.info("Configuration initialized successfully", "ConfigService");
    } catch (error) {
      logger.error(
        "Failed to initialize configuration",
        "ConfigService",
        error
      );
      throw error;
    }
  }

  /**
   * Load configuration from environment variables
   */
  private async loadFromEnvironment(): Promise<void> {
    try {
      const expoConfig = Constants.expoConfig;
      const extra = expoConfig?.extra || {};

      // Load from Expo Constants extra
      if (extra.NEWS_API_KEY) {
        this.config.NEWS_API_KEY = extra.NEWS_API_KEY;
        logger.info("Loaded NEWS_API_KEY from environment", "ConfigService");
      }

      if (extra.SUPABASE_URL) {
        this.config.SUPABASE_URL = extra.SUPABASE_URL;
      }

      if (extra.SUPABASE_ANON_KEY) {
        this.config.SUPABASE_ANON_KEY = extra.SUPABASE_ANON_KEY;
      }

      if (extra.ENVIRONMENT) {
        this.config.ENVIRONMENT = extra.ENVIRONMENT;
      }
    } catch (error) {
      logger.warn(
        "Failed to load from environment variables",
        "ConfigService",
        error
      );
    }
  }

  /**
   * Load sensitive configuration from SecureStore
   */
  private async loadFromSecureStore(): Promise<void> {
    try {
      // Load API keys from SecureStore
      const newsApiKey = await SecureStore.getItemAsync(
        SECURE_KEYS.NEWS_API_KEY
      );
      if (newsApiKey) {
        this.config.NEWS_API_KEY = newsApiKey;
        logger.info("Loaded NEWS_API_KEY from SecureStore", "ConfigService");
      }

      const supabaseUrl = await SecureStore.getItemAsync(
        SECURE_KEYS.SUPABASE_URL
      );
      if (supabaseUrl) {
        this.config.SUPABASE_URL = supabaseUrl;
      }

      const supabaseKey = await SecureStore.getItemAsync(
        SECURE_KEYS.SUPABASE_ANON_KEY
      );
      if (supabaseKey) {
        this.config.SUPABASE_ANON_KEY = supabaseKey;
      }
    } catch (error) {
      logger.warn("Failed to load from SecureStore", "ConfigService", error);
    }
  }

  /**
   * Validate the configuration
   */
  private validateConfig(): void {
    const requiredKeys = ["NEWS_API_KEY"];
    const missingKeys = requiredKeys.filter(
      (key) => !this.config[key as keyof AppConfig]
    );

    if (missingKeys.length > 0) {
      logger.warn(
        `Missing required configuration keys: ${missingKeys.join(", ")}`,
        "ConfigService"
      );
    }
  }

  /**
   * Get configuration value
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    if (!this.isInitialized) {
      logger.warn(
        "Configuration not initialized, returning default value",
        "ConfigService"
      );
    }
    return this.config[key];
  }

  /**
   * Set configuration value (for runtime updates)
   */
  async set<K extends keyof AppConfig>(
    key: K,
    value: AppConfig[K]
  ): Promise<void> {
    this.config[key] = value;

    // Store sensitive data in SecureStore
    if (key === "NEWS_API_KEY") {
      await SecureStore.setItemAsync(SECURE_KEYS.NEWS_API_KEY, value as string);
    } else if (key === "SUPABASE_URL") {
      await SecureStore.setItemAsync(SECURE_KEYS.SUPABASE_URL, value as string);
    } else if (key === "SUPABASE_ANON_KEY") {
      await SecureStore.setItemAsync(
        SECURE_KEYS.SUPABASE_ANON_KEY,
        value as string
      );
    }

    logger.info(`Configuration updated: ${key}`, "ConfigService");
  }

  /**
   * Check if configuration is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get all configuration (for debugging, without sensitive data)
   */
  getConfigForDebug(): Partial<AppConfig> {
    const { NEWS_API_KEY, SUPABASE_ANON_KEY, ...safeConfig } = this.config;
    return {
      ...safeConfig,
      NEWS_API_KEY: NEWS_API_KEY ? "***" : "",
      SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? "***" : "",
    };
  }

  /**
   * Clear all stored configuration
   */
  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEYS.NEWS_API_KEY);
      await SecureStore.deleteItemAsync(SECURE_KEYS.SUPABASE_URL);
      await SecureStore.deleteItemAsync(SECURE_KEYS.SUPABASE_ANON_KEY);

      this.config = { ...DEFAULT_CONFIG };
      this.isInitialized = false;

      logger.info("Configuration cleared", "ConfigService");
    } catch (error) {
      logger.error("Failed to clear configuration", "ConfigService", error);
    }
  }
}

// Export singleton instance
export const configService = new ConfigService();

// Export types
export type { AppConfig };
