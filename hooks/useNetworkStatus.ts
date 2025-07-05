import NetInfo from "@react-native-community/netinfo";
import { logger } from "../utils/logger";
import { useEffect, useState } from "react";

// hooks/useNetworkStatus.ts

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
  isEthernet: boolean;
  isUnknown: boolean;
  isOffline: boolean;
}

export interface NetworkState {
  status: NetworkStatus;
  lastUpdated: Date;
  isInitialized: boolean;
}

const initialState: NetworkState = {
  status: {
    isConnected: false,
    isInternetReachable: null,
    type: "unknown",
    isWifi: false,
    isCellular: false,
    isEthernet: false,
    isUnknown: true,
    isOffline: true,
  },
  lastUpdated: new Date(),
  isInitialized: false,
};

export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState<NetworkState>(initialState);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeNetworkStatus = async () => {
      try {
        // Get initial network status
        const netInfo = await NetInfo.fetch();
        const status = createNetworkStatus(netInfo);

        setNetworkState({
          status,
          lastUpdated: new Date(),
          isInitialized: true,
        });

        logger.info("Network status initialized", "useNetworkStatus", status);

        // Subscribe to network changes
        unsubscribe = NetInfo.addEventListener(
          (state: {
            isConnected: boolean | null;
            isInternetReachable: boolean | null;
            type: string;
          }) => {
            const newStatus = createNetworkStatus(state);
            const now = new Date();

            setNetworkState({
              status: newStatus,
              lastUpdated: now,
              isInitialized: true,
            });

            logger.debug("Network status changed", "useNetworkStatus", {
              previous: networkState.status,
              current: newStatus,
              timestamp: now.toISOString(),
            });
          }
        );
      } catch (error) {
        logger.error(
          "Failed to initialize network status",
          "useNetworkStatus",
          { error }
        );
        setNetworkState((prev) => ({
          ...prev,
          isInitialized: true,
        }));
      }
    };

    initializeNetworkStatus();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const createNetworkStatus = (netInfo: {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type: string;
  }): NetworkStatus => {
    const isConnected = netInfo.isConnected ?? false;
    const isInternetReachable = netInfo.isInternetReachable;
    const type = netInfo.type || "unknown";

    return {
      isConnected,
      isInternetReachable,
      type,
      isWifi: type === "wifi",
      isCellular: type === "cellular",
      isEthernet: type === "ethernet",
      isUnknown: type === "unknown",
      isOffline: !isConnected || isInternetReachable === false,
    };
  };

  const waitForConnection = async (timeout = 30000): Promise<boolean> => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && netInfo.isInternetReachable !== false) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return false;
  };

  const checkConnectivity = async (): Promise<boolean> => {
    try {
      const netInfo = await NetInfo.fetch();
      return (
        netInfo.isConnected === true && netInfo.isInternetReachable !== false
      );
    } catch (error) {
      logger.error("Failed to check connectivity", "useNetworkStatus", {
        error,
      });
      return false;
    }
  };

  return {
    ...networkState.status,
    lastUpdated: networkState.lastUpdated,
    isInitialized: networkState.isInitialized,
    waitForConnection,
    checkConnectivity,
  };
};

export default useNetworkStatus;
