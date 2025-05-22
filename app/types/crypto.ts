export type TimeframeOption = "15m" | "1h" | "4h" | "1d" | "3m";
export type ChartType = "candlestick" | "line";

export interface OrderBookEntry {
  price: string;
  amount: string;
}

export interface Order {
  id?: string;
  type: "buy" | "sell";
  orderType: "market" | "limit";
  symbol: string;
  price: number;
  amount: number;
  total: number;
  fees: number;
  status: "pending" | "completed" | "failed";
  timestamp: number;
  executedPrice?: number;
  executedAt?: number;
  image_url?: string;
}

export interface TradeHistory {
  id: string;
  userId: string;
  order: Order;
  createdAt: string;
  updatedAt: string;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
