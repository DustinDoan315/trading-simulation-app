/**
 * Utility functions for formatting values
 */

/**
 * Format price with appropriate decimal places
 * @param {number} price - The price to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted price
 */
export const formatPrice = (price: any, decimals = 2) => {
  if (typeof price !== "number") {
    // Try to parse number if string is provided
    try {
      price = parseFloat(price.replace(",", "."));
    } catch (e) {
      return "0.00";
    }
  }

  return price.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Format amount with appropriate decimal places
 * @param {number} amount - The amount to format
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {string} Formatted amount
 */
export const formatAmount = (amount: any, decimals = 4) => {
  if (typeof amount !== "number") {
    // Try to parse number if string is provided
    try {
      amount = parseFloat(amount.replace(",", "."));
    } catch (e) {
      return "0.0000";
    }
  }

  return amount.toFixed(decimals);
};

/**
 * Format timestamp to HH:MM format
 * @param {Date|number} timestamp - Date object or timestamp
 * @returns {string} Formatted time
 */
export const formatTime = (timestamp: any) => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/**
 * Utility functions for formatting values in the cryptocurrency application
 */

/**
 * Formats a number as currency with symbol and decimal places
 *
 * @param value - The numeric value to format
 * @param symbol - Currency symbol to display (defaults to $)
 * @param decimals - Number of decimal places to show (defaults to 2)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number,
  symbol: string = "$",
  decimals: number = 2
): string => {
  if (value === undefined || value === null) return `${symbol}0`;

  // Handle specialized formatting for different value ranges
  if (value < 0.01 && value > 0) {
    return `${symbol}${value.toFixed(8)}`;
  }

  if (value >= 1000) {
    // Use comma thousands separator for large numbers
    return `${symbol}${value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }

  return `${symbol}${value.toFixed(decimals)}`;
};

/**
 * Formats a decimal as a percentage with sign
 *
 * @param value - The decimal value to format as percentage
 * @returns Formatted percentage string with sign
 */
export const formatPercentage = (value: number): string => {
  if (value === undefined || value === null) return "0%";

  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

/**
 * Formats a large number with appropriate suffix (K, M, B, T)
 *
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places to show
 * @returns Formatted number with suffix
 */
export const formatLargeNumber = (
  value: number,
  decimals: number = 2
): string => {
  if (value === undefined || value === null) return "0";

  if (value < 1000) {
    return value.toFixed(decimals);
  }

  const units = ["", "K", "M", "B", "T"];
  const unitIndex = Math.floor(Math.log10(value) / 3);

  if (unitIndex >= units.length) {
    return value.toExponential(decimals);
  }

  const scaledValue = value / Math.pow(10, unitIndex * 3);
  return `${scaledValue.toFixed(decimals)}${units[unitIndex]}`;
};

/**
 * Formats an address for display (truncates middle)
 *
 * @param address - Blockchain address to format
 * @param startChars - Number of characters to show at start
 * @param endChars - Number of characters to show at end
 * @returns Formatted address string
 */
export const formatAddress = (
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string => {
  if (!address || address.length <= startChars + endChars) {
    return address || "";
  }

  return `${address.substring(0, startChars)}...${address.substring(
    address.length - endChars
  )}`;
};
