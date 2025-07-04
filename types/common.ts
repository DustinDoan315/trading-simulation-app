export type OrderType = "buy" | "sell";
export type ToastType = "success" | "error" | "warning" | "info";
export type ToastPos = "top" | "bottom";

export interface Order {
  id: string;
  type: OrderType;
  symbol: string;
  name?: string;
  amount: number;
  price: number;
  total: number;
  status?: "completed" | string;
  executedPrice?: number;
  executedAt?: number;
  image?: string;
}

export interface Notification {
  message: string;
  type: Exclude<ToastType, "warning">;
}
