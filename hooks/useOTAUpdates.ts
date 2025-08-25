import * as Updates from 'expo-updates';
import { Alert, Platform } from 'react-native';
import { useEffect, useState } from 'react';


interface UpdateInfo {
  isUpdatePending: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  updateAvailable: boolean;
  error: string | null;
  downloadProgress: number;
}

interface UseOTAUpdatesOptions {
  checkOnMount?: boolean;
  showUpdateAvailableAlert?: boolean;
  autoRestart?: boolean;
  checkInterval?: number; // in milliseconds
}

export const useOTAUpdates = (options: UseOTAUpdatesOptions = {}) => {
  const {
    checkOnMount = true,
    showUpdateAvailableAlert = true,
    autoRestart = false,
    checkInterval = 30000, // 30 seconds
  } = options;

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    isUpdatePending: false,
    isChecking: false,
    isDownloading: false,
    updateAvailable: false,
    error: null,
    downloadProgress: 0,
  });

  const checkForUpdates = async (): Promise<boolean> => {
    if (!Updates.isEnabled) {
      console.log('Updates are not enabled');
      return false;
    }

    try {
      setUpdateInfo(prev => ({ ...prev, isChecking: true, error: null }));
      
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        setUpdateInfo(prev => ({ 
          ...prev, 
          updateAvailable: true, 
          isChecking: false 
        }));
        
        if (showUpdateAvailableAlert) {
          showUpdateAlert();
        }
        
        return true;
      } else {
        setUpdateInfo(prev => ({ 
          ...prev, 
          updateAvailable: false, 
          isChecking: false 
        }));
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error checking for updates:', errorMessage);
      setUpdateInfo(prev => ({ 
        ...prev, 
        isChecking: false, 
        error: errorMessage 
      }));
      return false;
    }
  };

  const downloadAndInstallUpdate = async (): Promise<boolean> => {
    if (!Updates.isEnabled) {
      console.log('Updates are not enabled');
      return false;
    }

    try {
      setUpdateInfo(prev => ({ 
        ...prev, 
        isDownloading: true, 
        error: null,
        downloadProgress: 0
      }));

      // Download the update
      const downloadResult = await Updates.fetchUpdateAsync();
      
      if (downloadResult.isNew) {
        setUpdateInfo(prev => ({ 
          ...prev, 
          isDownloading: false,
          isUpdatePending: true,
          downloadProgress: 100
        }));

        if (autoRestart) {
          await Updates.reloadAsync();
        } else {
          showRestartAlert();
        }
        
        return true;
      } else {
        setUpdateInfo(prev => ({ 
          ...prev, 
          isDownloading: false,
          downloadProgress: 100
        }));
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error downloading update:', errorMessage);
      setUpdateInfo(prev => ({ 
        ...prev, 
        isDownloading: false, 
        error: errorMessage,
        downloadProgress: 0
      }));
      return false;
    }
  };

  const restartApp = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Error restarting app:', error);
    }
  };

  const showUpdateAlert = () => {
    Alert.alert(
      'Update Available',
      'A new version of the app is available. Would you like to download it now?',
      [
        {
          text: 'Later',
          style: 'cancel',
        },
        {
          text: 'Download',
          onPress: downloadAndInstallUpdate,
        },
      ]
    );
  };

  const showRestartAlert = () => {
    Alert.alert(
      'Update Downloaded',
      'The update has been downloaded. Restart the app to apply the changes.',
      [
        {
          text: 'Later',
          style: 'cancel',
        },
        {
          text: 'Restart Now',
          onPress: restartApp,
        },
      ]
    );
  };

  // Check for updates on mount
  useEffect(() => {
    if (checkOnMount && Platform.OS !== 'web') {
      checkForUpdates();
    }
  }, [checkOnMount]);

  // Set up interval checking
  useEffect(() => {
    if (checkInterval > 0 && Platform.OS !== 'web') {
      const interval = setInterval(() => {
        if (!updateInfo.isChecking && !updateInfo.isDownloading) {
          checkForUpdates();
        }
      }, checkInterval);

      return () => clearInterval(interval);
    }
  }, [checkInterval, updateInfo.isChecking, updateInfo.isDownloading]);

  return {
    ...updateInfo,
    checkForUpdates,
    downloadAndInstallUpdate,
    restartApp,
    isEnabled: Updates.isEnabled,
    channel: Updates.channel,
    updateId: Updates.updateId,
    createdAt: Updates.createdAt,
  };
};

export default useOTAUpdates;
