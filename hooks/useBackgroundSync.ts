import { AppState, AppStateStatus } from 'react-native';
import { BackgroundDataSyncService } from '../services/BackgroundDataSyncService';
import { logger } from '../utils/logger';
import { useEffect, useRef, useState } from 'react';


interface SyncStatus {
  isRunning: boolean;
  lastSyncAt: Date | null;
  lastError: string | null;
  syncCount: number;
  errorCount: number;
}

export const useBackgroundSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    lastSyncAt: null,
    lastError: null,
    syncCount: 0,
    errorCount: 0,
  });

  const [isEnabled, setIsEnabled] = useState(true);
  const syncServiceRef = useRef<BackgroundDataSyncService | null>(null);
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize the sync service
  useEffect(() => {
    const initService = async () => {
      try {
        const service = BackgroundDataSyncService.getInstance();
        syncServiceRef.current = service;

        // Start the service if enabled
        if (isEnabled) {
          await service.start();
        }

        // Start status polling
        startStatusPolling();

        logger.info('Background sync service initialized', 'useBackgroundSync');
      } catch (error) {
        logger.error('Failed to initialize background sync service', 'useBackgroundSync', error);
      }
    };

    initService();

    return () => {
      stopStatusPolling();
    };
  }, [isEnabled]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const service = syncServiceRef.current;
      if (!service) return;

      if (nextAppState === 'active') {
        // App became active - ensure sync is running
        if (isEnabled && !service.isServiceRunning()) {
          try {
            await service.start();
            logger.info('Background sync service restarted on app active', 'useBackgroundSync');
          } catch (error) {
            logger.error('Failed to restart background sync service', 'useBackgroundSync', error);
          }
        }
      } else if (nextAppState === 'background') {
        // App went to background - keep sync running but maybe reduce frequency
        logger.info('App went to background, keeping sync service running', 'useBackgroundSync');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isEnabled]);

  // Start polling for status updates
  const startStatusPolling = () => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
    }

    statusIntervalRef.current = setInterval(() => {
      const service = syncServiceRef.current;
      if (service) {
        setSyncStatus(service.getStatus());
      }
    }, 5000); // Update status every 5 seconds
  };

  // Stop status polling
  const stopStatusPolling = () => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
  };

  // Start the sync service
  const startSync = async () => {
    try {
      const service = syncServiceRef.current;
      if (service && !service.isServiceRunning()) {
        await service.start();
        setIsEnabled(true);
        logger.info('Background sync service started', 'useBackgroundSync');
      }
    } catch (error) {
      logger.error('Failed to start background sync service', 'useBackgroundSync', error);
    }
  };

  // Stop the sync service
  const stopSync = () => {
    try {
      const service = syncServiceRef.current;
      if (service && service.isServiceRunning()) {
        service.stop();
        setIsEnabled(false);
        logger.info('Background sync service stopped', 'useBackgroundSync');
      }
    } catch (error) {
      logger.error('Failed to stop background sync service', 'useBackgroundSync', error);
    }
  };

  // Force a manual sync
  const forceSync = async () => {
    try {
      const service = syncServiceRef.current;
      if (service) {
        await service.forceSync();
        logger.info('Manual sync completed', 'useBackgroundSync');
      }
    } catch (error) {
      logger.error('Failed to perform manual sync', 'useBackgroundSync', error);
    }
  };

  // Update sync configuration
  const updateConfig = (config: {
    intervalMs?: number;
    maxConcurrentUpdates?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
  }) => {
    try {
      const service = syncServiceRef.current;
      if (service) {
        service.updateConfig(config);
        logger.info('Sync configuration updated', 'useBackgroundSync', config);
      }
    } catch (error) {
      logger.error('Failed to update sync configuration', 'useBackgroundSync', error);
    }
  };

  // Toggle sync on/off
  const toggleSync = async () => {
    if (isEnabled) {
      stopSync();
    } else {
      await startSync();
    }
  };

  // Force restart the service (useful for development/testing)
  const forceRestart = async () => {
    try {
      // Stop current service
      stopSync();
      
      // Reset the singleton instance
      BackgroundDataSyncService.resetInstance();
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reinitialize the service
      const service = BackgroundDataSyncService.getInstance();
      syncServiceRef.current = service;
      
      // Start the service
      if (isEnabled) {
        await service.start();
      }
      
      logger.info('Background sync service force restarted', 'useBackgroundSync');
    } catch (error) {
      logger.error('Failed to force restart background sync service', 'useBackgroundSync', error);
    }
  };

  return {
    // State
    syncStatus,
    isEnabled,
    isRunning: syncStatus.isRunning,
    
    // Actions
    startSync,
    stopSync,
    forceSync,
    forceRestart,
    toggleSync,
    updateConfig,
    
    // Utility
    getService: () => syncServiceRef.current,
  };
}; 