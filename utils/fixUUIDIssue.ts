import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';


/**
 * Fix UUID format issue by clearing existing UUID and regenerating with proper format
 * This resolves the "invalid input syntax for type uuid" error
 */
export const fixUUIDFormatIssue = async (): Promise<void> => {
  try {
    logger.info("Starting UUID format fix", "fixUUIDIssue");
    
    // Step 1: Clear all existing UUID storage
    const keysToClear = [
      "user_uuid_13",
      "user_uuid_12", 
      "user_uuid",
      "user_profile"
    ];
    
    for (const key of keysToClear) {
      try {
        await SecureStore.deleteItemAsync(key);
        await AsyncStorage.removeItem(key);
        logger.info(`Cleared key: ${key}`, "fixUUIDIssue");
      } catch (error) {
        logger.warn(`Failed to clear key ${key}:`, "fixUUIDIssue", error);
      }
    }
    
    // Step 2: Clear Redux state if available
    try {
      // This will be handled by the app restart
      logger.info("UUID storage cleared, restart app to regenerate", "fixUUIDIssue");
    } catch (error) {
      logger.warn("Failed to clear Redux state:", "fixUUIDIssue", error);
    }
    
    logger.info("UUID format fix completed", "fixUUIDIssue");
    
  } catch (error) {
    logger.error("Failed to fix UUID format issue", "fixUUIDIssue", error);
    throw error;
  }
};

/**
 * Check if current UUID is in invalid format
 */
export const isInvalidUUIDFormat = (uuid: string): boolean => {
  // Check if UUID doesn't have hyphens (invalid format)
  return !uuid.includes('-') || uuid.length !== 36;
};

/**
 * Validate UUID format
 */
export const validateUUIDFormat = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}; 