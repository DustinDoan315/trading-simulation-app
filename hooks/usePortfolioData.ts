import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/store";
import { Asset, PortfolioData } from "@/app/types/crypto";

// Optimized selector with better memoization
const selectPortfolioData = createSelector(
  (state: RootState) => state.balance.balance,
  (state: RootState) => state.balance.changeValue,
  (state: RootState) => state.balance.changePercentage,
  (balance, changeValue, changePercentage) => ({
    balance,
    changeValue,
    changePercentage,
    holdings: Object.entries(balance.holdings || {}),
    totalInUSD: balance.totalInUSD || 0,
  })
);

export const usePortfolioData = () => {
  const portfolioState = useSelector(selectPortfolioData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleLowValueCount, setVisibleLowValueCount] = useState(5);

  const loadMoreLowValueTokens = useCallback(() => {
    setVisibleLowValueCount((prev) => prev + 5);
  }, []);

  // Memoized asset processing
  const processedData = useMemo((): PortfolioData => {
    const { holdings, totalInUSD } = portfolioState;

    if (!holdings.length) {
      return {
        assets: [],
        totalValue: 0,
        highValueAssets: [],
        lowValueAssets: [],
        visibleLowValueTokens: [],
        hasMoreLowValueTokens: false,
      };
    }

    const mappedAssets: Asset[] = holdings.map(([id, holding]) => ({
      id: holding.name.toLowerCase(),
      name: holding.name || "Unknown",
      symbol: holding.symbol || "UNKNOWN",
      amount: holding.amount?.toString() || "0",
      value: holding.valueInUSD?.toFixed(2) || "0.00",
      image: holding.image || null,
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
      totalValue: totalInUSD,
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
    loading,
    error,
    refreshPortfolio,
    loadMoreLowValueTokens,
  };
};
