#!/usr/bin/env node

/**
 * Test script for DualBalanceService fixes
 * This script tests the service with non-existent users to ensure it handles PGRST116 errors
 */

const { DualBalanceService } = require("../services/DualBalanceService");

async function testDualBalanceService() {
  console.log("🧪 Testing DualBalanceService fixes...\n");

  const testUserId = "00000000-0000-0000-0000-000000000000"; // Non-existent user
  const testCollectionId = "00000000-0000-0000-0000-000000000000"; // Non-existent collection

  try {
    console.log("📊 Testing getIndividualBalance with non-existent user...");
    const individualBalance = await DualBalanceService.getIndividualBalance(
      testUserId
    );
    console.log("✅ getIndividualBalance succeeded:", {
      usdtBalance: individualBalance.usdtBalance,
      totalPortfolioValue: individualBalance.totalPortfolioValue,
      totalPnL: individualBalance.totalPnL,
    });

    console.log(
      "\n📊 Testing getCollectionBalance with non-existent collection..."
    );
    const collectionBalance = await DualBalanceService.getCollectionBalance(
      testCollectionId,
      testUserId
    );
    console.log("✅ getCollectionBalance succeeded:", {
      usdtBalance: collectionBalance.usdtBalance,
      totalPortfolioValue: collectionBalance.totalPortfolioValue,
      totalPnL: collectionBalance.totalPnL,
    });

    console.log(
      "\n🎉 All tests passed! DualBalanceService now handles missing users gracefully."
    );
    console.log("\n📋 What was fixed:");
    console.log("   - Changed .single() to .maybeSingle() to handle 0 rows");
    console.log("   - Added fallback logic for missing users/collections");
    console.log("   - Added proper error handling for database queries");
    console.log("   - Returns default balance when user/collection not found");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n🔧 The service still needs fixes.");
  }
}

// Run the test
testDualBalanceService().catch(console.error);
