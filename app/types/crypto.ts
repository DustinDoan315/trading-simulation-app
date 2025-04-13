export type TimeframeOption = "15m" | "1h" | "4h" | "1d" | "3m";
export type ChartType = "candlestick" | "line";

export interface OrderBookEntry {
  price: string;
  amount: string;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
