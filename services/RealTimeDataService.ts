import { BackgroundDataSyncService } from './BackgroundDataSyncService';
import { enhancedCryptoService } from './EnhancedCryptoService';
import { getMarketData } from './CryptoService';
import { store } from '@/store';
import { updateCurrentPrice } from '@/features/balanceSlice';
import { updatePrice } from '@/features/cryptoPricesSlice';

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
    updateInterval: 30000, // 30 seconds to match background sync
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

  // Subscribe to real-time data updates
  subscribe(callback: (state: RealTimeDataState) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current state
    callback(this.state);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notify all subscribers
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.state));
  }

  // Update state and notify subscribers
  private updateState(updates: Partial<RealTimeDataState>): void {
    this.state = { ...this.state, ...updates };
    this.notifySubscribers();
  }

  // Get current state
  getState(): RealTimeDataState {
    return this.state;
  }

  // Update crypto prices from market data
  private async updateCryptoPrices(): Promise<void> {
    if (this.state.isLoading) {
      console.log('RealTimeDataService: Update already in progress, skipping...');
      return;
    }

    try {
      this.updateState({ isLoading: true, error: null });

      console.log('RealTimeDataService: Fetching market data...');
      
      // Use enhanced crypto service for better caching and rate limiting
      const marketData = await enhancedCryptoService.getMarketData(false, 50, true);
      
      console.log('RealTimeDataService: Market data received:', marketData.length, 'coins');
      console.log('RealTimeDataService: Sample market data:', marketData.slice(0, 3).map(coin => ({
        symbol: coin.symbol,
        price: coin.current_price
      })));
      
      // Get current balance from store
      const balance = store.getState().balance.balance;
      
      // Update prices in Redux store
      marketData.forEach((coin) => {
        const symbol = coin.symbol.toUpperCase();
        
        console.log(`RealTimeDataService: Updating ${symbol} price to ${coin.current_price}`);
        
        // Update crypto prices slice
        store.dispatch(updatePrice({
          symbol,
          price: coin.current_price,
        }));

        // Update balance slice if we have holdings for this crypto
        if (balance?.holdings?.[symbol]) {
          store.dispatch(updateCurrentPrice({
            cryptoId: symbol,
            currentPrice: coin.current_price,
          }));
          
          // The updateCurrentPrice action will automatically:
          // 1. Update the portfolio with new prices
          // 2. Recalculate P&L
          // 3. Update the users table with real-time values
          // 4. Trigger leaderboard updates
        }
      });

      this.updateState({
        lastUpdate: new Date(),
        consecutiveErrors: 0,
        isLoading: false,
        isInitialized: true,
      });
      
      // Reset update interval to normal if we had errors before
      if (this.state.updateInterval > 30000) {
        this.updateState({ updateInterval: 30000 });
        this.restartInterval();
      }

      console.log('RealTimeDataService: Market data updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update prices';
      console.error('RealTimeDataService: Error updating crypto prices:', err);
      
      // Increment consecutive errors and increase update interval
      const newConsecutiveErrors = this.state.consecutiveErrors + 1;
      this.updateState({ 
        error: errorMessage,
        consecutiveErrors: newConsecutiveErrors,
        isLoading: false,
      });
      
      // Increase update interval exponentially on consecutive errors (max 5 minutes)
      if (newConsecutiveErrors >= 3) {
        const newInterval = Math.min(this.state.updateInterval * 2, 300000);
        this.updateState({ updateInterval: newInterval });
        this.restartInterval();
        console.log(`RealTimeDataService: API rate limited. Increasing update interval to ${newInterval / 1000} seconds`);
      }
    }
  }

  // Start the update interval
  startUpdates(): void {
    if (this.intervalId) {
      console.log('RealTimeDataService: Updates already running');
      return;
    }

    console.log('RealTimeDataService: Starting real-time updates...');
    
    // Start the background sync service for comprehensive data updates
    const backgroundSync = BackgroundDataSyncService.getInstance();
    if (!backgroundSync.isServiceRunning()) {
      backgroundSync.start().catch(error => {
        console.error('RealTimeDataService: Failed to start background sync:', error);
      });
    }
    
    // Initial update
    this.updateCryptoPrices();

    // Set up interval for real-time updates (30 seconds to match background sync)
    this.intervalId = setInterval(() => {
      this.updateCryptoPrices();
    }, this.state.updateInterval);
  }

  // Stop the update interval
  stopUpdates(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('RealTimeDataService: Stopped real-time updates');
    }
  }

  // Restart interval with new interval time
  private restartInterval(): void {
    this.stopUpdates();
    this.startUpdates();
  }

  // Manual refresh
  async refresh(): Promise<void> {
    console.log('RealTimeDataService: Manual refresh requested');
    
    // Trigger both real-time updates and background sync
    await Promise.all([
      this.updateCryptoPrices(),
      BackgroundDataSyncService.getInstance().forceSync()
    ]);
  }

  // Check if service is active
  isActive(): boolean {
    return this.intervalId !== null;
  }

  // Get time since last update
  getTimeSinceLastUpdate(): number | null {
    if (!this.state.lastUpdate) return null;
    return Date.now() - this.state.lastUpdate.getTime();
  }
}

export default RealTimeDataService; 