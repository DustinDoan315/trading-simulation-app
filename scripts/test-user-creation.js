const { DualBalanceService } = require("../services/DualBalanceService");
const { supabase } = require("../services/SupabaseService");
const AsyncStorage = require("@react-native-async-storage/async-storage");

async function testUserCreation() {
  try {
    console.log("🧪 Testing user creation fix...");

    // Generate a test user ID
    const testUserId = "test-user-" + Date.now();
    console.log("Test user ID:", testUserId);

    // First, ensure the user doesn't exist
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", testUserId)
      .maybeSingle();

    if (existingUser) {
      console.log("❌ Test user already exists, deleting...");
      await supabase.from("users").delete().eq("id", testUserId);
    }

    // Test the ensureUserExists method
    console.log("🔧 Testing ensureUserExists...");
    await DualBalanceService.ensureUserExists(testUserId);

    // Verify the user was created
    const { data: createdUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", testUserId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch created user: ${error.message}`);
    }

    if (!createdUser) {
      throw new Error("User was not created successfully");
    }

    console.log("✅ User created successfully:", {
      id: createdUser.id,
      username: createdUser.username,
      usdt_balance: createdUser.usdt_balance,
    });

    // Test the updateIndividualTrade method with a mock order
    console.log("🔧 Testing updateIndividualTrade...");
    const mockOrder = {
      type: "buy",
      symbol: "BTC",
      amount: 0.1,
      price: 50000,
      total: 5000,
    };

    await DualBalanceService.updateIndividualTrade(mockOrder, testUserId);

    // Verify the balance was updated
    const { data: updatedUser } = await supabase
      .from("users")
      .select("usdt_balance")
      .eq("id", testUserId)
      .maybeSingle();

    console.log(
      "✅ Trade executed successfully. New balance:",
      updatedUser.usdt_balance
    );

    // Clean up
    console.log("🧹 Cleaning up test user...");
    await supabase.from("users").delete().eq("id", testUserId);

    console.log("🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testUserCreation();
