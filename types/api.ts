// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CryptoPriceResponse {
  symbol: string;
  price: string;
  change24h: string;
  changePercent24h: string;
  volume24h: string;
  marketCap: string;
  lastUpdated: string;
}

export interface CryptoListResponse {
  data: CryptoPriceResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface HistoricalDataResponse {
  symbol: string;
  timeframe: string;
  data: Array<{
    timestamp: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;
}

export interface OrderBookResponse {
  symbol: string;
  bids: Array<[string, string]>; // [price, quantity]
  asks: Array<[string, string]>; // [price, quantity]
  timestamp: number;
}

export interface TradeResponse {
  id: string;
  symbol: string;
  price: string;
  quantity: string;
  side: "buy" | "sell";
  timestamp: number;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Request Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface CryptoSearchParams extends PaginationParams {
  query?: string;
  sortBy?: "price" | "change24h" | "volume24h" | "marketCap";
  sortOrder?: "asc" | "desc";
}

export interface HistoricalDataParams {
  symbol: string;
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | "1M";
  limit?: number;
  startTime?: number;
  endTime?: number;
}
