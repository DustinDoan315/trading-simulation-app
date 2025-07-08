/**
 * Input validation utilities for trading simulation app
 * Provides type-safe validation for all user inputs
 */

import { VALIDATION_RULES, TRADING_CONFIG, APP_LIMITS } from '../constants/AppConstants';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Trading Amount Validation
 */
export class TradingValidator {
  /**
   * Validates trade amount is within acceptable bounds
   */
  static validateTradeAmount(amount: number, availableBalance: number): ValidationResult {
    if (isNaN(amount) || amount <= 0) {
      return { isValid: false, error: 'Trade amount must be a positive number' };
    }

    if (amount < VALIDATION_RULES.TRADE_AMOUNT_MIN) {
      return { 
        isValid: false, 
        error: `Minimum trade amount is $${VALIDATION_RULES.TRADE_AMOUNT_MIN}` 
      };
    }

    if (amount > VALIDATION_RULES.TRADE_AMOUNT_MAX) {
      return { 
        isValid: false, 
        error: `Maximum trade amount is $${VALIDATION_RULES.TRADE_AMOUNT_MAX.toLocaleString()}` 
      };
    }

    if (amount > availableBalance) {
      return { 
        isValid: false, 
        error: 'Insufficient balance for this trade' 
      };
    }

    return { isValid: true };
  }

  /**
   * Validates cryptocurrency quantity
   */
  static validateCryptoQuantity(quantity: number, maxQuantity?: number): ValidationResult {
    if (isNaN(quantity) || quantity <= 0) {
      return { isValid: false, error: 'Quantity must be a positive number' };
    }

    if (quantity < 0.00000001) { // 8 decimal places precision
      return { isValid: false, error: 'Quantity too small (minimum 8 decimal places)' };
    }

    if (maxQuantity && quantity > maxQuantity) {
      return { 
        isValid: false, 
        error: `Maximum quantity available: ${maxQuantity}` 
      };
    }

    return { isValid: true };
  }

  /**
   * Validates cryptocurrency symbol format
   */
  static validateCryptoSymbol(symbol: string): ValidationResult {
    if (!symbol || typeof symbol !== 'string') {
      return { isValid: false, error: 'Invalid cryptocurrency symbol' };
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    
    if (cleanSymbol.length < 2 || cleanSymbol.length > 10) {
      return { isValid: false, error: 'Symbol must be 2-10 characters long' };
    }

    if (!/^[A-Z0-9]+$/.test(cleanSymbol)) {
      return { isValid: false, error: 'Symbol can only contain letters and numbers' };
    }

    return { isValid: true };
  }

  /**
   * Validates portfolio value limits
   */
  static validatePortfolioValue(totalValue: number): ValidationResult {
    if (isNaN(totalValue) || totalValue < 0) {
      return { isValid: false, error: 'Invalid portfolio value' };
    }

    if (totalValue > VALIDATION_RULES.PORTFOLIO_VALUE_MAX) {
      return { 
        isValid: false, 
        error: `Portfolio value exceeds maximum limit of $${VALIDATION_RULES.PORTFOLIO_VALUE_MAX.toLocaleString()}` 
      };
    }

    return { isValid: true };
  }
}

/**
 * User Input Validation
 */
export class UserValidator {
  /**
   * Validates username format and length
   */
  static validateUsername(username: string): ValidationResult {
    if (!username || typeof username !== 'string') {
      return { isValid: false, error: 'Username is required' };
    }

    const cleanUsername = username.trim();
    
    if (cleanUsername.length < APP_LIMITS.MIN_USERNAME_LENGTH) {
      return { 
        isValid: false, 
        error: `Username must be at least ${APP_LIMITS.MIN_USERNAME_LENGTH} characters long` 
      };
    }

    if (cleanUsername.length > APP_LIMITS.MAX_USERNAME_LENGTH) {
      return { 
        isValid: false, 
        error: `Username cannot exceed ${APP_LIMITS.MAX_USERNAME_LENGTH} characters` 
      };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      return { 
        isValid: false, 
        error: 'Username can only contain letters, numbers, hyphens, and underscores' 
      };
    }

    return { isValid: true };
  }

  /**
   * Validates email format
   */
  static validateEmail(email: string): ValidationResult {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email is required' };
    }

    const cleanEmail = email.trim().toLowerCase();
    
    if (!VALIDATION_RULES.EMAIL_REGEX.test(cleanEmail)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
  }

  /**
   * Validates password strength
   */
  static validatePassword(password: string): ValidationResult {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: 'Password is required' };
    }

    if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      return { 
        isValid: false, 
        error: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long` 
      };
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one number' };
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one letter' };
    }

    return { isValid: true };
  }
}

/**
 * Data Sanitization
 */
export class DataSanitizer {
  /**
   * Sanitizes string input to prevent XSS and injection attacks
   */
  static sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
      .slice(0, 1000); // Limit length to prevent overflows
  }

  /**
   * Sanitizes numeric input for trading amounts
   */
  static sanitizeNumber(input: any): number | null {
    if (input === null || input === undefined) {
      return null;
    }

    const num = parseFloat(String(input));
    
    if (isNaN(num) || !isFinite(num)) {
      return null;
    }

    return num;
  }

  /**
   * Sanitizes cryptocurrency symbol
   */
  static sanitizeCryptoSymbol(symbol: string): string {
    if (!symbol || typeof symbol !== 'string') {
      return '';
    }

    return symbol
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // Only allow alphanumeric characters
      .slice(0, 10); // Limit to 10 characters
  }

  /**
   * Sanitizes collection name
   */
  static sanitizeCollectionName(name: string): string {
    if (!name || typeof name !== 'string') {
      return '';
    }

    return name
      .trim()
      .replace(/[<>\"'&]/g, '') // Remove dangerous characters
      .slice(0, 50); // Limit length
  }
}

/**
 * Portfolio Validation
 */
export class PortfolioValidator {
  /**
   * Validates portfolio size limits
   */
  static validatePortfolioSize(holdings: Record<string, any>): ValidationResult {
    const portfolioSize = Object.keys(holdings).length;
    
    if (portfolioSize > APP_LIMITS.MAX_PORTFOLIO_ITEMS) {
      return { 
        isValid: false, 
        error: `Portfolio cannot exceed ${APP_LIMITS.MAX_PORTFOLIO_ITEMS} different assets` 
      };
    }

    return { isValid: true };
  }

  /**
   * Validates holding data structure
   */
  static validateHolding(holding: any): ValidationResult {
    if (!holding || typeof holding !== 'object') {
      return { isValid: false, error: 'Invalid holding data' };
    }

    const required = ['amount', 'symbol', 'valueInUSD'];
    for (const field of required) {
      if (!(field in holding)) {
        return { isValid: false, error: `Missing required field: ${field}` };
      }
    }

    const amountValidation = TradingValidator.validateCryptoQuantity(holding.amount);
    if (!amountValidation.isValid) {
      return amountValidation;
    }

    const symbolValidation = TradingValidator.validateCryptoSymbol(holding.symbol);
    if (!symbolValidation.isValid) {
      return symbolValidation;
    }

    return { isValid: true };
  }
}

/**
 * Collection Validation
 */
export class CollectionValidator {
  /**
   * Validates collection data
   */
  static validateCollection(collection: any): ValidationResult {
    if (!collection || typeof collection !== 'object') {
      return { isValid: false, error: 'Invalid collection data' };
    }

    if (!collection.name || typeof collection.name !== 'string') {
      return { isValid: false, error: 'Collection name is required' };
    }

    const sanitizedName = DataSanitizer.sanitizeCollectionName(collection.name);
    if (sanitizedName.length < 3) {
      return { isValid: false, error: 'Collection name must be at least 3 characters long' };
    }

    if (collection.participants && Array.isArray(collection.participants)) {
      if (collection.participants.length > APP_LIMITS.MAX_COLLECTION_SIZE) {
        return { 
          isValid: false, 
          error: `Collection cannot exceed ${APP_LIMITS.MAX_COLLECTION_SIZE} participants` 
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validates invite code format
   */
  static validateInviteCode(code: string): ValidationResult {
    if (!code || typeof code !== 'string') {
      return { isValid: false, error: 'Invite code is required' };
    }

    const cleanCode = code.trim().toUpperCase();
    
    if (cleanCode.length !== 6) {
      return { isValid: false, error: 'Invite code must be exactly 6 characters' };
    }

    if (!/^[A-Z0-9]+$/.test(cleanCode)) {
      return { isValid: false, error: 'Invite code can only contain letters and numbers' };
    }

    return { isValid: true };
  }
}

/**
 * Batch validation for complex operations
 */
export class BatchValidator {
  /**
   * Validates complete trade operation
   */
  static validateTradeOperation(trade: {
    symbol: string;
    amount: number;
    price: number;
    type: 'buy' | 'sell';
    availableBalance: number;
    availableQuantity?: number;
  }): ValidationResult {
    // Validate symbol
    const symbolValidation = TradingValidator.validateCryptoSymbol(trade.symbol);
    if (!symbolValidation.isValid) return symbolValidation;

    // Validate amount
    const totalValue = trade.amount * trade.price;
    const amountValidation = TradingValidator.validateTradeAmount(
      totalValue, 
      trade.availableBalance
    );
    if (!amountValidation.isValid) return amountValidation;

    // Validate quantity for sells
    if (trade.type === 'sell' && trade.availableQuantity !== undefined) {
      const quantityValidation = TradingValidator.validateCryptoQuantity(
        trade.amount, 
        trade.availableQuantity
      );
      if (!quantityValidation.isValid) return quantityValidation;
    }

    return { isValid: true };
  }
}

/**
 * Utility function to validate any object against expected schema
 */
export function validateSchema<T>(
  data: any, 
  schema: Record<keyof T, (value: any) => ValidationResult>
): ValidationResult {
  for (const key in schema) {
    if (schema.hasOwnProperty(key)) {
      const validator = schema[key];
      const result = validator(data[key]);
      if (!result.isValid) {
        return { isValid: false, error: `${key}: ${result.error}` };
      }
    }
  }
  
  return { isValid: true };
}