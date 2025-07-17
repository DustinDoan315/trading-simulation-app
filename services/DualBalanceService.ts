import UUIDService from './UUIDService';
import {
  CollectionBalance,
  CollectionPortfolio,
  CombinedPnLResult,
  IndividualBalance,
  PnLResult,
  TradingContext,
  Transaction
  } from '../types/database';
import { Holding } from '../types/crypto';
import { logger } from '@/utils/logger';
import { supabase } from './SupabaseService';
import { UserService } from './UserService';


export class DualBalanceService {
  static async getIndividualBalance(userId: string): Promise<IndividualBalance> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const { data: portfolio, error: portfolioError } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', userId);

      if (portfolioError) throw portfolioError;

      const holdings: Record<string, any> = {};
      portfolio?.forEach(item => {
        holdings[item.symbol.toUpperCase()] = {
          amount: parseFloat(item.quantity),
          valueInUSD: parseFloat(item.total_value),
          symbol: item.symbol.toUpperCase(),
          name: item.symbol,
          image_url: item.image_url,
          averageBuyPrice: parseFloat(item.avg_cost),
          currentPrice: parseFloat(item.current_price),
          profitLoss: parseFloat(item.profit_loss),
          profitLossPercentage: parseFloat(item.profit_loss_percent),
        };
      });

      const initialBalance = parseFloat(user.initial_balance);
      const cryptoValue = portfolio?.reduce((sum, item) => sum + parseFloat(item.total_value), 0) || 0;
      const actualUsdtBalance = initialBalance - cryptoValue;
      
      const usdtBalance = Math.max(0, actualUsdtBalance);
      
      holdings.USDT = {
        amount: usdtBalance,
        valueInUSD: usdtBalance,
        symbol: 'USDT',
        name: 'Tether',
        image_url: 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661',
        averageBuyPrice: 1,
        currentPrice: 1,
        profitLoss: 0,
        profitLossPercentage: 0,
      };

      const totalPortfolioValue = this.calculateTotalPortfolioValue(holdings);
      const totalPnL = totalPortfolioValue - initialBalance;
      const totalPnLPercentage = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

      console.log('📊 getIndividualBalance - Database values:', {
        userId,
        usdtBalanceFromDB: user.usdt_balance,
        calculatedUsdtBalance: usdtBalance,
        initialBalance,
        cryptoValue,
        totalPortfolioValue,
        totalPnL
      });

      return {
        usdtBalance,
        totalPortfolioValue,
        holdings,
        totalPnL,
        totalPnLPercentage,
        initialBalance,
      };
    } catch (error) {
      logger.error("Error getting individual balance", "DualBalanceService", error);
      throw error;
    }
  }

  static async getCollectionBalance(
    collectionId: string, 
    userId: string
  ): Promise<CollectionBalance> {
    try {
      const { data: member, error: memberError } = await supabase
        .from('collection_members')
        .select('*')
        .eq('collection_id', collectionId)
        .eq('user_id', userId)
        .single();

      if (memberError) throw memberError;

      const { data: portfolio, error: portfolioError } = await supabase
        .from('collection_portfolio')
        .select('*')
        .eq('collection_id', collectionId)
        .eq('user_id', userId);

      if (portfolioError) throw portfolioError;

      const holdings: Record<string, any> = {};
      portfolio?.forEach(item => {
        holdings[item.symbol.toUpperCase()] = {
          amount: parseFloat(item.quantity),
          valueInUSD: parseFloat(item.total_value),
          symbol: item.symbol.toUpperCase(),
          name: item.symbol,
          image_url: item.image_url,
          averageBuyPrice: parseFloat(item.avg_cost),
          currentPrice: parseFloat(item.current_price),
          profitLoss: parseFloat(item.profit_loss),
          profitLossPercentage: parseFloat(item.profit_loss_percent),
        };
      });

      holdings.USDT = {
        amount: parseFloat(member.current_balance),
        valueInUSD: parseFloat(member.current_balance),
        symbol: 'USDT',
        name: 'Tether',
        image_url: 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661',
        averageBuyPrice: 1,
        currentPrice: 1,
        profitLoss: 0,
        profitLossPercentage: 0,
      };

      const totalPortfolioValue = this.calculateTotalPortfolioValue(holdings);
      const startingBalance = parseFloat(member.starting_balance);
      const totalPnL = totalPortfolioValue - startingBalance;
      const totalPnLPercentage = startingBalance > 0 ? (totalPnL / startingBalance) * 100 : 0;

      return {
        usdtBalance: parseFloat(member.current_balance),
        totalPortfolioValue,
        holdings,
        totalPnL,
        totalPnLPercentage,
        startingBalance,
        collectionId,
      };
    } catch (error) {
      logger.error("Error getting collection balance", "DualBalanceService", error);
      throw error;
    }
  }

  static async executeTrade(
    order: any,
    context: TradingContext,
    userId: string
  ): Promise<Transaction> {
    try {
      const isBuy = order.type === 'buy';
      const symbol = order.symbol.toUpperCase();
      const quantity = order.amount;
      const price = order.price;
      const totalValue = order.total;
      const fee = order.fees || 0;

      let balanceBefore: number;
      let balanceAfter: number;

      if (context.type === 'individual') {
        const individualBalance = await this.getIndividualBalance(userId);
        balanceBefore = individualBalance.usdtBalance;
        balanceAfter = isBuy ? balanceBefore - totalValue : balanceBefore + totalValue;
        
        console.log('💳 executeTrade - Balance calculation:', {
          balanceBefore,
          balanceAfter,
          isBuy,
          totalValue
        });
        
        await this.updateIndividualTrade(order, userId);
      } else {
        const collectionBalance = await this.getCollectionBalance(context.collectionId!, userId);
        balanceBefore = collectionBalance.usdtBalance;
        balanceAfter = isBuy ? balanceBefore - totalValue : balanceBefore + totalValue;
        
        await this.updateCollectionTrade(order, context.collectionId!, userId);
      }

      const transactionParams = {
        user_id: userId,
        type: order.type.toUpperCase() as 'BUY' | 'SELL',
        symbol: symbol,
        quantity: quantity.toString(),
        price: price.toString(),
        total_value: totalValue.toString(),
        fee: fee.toString(),
        order_type: order.orderType?.toUpperCase() as 'MARKET' | 'LIMIT',
        status: 'COMPLETED' as const,
        collection_id: context.type === 'collection' ? context.collectionId : undefined,
        usdt_balance_before: balanceBefore.toString(),
        usdt_balance_after: balanceAfter.toString(),
        timestamp: new Date().toISOString(),
      };

      // Use the enhanced transaction creation with daily limit check
      const transaction = await UserService.createTransactionWithLimitCheck(transactionParams);
      
      if (!transaction) {
        throw new Error('Failed to create transaction with limit check');
      }

      console.log('✅ Trade executed successfully with limit check:', {
        transactionId: transaction.id,
        symbol,
        type: order.type,
        amount: quantity,
        total: totalValue
      });

      return transaction;
    } catch (error) {
      console.error('❌ Error executing trade with limit check:', error);
      throw error;
    }
  }

  private static async updateIndividualTrade(order: any, userId: string): Promise<void> {
    const isBuy = order.type === 'buy';
    const symbol = order.symbol.toUpperCase();
    const quantity = order.amount;
    const price = order.price;
    const totalValue = order.total;

    const { data: user } = await supabase
      .from('users')
      .select('usdt_balance')
      .eq('id', userId)
      .single();

    if (!user) throw new Error('User not found');

    const currentUsdtBalance = parseFloat(user.usdt_balance);
    const newUsdtBalance = isBuy ? currentUsdtBalance - totalValue : currentUsdtBalance + totalValue;

    const cryptoValue = await this.calculateCryptoValue(userId);
    const totalPortfolioValue = newUsdtBalance + cryptoValue;

    await supabase
      .from('users')
      .update({ 
        usdt_balance: newUsdtBalance.toString(),
        total_portfolio_value: totalPortfolioValue.toString(),
        last_trade_at: new Date().toISOString()
      })
      .eq('id', userId);

    await this.updateIndividualPortfolio(symbol, quantity, price, totalValue, isBuy, userId);
  }

  private static async updateCollectionTrade(
    order: any, 
    collectionId: string, 
    userId: string
  ): Promise<void> {
    const isBuy = order.type === 'buy';
    const symbol = order.symbol.toUpperCase();
    const quantity = order.amount;
    const price = order.price;
    const totalValue = order.total;

    const { data: member } = await supabase
      .from('collection_members')
      .select('current_balance')
      .eq('collection_id', collectionId)
      .eq('user_id', userId)
      .single();

    if (!member) throw new Error('Collection member not found');

    const currentBalance = parseFloat(member.current_balance);
    const newBalance = isBuy ? currentBalance - totalValue : currentBalance + totalValue;

    const cryptoValue = await this.calculateCollectionCryptoValue(collectionId, userId);
    const totalPortfolioValue = newBalance + cryptoValue;

    await supabase
      .from('collection_members')
      .update({ 
        current_balance: newBalance.toString(),
        total_portfolio_value: totalPortfolioValue.toString(),
        last_trade_at: new Date().toISOString()
      })
      .eq('collection_id', collectionId)
      .eq('user_id', userId);

    await this.updateCollectionPortfolio(symbol, quantity, price, totalValue, isBuy, collectionId, userId);
  }

  private static async updateIndividualPortfolio(
    symbol: string,
    quantity: number,
    price: number,
    totalValue: number,
    isBuy: boolean,
    userId: string
  ): Promise<void> {
    const { data: existingHolding } = await supabase
      .from('portfolio')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .single();

    if (existingHolding) {
      const currentQuantity = parseFloat(existingHolding.quantity);
      const currentAvgCost = parseFloat(existingHolding.avg_cost);
      
      if (isBuy) {
        const newQuantity = currentQuantity + quantity;
        const totalCost = (currentQuantity * currentAvgCost) + totalValue;
        const newAvgCost = newQuantity > 0 ? totalCost / newQuantity : 0;
        
        await supabase
          .from('portfolio')
          .update({
            quantity: newQuantity.toString(),
            avg_cost: newAvgCost.toString(),
            current_price: price.toString(),
            total_value: (newQuantity * price).toString(),
            profit_loss: (newQuantity * price - totalCost).toString(),
            profit_loss_percent: totalCost > 0 ? ((newQuantity * price - totalCost) / totalCost * 100).toString() : '0',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('symbol', symbol);
      } else {
        const newQuantity = currentQuantity - quantity;
        
        if (newQuantity <= 0) {
          await supabase
            .from('portfolio')
            .delete()
            .eq('user_id', userId)
            .eq('symbol', symbol);
        } else {
          await supabase
            .from('portfolio')
            .update({
              quantity: newQuantity.toString(),
              current_price: price.toString(),
              total_value: (newQuantity * price).toString(),
              profit_loss: (newQuantity * price - (newQuantity * currentAvgCost)).toString(),
              profit_loss_percent: currentAvgCost > 0 ? ((price - currentAvgCost) / currentAvgCost * 100).toString() : '0',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('symbol', symbol);
        }
      }
    } else if (isBuy) {
      await supabase
        .from('portfolio')
        .insert({
          user_id: userId,
          symbol: symbol,
          quantity: quantity.toString(),
          avg_cost: price.toString(),
          current_price: price.toString(),
          total_value: totalValue.toString(),
          profit_loss: '0',
          profit_loss_percent: '0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
  }

  private static async updateCollectionPortfolio(
    symbol: string,
    quantity: number,
    price: number,
    totalValue: number,
    isBuy: boolean,
    collectionId: string,
    userId: string
  ): Promise<void> {
    const { data: existingHolding } = await supabase
      .from('collection_portfolio')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .single();

    if (existingHolding) {
      const currentQuantity = parseFloat(existingHolding.quantity);
      const currentAvgCost = parseFloat(existingHolding.avg_cost);
      
      if (isBuy) {
        const newQuantity = currentQuantity + quantity;
        const totalCost = (currentQuantity * currentAvgCost) + totalValue;
        const newAvgCost = newQuantity > 0 ? totalCost / newQuantity : 0;
        
        await supabase
          .from('collection_portfolio')
          .update({
            quantity: newQuantity.toString(),
            avg_cost: newAvgCost.toString(),
            current_price: price.toString(),
            total_value: (newQuantity * price).toString(),
            profit_loss: (newQuantity * price - totalCost).toString(),
            profit_loss_percent: totalCost > 0 ? ((newQuantity * price - totalCost) / totalCost * 100).toString() : '0',
            updated_at: new Date().toISOString()
          })
          .eq('collection_id', collectionId)
          .eq('user_id', userId)
          .eq('symbol', symbol);
      } else {
        const newQuantity = currentQuantity - quantity;
        
        if (newQuantity <= 0) {
          await supabase
            .from('collection_portfolio')
            .delete()
            .eq('collection_id', collectionId)
            .eq('user_id', userId)
            .eq('symbol', symbol);
        } else {
          await supabase
            .from('collection_portfolio')
            .update({
              quantity: newQuantity.toString(),
              current_price: price.toString(),
              total_value: (newQuantity * price).toString(),
              profit_loss: (newQuantity * price - (newQuantity * currentAvgCost)).toString(),
              profit_loss_percent: currentAvgCost > 0 ? ((price - currentAvgCost) / currentAvgCost * 100).toString() : '0',
              updated_at: new Date().toISOString()
            })
            .eq('collection_id', collectionId)
            .eq('user_id', userId)
            .eq('symbol', symbol);
        }
      }
    } else if (isBuy) {
      await supabase
        .from('collection_portfolio')
        .insert({
          collection_id: collectionId,
          user_id: userId,
          symbol: symbol,
          quantity: quantity.toString(),
          avg_cost: price.toString(),
          current_price: price.toString(),
          total_value: totalValue.toString(),
          profit_loss: '0',
          profit_loss_percent: '0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
  }

  private static calculateTotalPortfolioValue(holdings: Record<string, any>): number {
    let totalValue = 0;
    
    Object.values(holdings).forEach((holding: any) => {
      if (holding.symbol === 'USDT') {
        totalValue += holding.amount;
      } else {
        totalValue += holding.valueInUSD;
      }
    });
    
    return totalValue;
  }

  private static async calculateCryptoValue(userId: string): Promise<number> {
    const { data: portfolio } = await supabase
      .from('portfolio')
      .select('total_value')
      .eq('user_id', userId);

    return portfolio?.reduce((sum, item) => sum + parseFloat(item.total_value), 0) || 0;
  }

  private static async calculateCollectionCryptoValue(collectionId: string, userId: string): Promise<number> {
    const { data: portfolio } = await supabase
      .from('collection_portfolio')
      .select('total_value')
      .eq('collection_id', collectionId)
      .eq('user_id', userId);

    return portfolio?.reduce((sum, item) => sum + parseFloat(item.total_value), 0) || 0;
  }

  static async calculateIndividualPnL(userId: string): Promise<PnLResult> {
    const balance = await this.getIndividualBalance(userId);
    
    return {
      totalPnL: balance.totalPnL,
      totalPnLPercentage: balance.totalPnLPercentage,
      context: 'individual',
      startingBalance: balance.initialBalance,
      currentValue: balance.totalPortfolioValue,
    };
  }

  static async calculateCollectionPnL(collectionId: string, userId: string): Promise<PnLResult> {
    const balance = await this.getCollectionBalance(collectionId, userId);
    
    return {
      totalPnL: balance.totalPnL,
      totalPnLPercentage: balance.totalPnLPercentage,
      context: 'collection',
      collectionId,
      startingBalance: balance.startingBalance,
      currentValue: balance.totalPortfolioValue,
    };
  }

  static async calculateCombinedPnL(userId: string): Promise<CombinedPnLResult> {
    const individualPnL = await this.calculateIndividualPnL(userId);
    
    const { data: collections } = await supabase
      .from('collection_members')
      .select('collection_id')
      .eq('user_id', userId);

    const collectionPnLs = await Promise.all(
      collections?.map(async (member) => 
        this.calculateCollectionPnL(member.collection_id, userId)
      ) || []
    );

    const totalCombinedPnL = individualPnL.totalPnL + 
      collectionPnLs.reduce((sum, pnl) => sum + pnl.totalPnL, 0);
    
    const totalStartingBalance = individualPnL.startingBalance + 
      collectionPnLs.reduce((sum, pnl) => sum + pnl.startingBalance, 0);
    
    const totalCombinedPnLPercentage = totalStartingBalance > 0 ? 
      (totalCombinedPnL / totalStartingBalance) * 100 : 0;

    return {
      individual: individualPnL,
      collections: collectionPnLs,
      totalCombinedPnL,
      totalCombinedPnLPercentage,
    };
  }
} 