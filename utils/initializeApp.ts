import { configService } from './config';
import { logger } from './logger';

export async function initializeApp(): Promise<void> {
  try {
    logger.info("Starting app initialization...", "initializeApp");


    await configService.initialize();


    await configService.testConfiguration();

    await setupApiKey();

    logger.info("App initialization completed successfully", "initializeApp");
  } catch (error) {
    logger.error("Failed to initialize app", "initializeApp", error);
    throw error;
  }
}


export async function waitForAppInitialization(timeoutMs: number = 10000): Promise<void> {
  const startTime = Date.now();
  
  while (!isAppInitialized()) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error("App initialization timeout");
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}


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

  }
}

export function isAppInitialized(): boolean {
  return configService.isReady();
}

export function getAppDebugInfo() {
  return {
    configReady: configService.isReady(),
    configDebug: configService.getConfigForDebug(),
  };
}
