import LeaderboardService from './LeaderboardService';
import { getMarketData } from './CryptoService';
import { logger } from '@/utils/logger';
import { supabase } from './SupabaseService';
import { UserService } from './UserService';

interface SyncConfig {
  enabled: boolean;
  intervalMs: number;
  maxConcurrentUpdates: number;
  retryAttempts: number;
  retryDelayMs: number;
}

interface SyncStatus {
  isRunning: boolean;
  lastSyncAt: Date | null;
  lastError: string | null;
  syncCount: number;
  errorCount: number;
}

export class BackgroundDataSyncService {
  private static instance: BackgroundDataSyncService;
  private syncInterval: NodeJS.Timeout | any = null;
  private isRunning = false;
  private lastLeaderboardSync = 0;
  private LEADERBOARD_SYNC_COOLDOWN = 60000; // 1 minute cooldown for leaderboard syncs
  private syncStatus: SyncStatus = {
    isRunning: false,
    lastSyncAt: null,
    lastError: null,
    syncCount: 0,
    errorCount: 0,
  };

  private config: SyncConfig = {
    enabled: true,
    intervalMs: 30000, // 30 seconds
    maxConcurrentUpdates: 5,
    retryAttempts: 3,
    retryDelayMs: 5000,
  };

  private constructor() {}

  static getInstance(): BackgroundDataSyncService {
    if (!BackgroundDataSyncService.instance) {
      BackgroundDataSyncService.instance = new BackgroundDataSyncService();
    }
    return BackgroundDataSyncService.instance;
  }

  // Start the background sync service
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.info('Background sync service is already running', 'BackgroundDataSyncService');
      return;
    }

    try {
      logger.info('Starting background data sync service...', 'BackgroundDataSyncService');
      
      this.isRunning = true;
      this.syncStatus.isRunning = true;

      // Run initial sync
      await this.performFullSync();

      // Start periodic sync
      this.syncInterval = setInterval(async () => {
        if (this.config.enabled) {
          await this.performFullSync();
        }
      }, this.config.intervalMs);

      logger.info('Background data sync service started successfully', 'BackgroundDataSyncService');
    } catch (error) {
      logger.error('Failed to start background sync service', 'BackgroundDataSyncService', error);
      this.isRunning = false;
      this.syncStatus.isRunning = false;
      throw error;
    }
  }

  // Stop the background sync service
  stop(): void {
    if (!this.isRunning) {
      logger.info('Background sync service is not running', 'BackgroundDataSyncService');
      return;
    }

    logger.info('Stopping background data sync service...', 'BackgroundDataSyncService');
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.isRunning = false;
    this.syncStatus.isRunning = false;
    
    logger.info('Background data sync service stopped', 'BackgroundDataSyncService');
  }

  // Perform a full sync of all data
  private async performFullSync(): Promise<void> {
    try {
      logger.info('Starting full data sync...', 'BackgroundDataSyncService');
      
      const startTime = Date.now();
      
      // Step 1: Get real-time market data from CoinGecko API
      const marketData = await this.getRealTimeMarketData();
      
      // Step 2: Sync portfolio data with current prices
      await this.syncPortfolioData(marketData);
      
      // Step 3: Update user P&L and portfolio values
      await this.syncUserData();
      
      // Step 4: Update leaderboard rankings
      await this.syncLeaderboardData();
      
      // Step 5: Force refresh all users' real-time data to ensure consistency
      await UserService.forceUpdateAllUsersRealTimeData();
      
      // Step 6: Clean up any inconsistencies
      await this.cleanupInconsistencies();
      
      const duration = Date.now() - startTime;
      this.syncStatus.lastSyncAt = new Date();
      this.syncStatus.syncCount++;
      
      logger.info(
        `Full data sync completed in ${duration}ms`,
        'BackgroundDataSyncService',
        { duration, syncCount: this.syncStatus.syncCount }
      );
    } catch (error) {
      this.syncStatus.lastError = error instanceof Error ? error.message : String(error);
      this.syncStatus.errorCount++;
      
      logger.error('Error during full data sync', 'BackgroundDataSyncService', error);
      
      // Retry on error if configured
      if (this.config.retryAttempts > 0) {
        await this.retrySync();
      }
    }
  }

  // Get real-time market data from CoinGecko API
  private async getRealTimeMarketData(): Promise<any[]> {
    try {
      logger.info('Fetching real-time market data from CoinGecko...', 'BackgroundDataSyncService');
      
      // Fetch fresh market data from CoinGecko API
      const marketData = await getMarketData(true, 100); // Get top 100 coins
      
      logger.info(`Fetched ${marketData.length} market data entries`, 'BackgroundDataSyncService');
      
      return marketData;
    } catch (error) {
      logger.error('Error fetching real-time market data', 'BackgroundDataSyncService', error);
      return [];
    }
  }

  // Sync portfolio data with current prices
  private async syncPortfolioData(marketData: any[]): Promise<void> {
    try {
      logger.info('Syncing portfolio data with current prices...', 'BackgroundDataSyncService');
      
      // Get all portfolio items, excluding those with null symbols
      const { data: portfolios, error } = await supabase
        .from('portfolio')
        .select('*')
        .not('symbol', 'is', null);

      if (error) throw error;

      if (!portfolios || portfolios.length === 0) {
        logger.info('No portfolio data to sync', 'BackgroundDataSyncService');
        return;
      }

      // Filter out any remaining invalid entries
      const validPortfolios = portfolios.filter(portfolio => 
        portfolio.symbol && 
        portfolio.symbol.trim() !== '' && 
        portfolio.id
      );

      if (validPortfolios.length === 0) {
        logger.info('No valid portfolio data to sync', 'BackgroundDataSyncService');
        return;
      }

      // Create a map of current prices from market data
      const currentPrices: Record<string, number> = {};
      marketData.forEach(coin => {
        currentPrices[coin.symbol.toUpperCase()] = coin.current_price;
      });
      
      // Update portfolio items with current prices and recalculate values
      const updates = validPortfolios.map(portfolio => {
        const currentPrice = currentPrices[portfolio.symbol] || parseFloat(portfolio.current_price || '0');
        const quantity = parseFloat(portfolio.quantity || '0');
        const avgCost = parseFloat(portfolio.avg_cost || '0');
        
        const totalValue = quantity * currentPrice;
        const costBasis = quantity * avgCost;
        const profitLoss = totalValue - costBasis;
        const profitLossPercent = avgCost > 0 ? (profitLoss / costBasis) * 100 : 0;

        return {
          id: portfolio.id,
          symbol: portfolio.symbol, // Include symbol to prevent constraint violation
          current_price: currentPrice.toString(),
          total_value: totalValue.toString(),
          profit_loss: profitLoss.toString(),
          profit_loss_percent: profitLossPercent.toString(),
          last_updated: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      // Batch update portfolio items
      for (let i = 0; i < updates.length; i += this.config.maxConcurrentUpdates) {
        const batch = updates.slice(i, i + this.config.maxConcurrentUpdates);
        
        const { error: updateError } = await supabase
          .from('portfolio')
          .upsert(batch);

        if (updateError) {
          logger.error('Error updating portfolio batch', 'BackgroundDataSyncService', updateError);
        }
      }

      logger.info(`Updated ${updates.length} portfolio items with real-time prices`, 'BackgroundDataSyncService');
    } catch (error) {
      logger.error('Error syncing portfolio data', 'BackgroundDataSyncService', error);
      throw error;
    }
  }

  // Sync user data with updated portfolio values
  private async syncUserData(): Promise<void> {
    try {
      logger.info('Syncing user data with updated portfolio values...', 'BackgroundDataSyncService');
      
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id');

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        logger.info('No users found for data sync', 'BackgroundDataSyncService');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Update each user's portfolio value and P&L
      for (const user of users) {
        try {
          // Get user's portfolio
          const { data: portfolio, error: portfolioError } = await supabase
            .from('portfolio')
            .select('*')
            .eq('user_id', user.id);

          if (portfolioError) {
            logger.error(`Error fetching portfolio for user ${user.id}`, 'BackgroundDataSyncService', portfolioError);
            errorCount++;
            continue;
          }

          if (!portfolio || portfolio.length === 0) {
            // User has no portfolio, reset to default values
            await supabase
              .from('users')
              .update({
                total_portfolio_value: '100000.00',
                total_pnl: '0.00',
                total_pnl_percentage: '0.00',
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);
            successCount++;
            continue;
          }

          // Calculate total portfolio value and P&L
          let totalPortfolioValue = 0;
          let totalPnL = 0;
          let totalCostBasis = 0;

          portfolio.forEach(asset => {
            if (asset.symbol.toUpperCase() !== 'USDT') {
              const currentValue = parseFloat(asset.total_value || '0');
              const costBasis = parseFloat(asset.quantity || '0') * parseFloat(asset.avg_cost || '0');
              
              totalPortfolioValue += currentValue;
              totalPnL += parseFloat(asset.profit_loss || '0');
              totalCostBasis += costBasis;
            }
          });

          // Add USDT balance to total portfolio value
          const usdtBalance = parseFloat(portfolio.find(p => p.symbol.toUpperCase() === 'USDT')?.total_value || '0');
          totalPortfolioValue += usdtBalance;

          // Calculate P&L percentage
          const totalPnLPercentage = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

          // Update user data
          await supabase
            .from('users')
            .update({
              total_portfolio_value: totalPortfolioValue.toString(),
              total_pnl: totalPnL.toString(),
              total_pnl_percentage: totalPnLPercentage.toString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          successCount++;
        } catch (error) {
          logger.error(`Error updating user data for user ${user.id}`, 'BackgroundDataSyncService', error);
          errorCount++;
        }
      }

      logger.info(`Updated ${successCount} users, ${errorCount} errors`, 'BackgroundDataSyncService');
    } catch (error) {
      logger.error('Error syncing user data', 'BackgroundDataSyncService', error);
      throw error;
    }
  }

  // Sync leaderboard data
  private async syncLeaderboardData(): Promise<void> {
    try {
      const now = Date.now();
      if (now - this.lastLeaderboardSync < this.LEADERBOARD_SYNC_COOLDOWN) {
        logger.info('Leaderboard sync skipped due to cooldown', 'BackgroundDataSyncService');
        return;
      }

      logger.info('Syncing leaderboard data...', 'BackgroundDataSyncService');
      
      // Force refresh all leaderboard rankings
      await UserService.refreshAllLeaderboardRankings();
      
      this.lastLeaderboardSync = now;
      logger.info('Leaderboard data synced successfully', 'BackgroundDataSyncService');
    } catch (error) {
      logger.error('Error syncing leaderboard data', 'BackgroundDataSyncService', error);
      throw error;
    }
  }

  // Clean up data inconsistencies
  private async cleanupInconsistencies(): Promise<void> {
    try {
      logger.info('Cleaning up data inconsistencies...', 'BackgroundDataSyncService');
      
      // Remove portfolio entries with null symbols
      const { error: symbolError } = await supabase
        .from('portfolio')
        .delete()
        .or('symbol.is.null,symbol.eq.');

      if (symbolError) {
        logger.error('Error cleaning portfolio entries with null symbols', 'BackgroundDataSyncService', symbolError);
      } else {
        logger.info('Cleaned up portfolio entries with null symbols', 'BackgroundDataSyncService');
      }
      
      // Get all valid user IDs first
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id');

      if (usersError) {
        logger.error('Error fetching users for cleanup', 'BackgroundDataSyncService', usersError);
        return;
      }

      if (!users || users.length === 0) {
        logger.info('No users found, skipping orphaned data cleanup', 'BackgroundDataSyncService');
        return;
      }

      const validUserIds = users.map(user => user.id);
      
      // Remove orphaned portfolio entries (users that don't exist)
      // Use a different approach: get all portfolio entries and filter out valid ones
      const { data: allPortfolios, error: portfolioFetchError } = await supabase
        .from('portfolio')
        .select('id, user_id');

      if (portfolioFetchError) {
        logger.error('Error fetching portfolio entries for cleanup', 'BackgroundDataSyncService', portfolioFetchError);
      } else if (allPortfolios) {
        const orphanedPortfolioIds = allPortfolios
          .filter(portfolio => !validUserIds.includes(portfolio.user_id))
          .map(portfolio => portfolio.id);

        if (orphanedPortfolioIds.length > 0) {
          const { error: orphanError } = await supabase
            .from('portfolio')
            .delete()
            .in('id', orphanedPortfolioIds);

          if (orphanError) {
            logger.error('Error cleaning orphaned portfolio entries', 'BackgroundDataSyncService', orphanError);
          } else {
            logger.info(`Cleaned up ${orphanedPortfolioIds.length} orphaned portfolio entries`, 'BackgroundDataSyncService');
          }
        }
      }

      // Remove orphaned leaderboard entries
      const { data: allLeaderboardEntries, error: leaderboardFetchError } = await supabase
        .from('leaderboard_rankings')
        .select('id, user_id');

      if (leaderboardFetchError) {
        logger.error('Error fetching leaderboard entries for cleanup', 'BackgroundDataSyncService', leaderboardFetchError);
      } else if (allLeaderboardEntries) {
        const orphanedLeaderboardIds = allLeaderboardEntries
          .filter(entry => !validUserIds.includes(entry.user_id))
          .map(entry => entry.id);

        if (orphanedLeaderboardIds.length > 0) {
          const { error: leaderboardError } = await supabase
            .from('leaderboard_rankings')
            .delete()
            .in('id', orphanedLeaderboardIds);

          if (leaderboardError) {
            logger.error('Error cleaning orphaned leaderboard entries', 'BackgroundDataSyncService', leaderboardError);
          } else {
            logger.info(`Cleaned up ${orphanedLeaderboardIds.length} orphaned leaderboard entries`, 'BackgroundDataSyncService');
          }
        }
      }

      // Remove orphaned transaction entries
      const { data: allTransactions, error: transactionFetchError } = await supabase
        .from('transactions')
        .select('id, user_id');

      if (transactionFetchError) {
        logger.error('Error fetching transaction entries for cleanup', 'BackgroundDataSyncService', transactionFetchError);
      } else if (allTransactions) {
        const orphanedTransactionIds = allTransactions
          .filter(transaction => !validUserIds.includes(transaction.user_id))
          .map(transaction => transaction.id);

        if (orphanedTransactionIds.length > 0) {
          const { error: transactionError } = await supabase
            .from('transactions')
            .delete()
            .in('id', orphanedTransactionIds);

          if (transactionError) {
            logger.error('Error cleaning orphaned transaction entries', 'BackgroundDataSyncService', transactionError);
          } else {
            logger.info(`Cleaned up ${orphanedTransactionIds.length} orphaned transaction entries`, 'BackgroundDataSyncService');
          }
        }
      }

      logger.info('Data inconsistencies cleaned up', 'BackgroundDataSyncService');
    } catch (error) {
      logger.error('Error cleaning up inconsistencies', 'BackgroundDataSyncService', error);
      throw error;
    }
  }

  // Retry sync on error
  private async retrySync(): Promise<void> {
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        logger.info(`Retrying sync attempt ${attempt}/${this.config.retryAttempts}`, 'BackgroundDataSyncService');
        
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelayMs));
        await this.performFullSync();
        
        logger.info('Retry sync successful', 'BackgroundDataSyncService');
        return;
      } catch (error) {
        logger.error(`Retry attempt ${attempt} failed`, 'BackgroundDataSyncService', error);
        
        if (attempt === this.config.retryAttempts) {
          logger.error('All retry attempts failed', 'BackgroundDataSyncService');
        }
      }
    }
  }

  // Get sync status
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Update sync configuration
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Sync configuration updated', 'BackgroundDataSyncService', this.config);
  }

  // Force a manual sync
  async forceSync(): Promise<void> {
    logger.info('Manual sync requested', 'BackgroundDataSyncService');
    await this.performFullSync();
  }

  // Check if service is running
  isServiceRunning(): boolean {
    return this.isRunning;
  }

  // Reset the singleton instance (useful for development/testing)
  static resetInstance(): void {
    if (BackgroundDataSyncService.instance) {
      BackgroundDataSyncService.instance.stop();
      BackgroundDataSyncService.instance = null as any;
      logger.info('BackgroundDataSyncService singleton instance reset', 'BackgroundDataSyncService');
    }
  }
} 