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
  balance: string;
  total_pnl: string;
  total_trades: number;
  win_rate: string;
  global_rank?: number;
  join_date: string;
  last_active: string;
  created_at: string;
  updated_at: string;

  constructor(data: UserType) {
    this.id = data.id;
    this.username = data.username;
    this.display_name = data.display_name;
    this.avatar_emoji = data.avatar_emoji || "🚀";
    this.balance = data.balance;
    this.total_pnl = data.total_pnl;
    this.total_trades = data.total_trades;
    this.win_rate = data.win_rate;
    this.global_rank = data.global_rank;
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
      balance: params.balance || "100000.00",
      total_pnl: "0.00",
      total_trades: 0,
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
    if (params.balance !== undefined) updates.balance = params.balance;
    if (params.total_pnl !== undefined) updates.total_pnl = params.total_pnl;
    if (params.total_trades !== undefined)
      updates.total_trades = params.total_trades;
    if (params.win_rate !== undefined) updates.win_rate = params.win_rate;
    if (params.global_rank !== undefined)
      updates.global_rank = params.global_rank;
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

  getBalance(): number {
    return parseFloat(this.balance);
  }

  getTotalPnl(): number {
    return parseFloat(this.total_pnl);
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

  getFormattedBalance(): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.getBalance());
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

  toJSON(): UserType {
    return {
      id: this.id,
      username: this.username,
      display_name: this.display_name,
      avatar_emoji: this.avatar_emoji,
      balance: this.balance,
      total_pnl: this.total_pnl,
      total_trades: this.total_trades,
      win_rate: this.win_rate,
      global_rank: this.global_rank,
      join_date: this.join_date,
      last_active: this.last_active,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
