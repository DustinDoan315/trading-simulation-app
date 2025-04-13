import { ChartType, TimeframeOption } from "../types/crypto";
import { useEffect, useState } from "react";

export default function useCryptoWebSocket(
  timeframe: TimeframeOption,
  isReady: boolean,
  webViewRef: React.RefObject<any>,
  chartType: ChartType,
  fetchHistoricalData: (tf: TimeframeOption) => void
) {
  const [wsConnected, setWsConnected] = useState(false);
  const [currentPrice, setCurrentPrice] = useState("83,034.1");
  const [priceChange, setPriceChange] = useState("+0.57%");

  useEffect(() => {
    // Convert UI timeframe to WebSocket timeframe format
    const wsTimeframe =
      timeframe === "15m"
        ? "15m"
        : timeframe === "1h"
        ? "1h"
        : timeframe === "4h"
        ? "4h"
        : timeframe === "1d"
        ? "1d"
        : "3m";

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/btcusdt@kline_${wsTimeframe}`
    );

    ws.onopen = () => {
      console.log(`Connected to Binance WebSocket (${wsTimeframe})`);
      setWsConnected(true);
      if (isReady) {
        fetchHistoricalData(timeframe);
      }
    };

    ws.onmessage = (event) => {
      if (!isReady || !webViewRef.current) {
        return;
      }
      const data = JSON.parse(event.data);
      const kline = data.k;
      if (kline) {
        const candle = {
          timestamp: kline.t,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
          volume: parseFloat(kline.v),
        };

        // Update current price
        setCurrentPrice(
          Number(kline.c).toLocaleString("en-US", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })
        );

        // Calculate price change (mock data for demo)
        const randomChange = (Math.random() * 2 - 1) * 0.5;
        setPriceChange(
          (randomChange > 0 ? "+" : "") + randomChange.toFixed(2) + "%"
        );

        webViewRef.current.postMessage(
          JSON.stringify({
            type: "addCandle",
            ...candle,
            chartType: chartType,
          })
        );
      }
    };

    ws.onerror = (error) => console.error("WebSocket Error:", error);
    ws.onclose = () => {
      console.log("WebSocket Closed");
      setWsConnected(false);
    };

    return () => ws.close();
  }, [isReady, timeframe, chartType, fetchHistoricalData]);

  return { wsConnected, currentPrice, priceChange };
}
