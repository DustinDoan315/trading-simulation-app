import * as Application from 'expo-application';
import { Platform } from 'react-native';

export const getDeviceUUID = async (): Promise<string> => {
  if (Platform.OS === 'ios') {
    return await Application.getIosIdForVendorAsync() || 'fallback-ios-uuid';
  } else {
    return Application.getAndroidId() || 'fallback-android-uuid';
  }
}; 