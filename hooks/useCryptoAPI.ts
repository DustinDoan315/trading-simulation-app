import { enhancedCryptoService } from '@/services/EnhancedCryptoService';
import { formatPercentage } from '@/utils/formatters';
import { getCoinMarketData, getPriceHistory } from '@/services/CryptoService';
import { HistoricalDataResponse } from '../types/api';
import { TimeframeOption } from '../types/crypto';
import { useEffect, useState } from 'react';


const useCryptoAPI = (timeframe: TimeframeOption, id: string) => {
  const [currentPrice, setCurrentPrice] = useState<string | null>(null);
  const [priceChange, setPriceChange] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<Array<[number, number]>>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const coinMarketData = await enhancedCryptoService.getCryptoDetails(id);

        // Extract current price and price change from the response
        const marketData = coinMarketData?.market_data;
        setCurrentPrice(marketData?.current_price?.usd?.toString() || null);
        setPriceChange(
          formatPercentage(marketData?.market_cap_change_percentage_24h) || null
        );

        // Fetch historical data based on timeframe
        const days =
          timeframe === "15m"
            ? 1
            : timeframe === "1h"
            ? 1
            : timeframe === "4h"
            ? 7
            : timeframe === "1d"
            ? 30
            : timeframe === "3m"
            ? 3
            : 30;

        const history = await enhancedCryptoService.getPriceHistory(id, days);
        setHistoricalData(history?.prices || []);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch data";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up polling interval (e.g., every 60 seconds)
    const intervalId = setInterval(fetchData, 60 * 1000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [timeframe]);

  return { currentPrice, priceChange, historicalData, isLoading, error };
};

export default useCryptoAPI;
