import { Alert, Linking, Platform } from 'react-native';
import { Camera, PermissionStatus } from 'expo-camera';

export interface CameraPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  denied: boolean;
}

export const requestCameraPermission = async (): Promise<CameraPermissionResult> => {
  try {
    const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
    return {
      granted: status === PermissionStatus.GRANTED,
      canAskAgain,
      denied: status === PermissionStatus.DENIED
    };
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return {
      granted: false,
      canAskAgain: false,
      denied: true
    };
  }
};

export const checkCameraPermission = async (): Promise<CameraPermissionResult> => {
  try {
    const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();
    return {
      granted: status === PermissionStatus.GRANTED,
      canAskAgain,
      denied: status === PermissionStatus.DENIED
    };
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return {
      granted: false,
      canAskAgain: false,
      denied: true
    };
  }
};

export const showCameraPermissionAlert = (
  onRetry?: () => void,
  onOpenSettings?: () => void
) => {
  Alert.alert(
    "Camera Permission Required",
    "This app needs camera access to scan QR codes. Please enable camera permissions in your device settings.",
    [
      { text: "Cancel", style: "cancel" },
      ...(onRetry ? [{ text: "Try Again", onPress: onRetry }] : []),
      {
        text: "Open Settings",
        onPress: () => {
          if (onOpenSettings) {
            onOpenSettings();
          } else {
            openDeviceSettings();
          }
        }
      }
    ]
  );
};

export const openDeviceSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
};

export const handleCameraPermissionFlow = async (
  onPermissionGranted: () => void,
  onPermissionDenied: () => void,
  showAlert: boolean = true
): Promise<boolean> => {
  const permission = await requestCameraPermission();
  if (permission.granted) {
    onPermissionGranted();
    return true;
  } else {
    onPermissionDenied();
    if (showAlert && !permission.canAskAgain) {
      showCameraPermissionAlert(
        () => handleCameraPermissionFlow(onPermissionGranted, onPermissionDenied, false),
        openDeviceSettings
      );
    }
    return false;
  }
}; 