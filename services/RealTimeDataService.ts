import { BackgroundDataSyncService } from "./BackgroundDataSyncService";
import { enhancedCryptoService } from "./EnhancedCryptoService";
import { getMarketData } from "./CryptoService";
import { store } from "@/store";
import { updateCurrentPrice } from "@/features/balanceSlice";
import { updatePrice } from "@/features/cryptoPricesSlice";

interface RealTimeDataState {
  lastUpdate: Date | null;
  isLoading: boolean;
  error: string | null;
  consecutiveErrors: number;
  updateInterval: number;
  isInitialized: boolean;
}

class RealTimeDataService {
  private static instance: RealTimeDataService;
  private state: RealTimeDataState = {
    lastUpdate: null,
    isLoading: false,
    error: null,
    consecutiveErrors: 0,
    updateInterval: 60000,
    isInitialized: false,
  };
  private intervalId: NodeJS.Timeout | any = null;
  private subscribers: Set<(state: RealTimeDataState) => void> = new Set();

  private constructor() {}

  static getInstance(): RealTimeDataService {
    if (!RealTimeDataService.instance) {
      RealTimeDataService.instance = new RealTimeDataService();
    }
    return RealTimeDataService.instance;
  }

  subscribe(callback: (state: RealTimeDataState) => void): () => void {
    this.subscribers.add(callback);

    callback(this.state);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => callback(this.state));
  }

  private updateState(updates: Partial<RealTimeDataState>): void {
    this.state = { ...this.state, ...updates };
    this.notifySubscribers();
  }

  getState(): RealTimeDataState {
    return this.state;
  }

  private async updateCryptoPrices(): Promise<void> {
    if (this.state.isLoading) {
      return;
    }

    try {
      this.updateState({ isLoading: true, error: null });

      const marketData = await enhancedCryptoService.getMarketData(
        false,
        50,
        true
      );

      const balance = store.getState().balance.balance;

      marketData.forEach((coin) => {
        const symbol = coin.symbol.toUpperCase();

        store.dispatch(
          updatePrice({
            symbol,
            price: coin.current_price,
          })
        );

        if (balance?.holdings?.[symbol]) {
          store.dispatch(
            updateCurrentPrice({
              cryptoId: symbol,
              currentPrice: coin.current_price,
            })
          );
        }
      });

      this.updateState({
        lastUpdate: new Date(),
        consecutiveErrors: 0,
        isLoading: false,
        isInitialized: true,
      });

      if (this.state.updateInterval > 30000) {
        this.updateState({ updateInterval: 30000 });
        this.restartInterval();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update prices";
      console.error("RealTimeDataService: Error updating crypto prices:", err);

      const newConsecutiveErrors = this.state.consecutiveErrors + 1;
      this.updateState({
        error: errorMessage,
        consecutiveErrors: newConsecutiveErrors,
        isLoading: false,
      });

      if (newConsecutiveErrors >= 3) {
        const newInterval = Math.min(this.state.updateInterval * 2, 300000);
        this.updateState({ updateInterval: newInterval });
        this.restartInterval();
      }
    }
  }

  startUpdates(): void {
    if (this.intervalId) {
      return;
    }

    const backgroundSync = BackgroundDataSyncService.getInstance();
    if (!backgroundSync.isServiceRunning()) {
      backgroundSync.start().catch((error) => {
        console.error(
          "RealTimeDataService: Failed to start background sync:",
          error
        );
      });
    }

    this.updateCryptoPrices();

    this.intervalId = setInterval(() => {
      this.updateCryptoPrices();
    }, this.state.updateInterval);
  }

  stopUpdates(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private restartInterval(): void {
    this.stopUpdates();
    this.startUpdates();
  }

  async refresh(): Promise<void> {
    await Promise.all([
      this.updateCryptoPrices(),
      BackgroundDataSyncService.getInstance().forceSync(),
    ]);
  }

  isActive(): boolean {
    return this.intervalId !== null;
  }

  getTimeSinceLastUpdate(): number | null {
    if (!this.state.lastUpdate) return null;
    return Date.now() - this.state.lastUpdate.getTime();
  }
}

export default RealTimeDataService;
