import AchievementService from './AchievementService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';
import { supabase } from './SupabaseService';
import { UserService } from './UserService';
import {
  CollectionBalance,
  CombinedPnLResult,
  IndividualBalance,
  PnLResult,
  TradingContext,
  Transaction,
} from "../types/database";


export class DualBalanceService {
  private static getSupabase() {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }
    return supabase;
  }

  static async ensureUserExists(userId: string): Promise<void> {
    try {
      // Check if user exists in Supabase
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      const { data: user, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (user) {
        // User exists, no action needed
        return;
      }

      // User doesn't exist, create them
      console.log("User not found in Supabase, creating user:", userId);

      // Get user profile from local storage
      const userProfileStr = await AsyncStorage.getItem("user_profile");
      let userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;

      if (!userProfile) {
        // Create default user profile
        const now = new Date().toISOString();
        const timestamp = Date.now().toString().slice(-6);
        userProfile = {
          id: userId,
          username: `user_${userId.slice(0, 8)}_${timestamp}`,
          usdt_balance: "100000",
          total_portfolio_value: "100000",
          initial_balance: "100000",
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

      // Try to sync user to Supabase
      const { UserSyncService } = await import("./UserSyncService");
      const syncResult = await UserSyncService.syncUserToCloud(userProfile);

      if (!syncResult.success) {
        throw new Error(
          `Failed to create user in Supabase: ${syncResult.error}`
        );
      }

      console.log("User created successfully in Supabase");
    } catch (error) {
      console.error("Failed to ensure user exists:", error);
      throw new Error(
        `User creation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  static async getIndividualBalance(
    userId: string
  ): Promise<IndividualBalance> {
    try {
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!user) {
        logger.warn(
          `User ${userId} not found, returning default balance`,
          "DualBalanceService"
        );
        return {
          usdtBalance: 100000.0,
          totalPortfolioValue: 100000.0,
          holdings: {
            USDT: {
              amount: 100000.0,
              valueInUSD: 100000.0,
              symbol: "USDT",
              name: "Tether",
              image_url:
                "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
              averageBuyPrice: 1,
              currentPrice: 1,
              profitLoss: 0,
              profitLossPercentage: 0,
            },
          },
          totalPnL: 0,
          totalPnLPercentage: 0,
          initialBalance: 100000.0,
        };
      }

      const { data: portfolio, error: portfolioError } = await supabase
        .from("portfolio")
        .select("*")
        .eq("user_id", userId);

      if (portfolioError) throw portfolioError;

      const holdings: Record<string, any> = {};
      portfolio?.forEach((item) => {
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
      const cryptoValue =
        portfolio?.reduce(
          (sum, item) => sum + parseFloat(item.total_value),
          0
        ) || 0;
      const actualUsdtBalance = initialBalance - cryptoValue;

      const usdtBalance = Math.max(0, actualUsdtBalance);

      holdings.USDT = {
        amount: usdtBalance,
        valueInUSD: usdtBalance,
        symbol: "USDT",
        name: "Tether",
        image_url:
          "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
        averageBuyPrice: 1,
        currentPrice: 1,
        profitLoss: 0,
        profitLossPercentage: 0,
      };

      const totalPortfolioValue = this.calculateTotalPortfolioValue(holdings);
      const totalPnL = totalPortfolioValue - initialBalance;
      const totalPnLPercentage =
        initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

      console.log("📊 getIndividualBalance - Database values:", {
        userId,
        usdtBalanceFromDB: user.usdt_balance,
        calculatedUsdtBalance: usdtBalance,
        initialBalance,
        cryptoValue,
        totalPortfolioValue,
        totalPnL,
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
      logger.error(
        "Error getting individual balance",
        "DualBalanceService",
        error
      );
      throw error;
    }
  }

  static async getCollectionBalance(
    collectionId: string,
    userId: string
  ): Promise<CollectionBalance> {
    try {
      const { data: member, error: memberError } = await supabase
        .from("collection_members")
        .select("*")
        .eq("collection_id", collectionId)
        .eq("user_id", userId)
        .maybeSingle();

      if (memberError) throw memberError;

      // If member doesn't exist, return default collection balance
      if (!member) {
        logger.warn(
          `Collection member ${userId} not found in collection ${collectionId}, returning default balance`,
          "DualBalanceService"
        );
        return {
          usdtBalance: 100000.0,
          totalPortfolioValue: 100000.0,
          holdings: {
            USDT: {
              amount: 100000.0,
              valueInUSD: 100000.0,
              symbol: "USDT",
              name: "Tether",
              image_url:
                "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
              averageBuyPrice: 1,
              currentPrice: 1,
              profitLoss: 0,
              profitLossPercentage: 0,
            },
          },
          totalPnL: 0,
          totalPnLPercentage: 0,
          startingBalance: 100000.0,
          collectionId,
        };
      }

      const { data: portfolio, error: portfolioError } = await supabase
        .from("collection_portfolio")
        .select("*")
        .eq("collection_id", collectionId)
        .eq("user_id", userId);

      if (portfolioError) throw portfolioError;

      const holdings: Record<string, any> = {};
      portfolio?.forEach((item) => {
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
        symbol: "USDT",
        name: "Tether",
        image_url:
          "https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
        averageBuyPrice: 1,
        currentPrice: 1,
        profitLoss: 0,
        profitLossPercentage: 0,
      };

      const totalPortfolioValue = this.calculateTotalPortfolioValue(holdings);
      const startingBalance = parseFloat(member.starting_balance);
      const totalPnL = totalPortfolioValue - startingBalance;
      const totalPnLPercentage =
        startingBalance > 0 ? (totalPnL / startingBalance) * 100 : 0;

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
      logger.error(
        "Error getting collection balance",
        "DualBalanceService",
        error
      );
      throw error;
    }
  }

  static async executeTrade(
    order: any,
    context: TradingContext,
    userId: string
  ): Promise<Transaction> {
    try {
      // Ensure user exists in Supabase before proceeding
      await this.ensureUserExists(userId);

      const isBuy = order.type === "buy";
      const symbol = order.symbol.toUpperCase();
      const quantity = order.amount;
      const price = order.price;
      const totalValue = order.total;
      const fee = order.fees || 0;

      // Validate balance before proceeding with transaction
      if (isBuy) {
        const individualBalance = await this.getIndividualBalance(userId);
        if (individualBalance.usdtBalance < totalValue) {
          throw new Error(`Insufficient USDT balance. You have ${individualBalance.usdtBalance} USDT, trying to spend ${totalValue} USDT`);
        }
      } else {
        // For sell orders, check if user has sufficient crypto balance
        const portfolio = await UserService.getPortfolio(userId);
        const cryptoHolding = portfolio.find(item => 
          item.symbol.toUpperCase() === symbol.toUpperCase()
        );
        
        if (!cryptoHolding || cryptoHolding.quantity < quantity) {
          throw new Error(`Insufficient ${symbol} balance. You have ${cryptoHolding?.quantity || 0} ${symbol}, trying to sell ${quantity} ${symbol}`);
        }
      }

      // Additional validation to ensure quantity is positive
      if (quantity <= 0) {
        throw new Error(`Invalid quantity: ${quantity}. Quantity must be greater than 0.`);
      }

      if (totalValue <= 0) {
        throw new Error(`Invalid total value: ${totalValue}. Total value must be greater than 0.`);
      }

      let balanceBefore: number;
      let balanceAfter: number;

      if (context.type === "individual") {
        const individualBalance = await this.getIndividualBalance(userId);
        balanceBefore = individualBalance.usdtBalance;
        balanceAfter = isBuy
          ? balanceBefore - totalValue
          : balanceBefore + totalValue;

        console.log("💳 executeTrade - Balance calculation:", {
          balanceBefore,
          balanceAfter,
          isBuy,
          totalValue,
        });

        await this.updateIndividualTrade(order, userId);
      } else {
        const collectionBalance = await this.getCollectionBalance(
          context.collectionId!,
          userId
        );
        balanceBefore = collectionBalance.usdtBalance;
        balanceAfter = isBuy
          ? balanceBefore - totalValue
          : balanceBefore + totalValue;

        await this.updateCollectionTrade(order, context.collectionId!, userId);
      }

      const transactionParams = {
        user_id: userId,
        type: order.type.toUpperCase() as "BUY" | "SELL",
        symbol: symbol,
        quantity: quantity.toString(),
        price: price.toString(),
        total_value: totalValue.toString(),
        fee: fee.toString(),
        order_type: order.orderType?.toUpperCase() as "MARKET" | "LIMIT",
        status: "COMPLETED" as const,
        collection_id:
          context.type === "collection" ? context.collectionId : undefined,
        usdt_balance_before: balanceBefore.toString(),
        usdt_balance_after: balanceAfter.toString(),
        timestamp: new Date().toISOString(),
      };

      // Use the enhanced transaction creation with daily limit check
      const transaction = await UserService.createTransactionWithLimitCheck(
        transactionParams
      );

      if (!transaction) {
        throw new Error("Failed to create transaction with limit check");
      }

      console.log("✅ Trade executed successfully with limit check:", {
        transactionId: transaction.id,
        symbol,
        type: order.type,
        amount: quantity,
        total: totalValue,
      });

      // Check achievements after successful trade
      try {
        await this.checkTradeAchievements(userId, order, transaction);
      } catch (achievementError) {
        logger.error('Error checking achievements:', achievementError);
        // Don't fail the trade if achievement checking fails
      }

      return transaction;
    } catch (error) {
      console.error("❌ Error executing trade with limit check:", error);
      throw error;
    }
  }

  private static async updateIndividualTrade(
    order: any,
    userId: string
  ): Promise<void> {
    const isBuy = order.type === "buy";
    const symbol = order.symbol.toUpperCase();
    const quantity = order.amount;
    const price = order.price;
    const totalValue = order.total;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("usdt_balance")
      .eq("id", userId)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) {
      // User not found in Supabase, try to create them
      console.log(
        "User not found in Supabase, attempting to create user:",
        userId
      );

      try {
        // Get user profile from local storage
        const userProfileStr = await AsyncStorage.getItem("user_profile");
        let userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;

        if (!userProfile) {
          // Create default user profile
          const now = new Date().toISOString();
          const timestamp = Date.now().toString().slice(-6);
          userProfile = {
            id: userId,
            username: `user_${userId.slice(0, 8)}_${timestamp}`,
            usdt_balance: "100000",
            total_portfolio_value: "100000",
            initial_balance: "100000",
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

        // Try to sync user to Supabase
        const { UserSyncService } = await import("./UserSyncService");
        const syncResult = await UserSyncService.syncUserToCloud(userProfile);

        if (!syncResult.success) {
          throw new Error(
            `Failed to create user in Supabase: ${syncResult.error}`
          );
        }

        console.log("User created successfully in Supabase");

        // Retry fetching the user
        const { data: retryUser, error: retryError } = await supabase
          .from("users")
          .select("usdt_balance")
          .eq("id", userId)
          .maybeSingle();

        if (retryError) throw retryError;
        if (!retryUser)
          throw new Error("User still not found after creation attempt");

        // Use the retry user data
        const currentUsdtBalance = parseFloat(retryUser.usdt_balance);
        const newUsdtBalance = isBuy
          ? currentUsdtBalance - totalValue
          : currentUsdtBalance + totalValue;

        const cryptoValue = await this.calculateCryptoValue(userId);
        const totalPortfolioValue = newUsdtBalance + cryptoValue;

        await supabase
          .from("users")
          .update({
            usdt_balance: newUsdtBalance.toString(),
            total_portfolio_value: totalPortfolioValue.toString(),
            last_trade_at: new Date().toISOString(),
          })
          .eq("id", userId);

        await this.updateIndividualPortfolio(
          symbol,
          quantity,
          price,
          totalValue,
          isBuy,
          userId
        );

        return;
      } catch (createError) {
        console.error("Failed to create user in Supabase:", createError);
        throw new Error(
          `User not found and creation failed: ${
            createError instanceof Error ? createError.message : "Unknown error"
          }`
        );
      }
    }

    const currentUsdtBalance = parseFloat(user.usdt_balance);
    const newUsdtBalance = isBuy
      ? currentUsdtBalance - totalValue
      : currentUsdtBalance + totalValue;

    const cryptoValue = await this.calculateCryptoValue(userId);
    const totalPortfolioValue = newUsdtBalance + cryptoValue;

    await supabase
      .from("users")
      .update({
        usdt_balance: newUsdtBalance.toString(),
        total_portfolio_value: totalPortfolioValue.toString(),
        last_trade_at: new Date().toISOString(),
      })
      .eq("id", userId);

    await this.updateIndividualPortfolio(
      symbol,
      quantity,
      price,
      totalValue,
      isBuy,
      userId
    );
  }

  private static async updateCollectionTrade(
    order: any,
    collectionId: string,
    userId: string
  ): Promise<void> {
    const isBuy = order.type === "buy";
    const symbol = order.symbol.toUpperCase();
    const quantity = order.amount;
    const price = order.price;
    const totalValue = order.total;

    const { data: member, error: memberError } = await supabase
      .from("collection_members")
      .select("current_balance")
      .eq("collection_id", collectionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!member) throw new Error("Collection member not found");

    const currentBalance = parseFloat(member.current_balance);
    const newBalance = isBuy
      ? currentBalance - totalValue
      : currentBalance + totalValue;

    const cryptoValue = await this.calculateCollectionCryptoValue(
      collectionId,
      userId
    );
    const totalPortfolioValue = newBalance + cryptoValue;

    await supabase
      .from("collection_members")
      .update({
        current_balance: newBalance.toString(),
        total_portfolio_value: totalPortfolioValue.toString(),
        last_trade_at: new Date().toISOString(),
      })
      .eq("collection_id", collectionId)
      .eq("user_id", userId);

    await this.updateCollectionPortfolio(
      symbol,
      quantity,
      price,
      totalValue,
      isBuy,
      collectionId,
      userId
    );
  }

  private static async updateIndividualPortfolio(
    symbol: string,
    quantity: number,
    price: number,
    totalValue: number,
    isBuy: boolean,
    userId: string
  ): Promise<void> {
    const { data: existingHolding, error: holdingError } = await supabase
      .from("portfolio")
      .select("*")
      .eq("user_id", userId)
      .eq("symbol", symbol)
      .maybeSingle();

    if (holdingError) throw holdingError;

    if (existingHolding) {
      const currentQuantity = parseFloat(existingHolding.quantity);
      const currentAvgCost = parseFloat(existingHolding.avg_cost);

      if (isBuy) {
        const newQuantity = currentQuantity + quantity;
        const totalCost = currentQuantity * currentAvgCost + totalValue;
        const newAvgCost = newQuantity > 0 ? totalCost / newQuantity : 0;

        await supabase
          .from("portfolio")
          .update({
            quantity: newQuantity.toString(),
            avg_cost: newAvgCost.toString(),
            current_price: price.toString(),
            total_value: (newQuantity * price).toString(),
            profit_loss: (newQuantity * price - totalCost).toString(),
            profit_loss_percent:
              totalCost > 0
                ? (
                    ((newQuantity * price - totalCost) / totalCost) *
                    100
                  ).toString()
                : "0",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("symbol", symbol);
      } else {
        const newQuantity = currentQuantity - quantity;

        if (newQuantity <= 0) {
          await supabase
            .from("portfolio")
            .delete()
            .eq("user_id", userId)
            .eq("symbol", symbol);
        } else {
          await supabase
            .from("portfolio")
            .update({
              quantity: newQuantity.toString(),
              current_price: price.toString(),
              total_value: (newQuantity * price).toString(),
              profit_loss: (
                newQuantity * price -
                newQuantity * currentAvgCost
              ).toString(),
              profit_loss_percent:
                currentAvgCost > 0
                  ? (
                      ((price - currentAvgCost) / currentAvgCost) *
                      100
                    ).toString()
                  : "0",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("symbol", symbol);
        }
      }
    } else if (isBuy) {
      await supabase.from("portfolio").insert({
        user_id: userId,
        symbol: symbol,
        quantity: quantity.toString(),
        avg_cost: price.toString(),
        current_price: price.toString(),
        total_value: totalValue.toString(),
        profit_loss: "0",
        profit_loss_percent: "0",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
    const { data: existingHolding, error: holdingError } = await supabase
      .from("collection_portfolio")
      .select("*")
      .eq("collection_id", collectionId)
      .eq("user_id", userId)
      .eq("symbol", symbol)
      .maybeSingle();

    if (holdingError) throw holdingError;

    if (existingHolding) {
      const currentQuantity = parseFloat(existingHolding.quantity);
      const currentAvgCost = parseFloat(existingHolding.avg_cost);

      if (isBuy) {
        const newQuantity = currentQuantity + quantity;
        const totalCost = currentQuantity * currentAvgCost + totalValue;
        const newAvgCost = newQuantity > 0 ? totalCost / newQuantity : 0;

        await supabase
          .from("collection_portfolio")
          .update({
            quantity: newQuantity.toString(),
            avg_cost: newAvgCost.toString(),
            current_price: price.toString(),
            total_value: (newQuantity * price).toString(),
            profit_loss: (newQuantity * price - totalCost).toString(),
            profit_loss_percent:
              totalCost > 0
                ? (
                    ((newQuantity * price - totalCost) / totalCost) *
                    100
                  ).toString()
                : "0",
            updated_at: new Date().toISOString(),
          })
          .eq("collection_id", collectionId)
          .eq("user_id", userId)
          .eq("symbol", symbol);
      } else {
        const newQuantity = currentQuantity - quantity;

        if (newQuantity <= 0) {
          await supabase
            .from("collection_portfolio")
            .delete()
            .eq("collection_id", collectionId)
            .eq("user_id", userId)
            .eq("symbol", symbol);
        } else {
          await supabase
            .from("collection_portfolio")
            .update({
              quantity: newQuantity.toString(),
              current_price: price.toString(),
              total_value: (newQuantity * price).toString(),
              profit_loss: (
                newQuantity * price -
                newQuantity * currentAvgCost
              ).toString(),
              profit_loss_percent:
                currentAvgCost > 0
                  ? (
                      ((price - currentAvgCost) / currentAvgCost) *
                      100
                    ).toString()
                  : "0",
              updated_at: new Date().toISOString(),
            })
            .eq("collection_id", collectionId)
            .eq("user_id", userId)
            .eq("symbol", symbol);
        }
      }
    } else if (isBuy) {
      await supabase.from("collection_portfolio").insert({
        collection_id: collectionId,
        user_id: userId,
        symbol: symbol,
        quantity: quantity.toString(),
        avg_cost: price.toString(),
        current_price: price.toString(),
        total_value: totalValue.toString(),
        profit_loss: "0",
        profit_loss_percent: "0",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  private static calculateTotalPortfolioValue(
    holdings: Record<string, any>
  ): number {
    let totalValue = 0;

    Object.values(holdings).forEach((holding: any) => {
      if (holding.symbol === "USDT") {
        totalValue += holding.amount;
      } else {
        totalValue += holding.valueInUSD;
      }
    });

    return totalValue;
  }

  private static async calculateCryptoValue(userId: string): Promise<number> {
    const { data: portfolio } = await supabase
      .from("portfolio")
      .select("total_value")
      .eq("user_id", userId);

    return (
      portfolio?.reduce((sum, item) => sum + parseFloat(item.total_value), 0) ||
      0
    );
  }

  private static async calculateCollectionCryptoValue(
    collectionId: string,
    userId: string
  ): Promise<number> {
    const { data: portfolio } = await supabase
      .from("collection_portfolio")
      .select("total_value")
      .eq("collection_id", collectionId)
      .eq("user_id", userId);

    return (
      portfolio?.reduce((sum, item) => sum + parseFloat(item.total_value), 0) ||
      0
    );
  }

  static async calculateIndividualPnL(userId: string): Promise<PnLResult> {
    const balance = await this.getIndividualBalance(userId);

    return {
      totalPnL: balance.totalPnL,
      totalPnLPercentage: balance.totalPnLPercentage,
      context: "individual",
      startingBalance: balance.initialBalance,
      currentValue: balance.totalPortfolioValue,
    };
  }

  static async calculateCollectionPnL(
    collectionId: string,
    userId: string
  ): Promise<PnLResult> {
    const balance = await this.getCollectionBalance(collectionId, userId);

    return {
      totalPnL: balance.totalPnL,
      totalPnLPercentage: balance.totalPnLPercentage,
      context: "collection",
      collectionId,
      startingBalance: balance.startingBalance,
      currentValue: balance.totalPortfolioValue,
    };
  }

  static async calculateCombinedPnL(
    userId: string
  ): Promise<CombinedPnLResult> {
    const individualPnL = await this.calculateIndividualPnL(userId);

    const { data: collections } = await supabase
      .from("collection_members")
      .select("collection_id")
      .eq("user_id", userId);

    const collectionPnLs = await Promise.all(
      collections?.map(async (member) =>
        this.calculateCollectionPnL(member.collection_id, userId)
      ) || []
    );

    const totalCombinedPnL =
      individualPnL.totalPnL +
      collectionPnLs.reduce((sum, pnl) => sum + pnl.totalPnL, 0);

    const totalStartingBalance =
      individualPnL.startingBalance +
      collectionPnLs.reduce((sum, pnl) => sum + pnl.startingBalance, 0);

    const totalCombinedPnLPercentage =
      totalStartingBalance > 0
        ? (totalCombinedPnL / totalStartingBalance) * 100
        : 0;

    return {
      individual: individualPnL,
      collections: collectionPnLs,
      totalCombinedPnL,
      totalCombinedPnLPercentage,
    };
  }

  /**
   * Check and update achievements after a successful trade
   */
  private static async checkTradeAchievements(
    userId: string,
    order: any,
    transaction: Transaction
  ): Promise<void> {
    try {
      const achievementService = AchievementService.getInstance();

      // Get user stats for achievement checking
      const { data: user } = await supabase
        .from('users')
        .select('total_trades, total_pnl, total_buy_volume, total_sell_volume, win_rate, total_portfolio_value')
        .eq('id', userId)
        .single();

      if (!user) return;

      // Calculate trade data for achievements
      const tradeData = {
        profit: parseFloat(user.total_pnl),
        volume: parseFloat(user.total_buy_volume) + parseFloat(user.total_sell_volume),
        winRate: parseFloat(user.win_rate),
        totalTrades: user.total_trades,
        portfolioValue: parseFloat(user.total_portfolio_value),
      };

      // Check trading achievements
      await achievementService.checkTradingAchievements(userId, tradeData);

      // Check for first trade achievement
      if (user.total_trades === 1) {
        await achievementService.updateAchievementProgress(userId, 'first_trade', 1);
      }

      // Check for profit achievements
      if (tradeData.profit > 0) {
        await achievementService.updateAchievementProgress(userId, 'first_profit', tradeData.profit);
      }

      // Check for volume achievements
      if (tradeData.volume > 0) {
        await achievementService.updateAchievementProgress(userId, 'volume_100k', tradeData.volume);
      }

      // Check for portfolio value achievements
      if (tradeData.portfolioValue > 0) {
        await achievementService.updateAchievementProgress(userId, 'portfolio_200k', tradeData.portfolioValue);
      }

      logger.info('Achievement check completed for trade', {
        userId,
        symbol: order.symbol,
        type: order.type,
        totalTrades: user.total_trades,
      });

    } catch (error) {
      logger.error('Error checking trade achievements:', error);
      // Don't throw error to avoid breaking the trade flow
    }
  }
}
