// services/TradingService.ts
import UserRepository from "./UserRepository";
import { TransactionRepository } from "./TransactionRepository";
import { Holding } from "../app/types/crypto";

export interface TradeRequest {
  userId: string;
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
}

export interface TradeResult {
  success: boolean;
  message: string;
  transaction?: any;
  newBalance?: number;
  updatedPortfolio?: any[];
}

class TradingService {
  static async executeTrade(tradeRequest: TradeRequest): Promise<TradeResult> {
    const { userId, symbol, type, quantity, price } = tradeRequest;

    try {
      // Validate trade request
      if (!userId || !symbol || !type || quantity <= 0 || price <= 0) {
        return {
          success: false,
          message: "Invalid trade parameters",
        };
      }

      // Get current user data
      const user = await UserRepository.getUser(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const currentBalance = parseFloat(user.balance);
      const totalCost = quantity * price;

      // Get current portfolio
      const currentPortfolio = await UserRepository.getPortfolio(userId);
      const holdingsMap: Record<string, any> = {};

      // Convert current portfolio to holdings map
      currentPortfolio.forEach((holding) => {
        holdingsMap[holding.symbol] = {
          amount: parseFloat(holding.quantity),
          averageBuyPrice: parseFloat(holding.avgCost),
        };
      });

      if (type === "BUY") {
        // Check if user has sufficient balance
        if (currentBalance < totalCost) {
          return {
            success: false,
            message: `Insufficient balance. Required: $${totalCost.toFixed(
              2
            )}, Available: $${currentBalance.toFixed(2)}`,
          };
        }

        // Update portfolio for buy
        if (holdingsMap[symbol]) {
          // Update existing holding with average cost calculation
          const existingAmount = holdingsMap[symbol].amount;
          const existingAvgPrice = holdingsMap[symbol].averageBuyPrice;
          const totalExistingValue = existingAmount * existingAvgPrice;
          const newTotalValue = totalExistingValue + totalCost;
          const newTotalAmount = existingAmount + quantity;

          holdingsMap[symbol] = {
            amount: newTotalAmount,
            averageBuyPrice: newTotalValue / newTotalAmount,
          };
        } else {
          // Create new holding
          holdingsMap[symbol] = {
            amount: quantity,
            averageBuyPrice: price,
          };
        }

        // Update balance (deduct cost)
        const newBalance = currentBalance - totalCost;
        await UserRepository.updateUserBalance(userId, newBalance);
      } else {
        // SELL
        // Check if user has sufficient holdings
        if (!holdingsMap[symbol] || holdingsMap[symbol].amount < quantity) {
          const availableAmount = holdingsMap[symbol]?.amount || 0;
          return {
            success: false,
            message: `Insufficient ${symbol} holdings. Required: ${quantity}, Available: ${availableAmount}`,
          };
        }

        // Update portfolio for sell
        const newAmount = holdingsMap[symbol].amount - quantity;
        if (newAmount <= 0) {
          // Remove holding completely
          delete holdingsMap[symbol];
        } else {
          // Update holding amount (keep same average price)
          holdingsMap[symbol].amount = newAmount;
        }

        // Update balance (add proceeds)
        const proceeds = quantity * price;
        const newBalance = currentBalance + proceeds;
        await UserRepository.updateUserBalance(userId, newBalance);
      }

      // Save updated portfolio
      await UserRepository.updatePortfolio(userId, holdingsMap);

      // Record transaction
      const transaction = await TransactionRepository.addTransaction(
        userId,
        type,
        symbol,
        quantity,
        price
      );

      // Get updated data
      const updatedUser = await UserRepository.getUser(userId);
      const updatedPortfolio = await UserRepository.getPortfolio(userId);

      return {
        success: true,
        message: `${type} order executed successfully`,
        transaction,
        newBalance: parseFloat(updatedUser!.balance),
        updatedPortfolio,
      };
    } catch (error: any) {
      console.error("Trade execution failed:", error);
      return {
        success: false,
        message: `Trade execution failed: ${error.message}`,
      };
    }
  }

  static async getTradeHistory(
    userId: string,
    symbol?: string,
    limit: number = 50
  ) {
    try {
      if (symbol) {
        return await TransactionRepository.getSymbolTransactions(
          userId,
          symbol
        );
      } else {
        return await TransactionRepository.getUserTransactions(userId, limit);
      }
    } catch (error) {
      console.error("Failed to get trade history:", error);
      return [];
    }
  }

  static async calculatePortfolioValue(
    userId: string,
    currentPrices: Record<string, number>
  ) {
    try {
      const portfolio = await UserRepository.getPortfolio(userId);
      let totalValue = 0;

      const portfolioWithValues = portfolio.map((holding) => {
        const currentPrice =
          currentPrices[holding.symbol] || parseFloat(holding.avgCost);
        const quantity = parseFloat(holding.quantity);
        const marketValue = quantity * currentPrice;
        const costBasis = quantity * parseFloat(holding.avgCost);
        const unrealizedPnL = marketValue - costBasis;

        totalValue += marketValue;

        return {
          ...holding,
          currentPrice,
          marketValue,
          costBasis,
          unrealizedPnL,
          unrealizedPnLPercent: (unrealizedPnL / costBasis) * 100,
        };
      });

      return {
        holdings: portfolioWithValues,
        totalValue,
        totalHoldings: portfolio.length,
      };
    } catch (error) {
      console.error("Failed to calculate portfolio value:", error);
      return { holdings: [], totalValue: 0, totalHoldings: 0 };
    }
  }
}

export default TradingService;
