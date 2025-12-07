// utils/widgetDataManager.ts
// Native module for sharing portfolio data with iOS widget

import { NativeModules, Platform } from 'react-native';

interface WidgetDataManagerInterface {
  updateWidgetData(data: PortfolioWidgetData): Promise<boolean>;
  clearWidgetData(): Promise<boolean>;
}

export interface PortfolioWidgetData {
  totalPortfolioValue: number;
  usdtBalance: number;
  totalPnl: number;
  totalPnlPercentage: number;
  winRate: number;
  globalRank?: number | null;
  totalTrades: number;
  username: string;
  avatarEmoji?: string | null;
  lastUpdated: string; // ISO date string
}

const { WidgetDataManager } = NativeModules as {
  WidgetDataManager?: WidgetDataManagerInterface;
};

class WidgetDataManagerService {
  /**
   * Update widget with portfolio data
   */
  async updateWidgetData(data: PortfolioWidgetData): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.warn('[WidgetDataManager] Widgets are only supported on iOS');
      return false;
    }

    if (!WidgetDataManager) {
      console.warn('[WidgetDataManager] Native module not available');
      return false;
    }

    try {
      const widgetData: PortfolioWidgetData = {
        totalPortfolioValue: data.totalPortfolioValue,
        usdtBalance: data.usdtBalance,
        totalPnl: data.totalPnl,
        totalPnlPercentage: data.totalPnlPercentage,
        winRate: data.winRate,
        globalRank: data.globalRank ?? null,
        totalTrades: data.totalTrades,
        username: data.username,
        avatarEmoji: data.avatarEmoji ?? null,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
      };

      return await WidgetDataManager.updateWidgetData(widgetData);
    } catch (error) {
      console.error('[WidgetDataManager] Failed to update widget data:', error);
      return false;
    }
  }

  /**
   * Clear widget data (e.g., on logout)
   */
  async clearWidgetData(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    if (!WidgetDataManager) {
      console.warn('[WidgetDataManager] Native module not available');
      return false;
    }

    try {
      return await WidgetDataManager.clearWidgetData();
    } catch (error) {
      console.error('[WidgetDataManager] Failed to clear widget data:', error);
      return false;
    }
  }
}

export const widgetDataManager = new WidgetDataManagerService();

