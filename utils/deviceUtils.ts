import * as Application from 'expo-application';
import { Platform } from 'react-native';


export const getDeviceUUID = async (): Promise<string> => {
  let deviceId: string;
  
  if (Platform.OS === 'ios') {
    deviceId = await Application.getIosIdForVendorAsync() || 'fallback-ios-uuid';
  } else {
    deviceId = Application.getAndroidId() || 'fallback-android-uuid';
  }
  
  // Convert device ID to proper UUID format with hyphens
  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const cleanId = deviceId.replace(/[^a-f0-9]/gi, '').toLowerCase();
  
  // Ensure we have at least 32 characters, pad with zeros if needed
  let paddedId = cleanId.padEnd(32, '0');
  
  // If longer than 32 characters, truncate
  if (paddedId.length > 32) {
    paddedId = paddedId.substring(0, 32);
  }
  
  // Format as UUID with hyphens
  const uuid = [
    paddedId.substring(0, 8),
    paddedId.substring(8, 12),
    paddedId.substring(12, 16),
    paddedId.substring(16, 20),
    paddedId.substring(20, 32)
  ].join('-');
  
  return uuid;
}; 