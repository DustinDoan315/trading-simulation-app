import { SyncService } from '@/services/SupabaseService';
import { useCallback, useEffect, useState } from 'react';
import { useNotification } from '@/components/ui/Notification';


export interface SyncStatus {
  lastSyncAt: string | null;
  syncStatus: Record<string, { status: string; lastError?: string; lastSyncAt: string }>;
  hasPendingOperations: boolean;
  isLoading: boolean;
}

export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncAt: null,
    syncStatus: {},
    hasPendingOperations: false,
    isLoading: true,
  });
  const { showNotification } = useNotification();

  const refreshSyncStatus = useCallback(async () => {
    try {
      setSyncStatus(prev => ({ ...prev, isLoading: true }));
      const status = await SyncService.getDetailedSyncStatus();
      setSyncStatus({ ...status, isLoading: false });
    } catch (error) {
      console.error('Failed to refresh sync status:', error);
      setSyncStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const checkForSyncIssues = useCallback(() => {
    const { syncStatus: statusData, hasPendingOperations } = syncStatus;
    
    // Check for failed syncs
    const failedSyncs = Object.entries(statusData).filter(([_, data]) => data.status === 'failed');
    
    if (failedSyncs.length > 0) {
      const failedOperations = failedSyncs.map(([operation]) => operation).join(', ');
      showNotification({
        type: 'error',
        message: `Some data sync operations failed: ${failedOperations}. Data will be retried when connection is restored.`,
      });
    }

    // Check for pending operations
    if (hasPendingOperations) {
      showNotification({
        type: 'info',
        message: 'Some operations are queued for sync when connection is restored.',
      });
    }
  }, [syncStatus, showNotification]);

  useEffect(() => {
    refreshSyncStatus();
  }, [refreshSyncStatus]);

  useEffect(() => {
    // Check for sync issues when status changes
    if (!syncStatus.isLoading) {
      checkForSyncIssues();
    }
  }, [syncStatus, checkForSyncIssues]);

  return {
    syncStatus,
    refreshSyncStatus,
    checkForSyncIssues,
  };
}; 