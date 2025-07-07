import {
  CreateUserParams,
  UpdateUserParams,
  User as UserType,
} from "../types/database";

export class User implements UserType {
  id: string;
  username: string;
  display_name?: string;
  avatar_emoji?: string;
  usdt_balance: string;
  total_portfolio_value: string;
  initial_balance: string;
  total_pnl: string;
  total_pnl_percentage: string;
  total_trades: number;
  total_buy_volume: string;
  total_sell_volume: string;
  win_rate: string;
  global_rank?: number;
  last_trade_at?: string;
  join_date: string;
  last_active: string;
  created_at: string;
  updated_at: string;

  constructor(data: UserType) {
    this.id = data.id;
    this.username = data.username;
    this.display_name = data.display_name;
    this.avatar_emoji = data.avatar_emoji || "🚀";
    this.usdt_balance = data.usdt_balance;
    this.total_portfolio_value = data.total_portfolio_value;
    this.initial_balance = data.initial_balance;
    this.total_pnl = data.total_pnl;
    this.total_pnl_percentage = data.total_pnl_percentage;
    this.total_trades = data.total_trades;
    this.total_buy_volume = data.total_buy_volume;
    this.total_sell_volume = data.total_sell_volume;
    this.win_rate = data.win_rate;
    this.global_rank = data.global_rank;
    this.last_trade_at = data.last_trade_at;
    this.join_date = data.join_date;
    this.last_active = data.last_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static create(params: CreateUserParams): Partial<UserType> {
    const now = new Date().toISOString();
    return {
      username: params.username,
      display_name: params.display_name,
      avatar_emoji: params.avatar_emoji || "🚀",
      usdt_balance: params.usdt_balance || "100000.00",
      total_portfolio_value: params.total_portfolio_value || "100000.00",
      initial_balance: params.initial_balance || "100000.00",
      total_pnl: "0.00",
      total_pnl_percentage: "0.00",
      total_trades: 0,
      total_buy_volume: "0.00",
      total_sell_volume: "0.00",
      win_rate: "0.00",
      join_date: now,
      last_active: now,
      created_at: now,
      updated_at: now,
    };
  }

  update(params: UpdateUserParams): Partial<UserType> {
    const updates: Partial<UserType> = {};

    if (params.display_name !== undefined)
      updates.display_name = params.display_name;
    if (params.avatar_emoji !== undefined)
      updates.avatar_emoji = params.avatar_emoji;
    if (params.usdt_balance !== undefined) updates.usdt_balance = params.usdt_balance;
    if (params.total_portfolio_value !== undefined) updates.total_portfolio_value = params.total_portfolio_value;
    if (params.total_pnl !== undefined) updates.total_pnl = params.total_pnl;
    if (params.total_pnl_percentage !== undefined) updates.total_pnl_percentage = params.total_pnl_percentage;
    if (params.total_trades !== undefined)
      updates.total_trades = params.total_trades;
    if (params.total_buy_volume !== undefined) updates.total_buy_volume = params.total_buy_volume;
    if (params.total_sell_volume !== undefined) updates.total_sell_volume = params.total_sell_volume;
    if (params.win_rate !== undefined) updates.win_rate = params.win_rate;
    if (params.global_rank !== undefined)
      updates.global_rank = params.global_rank;
    if (params.last_trade_at !== undefined)
      updates.last_trade_at = params.last_trade_at;
    if (params.last_active !== undefined)
      updates.last_active = params.last_active;

    updates.updated_at = new Date().toISOString();

    return updates;
  }

  // Helper methods
  getDisplayName(): string {
    return this.display_name || this.username;
  }

  getAvatar(): string {
    return this.avatar_emoji || "🚀";
  }

  getUsdtBalance(): number {
    return parseFloat(this.usdt_balance);
  }

  getTotalPortfolioValue(): number {
    return parseFloat(this.total_portfolio_value);
  }

  getInitialBalance(): number {
    return parseFloat(this.initial_balance);
  }

  getTotalPnl(): number {
    return parseFloat(this.total_pnl);
  }

  getTotalPnlPercentage(): number {
    return parseFloat(this.total_pnl_percentage);
  }

  getWinRate(): number {
    return parseFloat(this.win_rate);
  }

  isProfitable(): boolean {
    return this.getTotalPnl() > 0;
  }

  getPerformanceColor(): string {
    const pnl = this.getTotalPnl();
    if (pnl > 0) return "#00C851"; // Green
    if (pnl < 0) return "#ff4444"; // Red
    return "#666666"; // Gray
  }

  getFormattedUsdtBalance(): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.getUsdtBalance());
  }

  getFormattedPortfolioValue(): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.getTotalPortfolioValue());
  }

  getFormattedPnl(): string {
    const pnl = this.getTotalPnl();
    const sign = pnl >= 0 ? "+" : "";
    return `${sign}${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(pnl)}`;
  }

  getFormattedWinRate(): string {
    return `${this.getWinRate().toFixed(1)}%`;
  }

  // Legacy method for backward compatibility
  getBalance(): number {
    return this.getUsdtBalance();
  }

  getFormattedBalance(): string {
    return this.getFormattedUsdtBalance();
  }

  toJSON(): UserType {
    return {
      id: this.id,
      username: this.username,
      display_name: this.display_name,
      avatar_emoji: this.avatar_emoji,
      usdt_balance: this.usdt_balance,
      total_portfolio_value: this.total_portfolio_value,
      initial_balance: this.initial_balance,
      total_pnl: this.total_pnl,
      total_pnl_percentage: this.total_pnl_percentage,
      total_trades: this.total_trades,
      total_buy_volume: this.total_buy_volume,
      total_sell_volume: this.total_sell_volume,
      win_rate: this.win_rate,
      global_rank: this.global_rank,
      last_trade_at: this.last_trade_at,
      join_date: this.join_date,
      last_active: this.last_active,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
