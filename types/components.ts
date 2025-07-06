import { ReactNode } from "react";
// Component Prop Types

// Common component props
export interface BaseComponentProps {
  children?: ReactNode;
  style?: any;
  testID?: string;
}

// Text component props
export interface ThemedTextProps extends BaseComponentProps {
  variant?: "title" | "subtitle" | "body" | "caption" | "button";
  color?: string;
  size?: number;
  weight?: "normal" | "bold" | "600" | "700";
  align?: "left" | "center" | "right";
  numberOfLines?: number;
}

// View component props
export interface ThemedViewProps extends BaseComponentProps {
  variant?: "container" | "card" | "section" | "row" | "column";
  padding?: number | string;
  margin?: number | string;
  backgroundColor?: string;
  borderRadius?: number;
  shadow?: boolean;
}

// Button component props
export interface ButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

// Input component props
export interface InputProps extends BaseComponentProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  numberOfLines?: number;
}

// Crypto list item props
export interface CryptoListItemProps {
  symbol: string;
  name: string;
  price: string;
  change24h: string;
  changePercent24h: string;
  image?: string;
  onPress: (symbol: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (symbol: string) => void;
}

// Chart component props
export interface ChartProps {
  data: Array<{
    timestamp: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;
  symbol: string;
  timeframe: string;
  height?: number;
  width?: number;
  onTimeframeChange?: (timeframe: string) => void;
}

// Order book item props
export interface OrderBookItemProps {
  price: number | string;
  amount: number | string;
  type: "bid" | "ask";
  onPress: () => void;
  onLongPress?: () => void;
  isCurrentPrice?: boolean;
}

// Order book props
export interface OrderBookProps {
  symbol?: string;
  askOrders?: Array<{ price: string; amount: string }>;
  bidOrders?: Array<{ price: string; amount: string }>;
  currentPrice?: string | null;
  webViewRef?: React.RefObject<any>;
  onSelectPrice?: (price: number) => void;
  maxVisibleOrders?: number;
  onTradeExecuted?: () => void;
}

// Order entry props
export interface OrderEntryProps {
  symbol: string;
  currentPrice: string;
  onOrderSubmit: (order: {
    type: "market" | "limit";
    side: "buy" | "sell";
    quantity: string;
    price?: string;
  }) => void;
  balance: string;
  loading?: boolean;
}

// Portfolio item props
export interface PortfolioItemProps {
  symbol: string;
  quantity: string;
  avgCost: string;
  currentPrice: string;
  totalValue: string;
  profitLoss: string;
  profitLossPercent: string;
  image?: string;
  onPress: (symbol: string) => void;
}

// Balance card props
export interface BalanceCardProps {
  balance?: string;
  changePercentage?: number;
  changeValue?: string;
  progress?: number;
  assets?: any[];
  totalBalance?: string;
  totalProfitLoss?: string;
  totalProfitLossPercent?: string;
  onRefresh?: () => void;
  loading?: boolean;
  onResetBalance?: () => void;
}

// Header props
export interface HeaderProps {
  title: string;
  subtitle?: string;
  leftComponent?: ReactNode;
  rightComponent?: ReactNode;
  onBackPress?: () => void;
}

// Tab bar props
export interface TabBarProps {
  tabs: Array<{
    key: string;
    title: string;
    icon: ReactNode;
    activeIcon?: ReactNode;
  }>;
  activeTab: string;
  onTabPress: (tabKey: string) => void;
}

// Modal props
export interface ModalProps extends BaseComponentProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  showCloseButton?: boolean;
  animationType?: "none" | "slide" | "fade";
}

// Loading props
export interface LoadingProps extends BaseComponentProps {
  size?: "small" | "large";
  color?: string;
  text?: string;
}

// Error boundary props
export interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

// Notification props
export interface NotificationProps {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
}
