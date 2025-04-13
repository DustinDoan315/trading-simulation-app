import { Candle, ChartType, TimeframeOption } from "../types/crypto";
import { useState } from "react";

export default function useHistoricalData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricalData = async (
    tf: TimeframeOption,
    webViewRef: any,
    isReady: boolean,
    chartType: ChartType
  ) => {
    try {
      setLoading(true);
      const apiTimeframe = tf === "15m" ? "15m" : tf;
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${apiTimeframe}&limit=100`
      );
      const data = await response.json();
      const candles = data.map((kline: any) => ({
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
      }));

      console.log(`Fetched ${tf} historical data:`, candles.length, "candles");

      if (webViewRef.current && isReady) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: "setData",
            candles,
            chartType: chartType,
          })
        );
      }
      setLoading(false);
    } catch (e: any) {
      setError("Failed to fetch historical data: " + e.message);
      setLoading(false);
    }
  };

  return { loading, error, setError, fetchHistoricalData };
}
