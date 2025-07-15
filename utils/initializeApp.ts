import { configService } from './config';
import { logger } from './logger';

/**
 * Initialize all app-wide services and configuration
 */
export async function initializeApp(): Promise<void> {
  try {
    logger.info("Starting app initialization...", "initializeApp");

    // Initialize configuration service
    await configService.initialize();

    // Test configuration
    await configService.testConfiguration();

    // Set up the API key if not already configured
    await setupApiKey();

    logger.info("App initialization completed successfully", "initializeApp");
  } catch (error) {
    logger.error("Failed to initialize app", "initializeApp", error);
    throw error;
  }
}

/**
 * Wait for app to be fully initialized
 * @param timeoutMs - Maximum time to wait in milliseconds (default: 10000ms)
 * @returns Promise that resolves when app is ready or rejects on timeout
 */
export async function waitForAppInitialization(timeoutMs: number = 10000): Promise<void> {
  const startTime = Date.now();
  
  while (!isAppInitialized()) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error("App initialization timeout");
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Set up the API key securely
 */
async function setupApiKey(): Promise<void> {
  try {
    const currentApiKey = configService.get("NEWS_API_KEY");

    if (!currentApiKey) {
      logger.warn("No NEWS_API_KEY found in environment configuration", "initializeApp");
      logger.info("Please ensure NEWS_API_KEY is set in your .env file or app.json", "initializeApp");
    } else {
      logger.info("API key configured from environment", "initializeApp");
    }
  } catch (error) {
    logger.error("Failed to setup API key", "initializeApp", error);
    // Don't throw here, as the app can still work with fallback data
  }
}

/**
 * Check if the app is properly initialized
 */
export function isAppInitialized(): boolean {
  return configService.isReady();
}

/**
 * Get debug information about the app configuration
 */
export function getAppDebugInfo() {
  return {
    configReady: configService.isReady(),
    configDebug: configService.getConfigForDebug(),
  };
}
