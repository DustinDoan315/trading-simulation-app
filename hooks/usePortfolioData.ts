import { Asset, Holding, PortfolioData } from '@/types/crypto';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import {
  useCallback,
  useEffect,
  useMemo,
  useState
  } from 'react';
import { useRealTimeBalance } from './useRealTimeBalance';
import { useSelector } from 'react-redux';


const selectPortfolioData = createSelector(
  (state: RootState) => state.balance.balance,
  (state: RootState) => state.balance.changeValue,
  (state: RootState) => state.balance.changePercentage,
  (balance, changeValue, changePercentage) => ({
    balance,
    changeValue,
    changePercentage,
    holdings: Object.entries(balance.holdings || {}),
    totalInUSD: balance.totalPortfolioValue || 0,
  })
);

export const usePortfolioData = () => {
  const portfolioState: any = useSelector(selectPortfolioData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleLowValueCount, setVisibleLowValueCount] = useState(5);

  const realTimeBalance = useRealTimeBalance();

  const loadMoreLowValueTokens = useCallback(() => {
    setVisibleLowValueCount((prev) => prev + 5);
  }, []);

  const processedData = useMemo((): PortfolioData => {
    const { holdings, totalInUSD } = portfolioState;

    if (!holdings.length) {
      return {
        assets: [],
        totalValue: realTimeBalance.totalBalance,
        highValueAssets: [],
        lowValueAssets: [],
        visibleLowValueTokens: [],
        hasMoreLowValueTokens: false,
      };
    }

    const groupedHoldings = new Map<string, Holding>();
    
    holdings.forEach(([id, holding]: [string, Holding]) => {
      const symbolKey = holding.symbol?.toUpperCase() || holding.name?.toUpperCase() || 'UNKNOWN';
      
      if (groupedHoldings.has(symbolKey)) {
        const existing = groupedHoldings.get(symbolKey)!;
        const totalAmount = existing.amount + holding.amount;
        const totalValue = existing.valueInUSD + holding.valueInUSD;
        
        groupedHoldings.set(symbolKey, {
          ...existing,
          amount: totalAmount,
          valueInUSD: totalValue,
          averageBuyPrice: existing.averageBuyPrice || holding.averageBuyPrice,
        });
      } else {
        groupedHoldings.set(symbolKey, holding);
      }
    });

    const mappedAssets: Asset[] = Array.from(groupedHoldings.values()).map((holding) => ({
      id: holding.symbol?.toUpperCase() || holding.name?.toUpperCase() || 'UNKNOWN',
      name: holding.name || "Unknown",
      symbol: holding.symbol?.toUpperCase() || "UNKNOWN",
      amount: holding.amount?.toString() || "0",
      value: holding.valueInUSD?.toFixed(2) || "0.00",
      image_url: holding.image_url || null,
      image: holding.image_url || null,
    }));

    // Efficient filtering and sorting
    const { belowOne, aboveOne } = mappedAssets.reduce(
      (acc, asset) => {
        const value = parseFloat(asset.value);
        if (value < 1) {
          acc.belowOne.push(asset);
        } else {
          acc.aboveOne.push(asset);
        }
        return acc;
      },
      { belowOne: [] as Asset[], aboveOne: [] as Asset[] }
    );

    aboveOne.sort((a, b) => parseFloat(b.value) - parseFloat(a.value));

    const visibleLowValueTokens = belowOne.slice(0, visibleLowValueCount);

    return {
      assets: mappedAssets,
      totalValue: realTimeBalance.totalBalance,
      highValueAssets: aboveOne,
      lowValueAssets: belowOne,
      visibleLowValueTokens,
      hasMoreLowValueTokens: belowOne.length > visibleLowValueCount,
      displayAssets: [...aboveOne, ...visibleLowValueTokens], // For backward compatibility
    };
  }, [
    portfolioState.holdings,
    portfolioState.totalInUSD,
    visibleLowValueCount,
    realTimeBalance.totalBalance,
  ]);

  const refreshPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh portfolio"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (portfolioState.holdings.length > 0) {
      setLoading(false);
      setError(null);
    } else {
      setError("No portfolio data found");
      setLoading(false);
    }
  }, [portfolioState.holdings]);

  return {
    ...processedData,
    ...portfolioState,
    loading: loading || realTimeBalance.isLoading,
    error: error || realTimeBalance.error,
    refreshPortfolio,
    loadMoreLowValueTokens,
  };
};