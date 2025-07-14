import { configService } from "./config";
import { logger } from "./logger";

/**
 * Initialize all app-wide services and configuration
 */
export async function initializeApp(): Promise<void> {
  try {
    logger.info("Starting app initialization...", "initializeApp");

    // Initialize configuration service
    await configService.initialize();

    // Set up the API key if not already configured
    await setupApiKey();

    logger.info("App initialization completed successfully", "initializeApp");
  } catch (error) {
    logger.error("Failed to initialize app", "initializeApp", error);
    throw error;
  }
}

/**
 * Set up the API key securely
 */
async function setupApiKey(): Promise<void> {
  try {
    const currentApiKey = configService.get("NEWS_API_KEY");

    if (!currentApiKey) {
      // Set the API key securely
      await configService.set(
        "NEWS_API_KEY",
        "0b2bddf9eef5407eb519f8b389b06c38"
      );
      logger.info("API key configured securely", "initializeApp");
    } else {
      logger.info("API key already configured", "initializeApp");
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
