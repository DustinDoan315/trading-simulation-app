import { db } from "../database/client";
import { eq } from "drizzle-orm";
import { users } from "../database/schema";

export const testDatabaseConnection = async () => {
  console.log("🧪 Testing database connection...");

  try {
    // Test 1: Try to insert a test user
    const testUser = {
      uuid: "test-user-" + Date.now(),
      balance: "1000",
      createdAt: new Date(),
    };

    console.log("📝 Test 1: Inserting test user...");
    const insertResult = await db.insert(users).values(testUser).returning();
    console.log("✅ Test user inserted successfully:", insertResult);

    // Test 2: Try to read the test user
    console.log("📖 Test 2: Reading test user...");
    const readResult = await db
      .select()
      .from(users)
      .where(eq(users.uuid, testUser.uuid));
    console.log("✅ Test user read successfully:", readResult);

    // Test 3: Try to update the test user
    console.log("✏️ Test 3: Updating test user...");
    const updateResult = await db
      .update(users)
      .set({ balance: "2000" })
      .where(eq(users.uuid, testUser.uuid))
      .returning();
    console.log("✅ Test user updated successfully:", updateResult);

    // Test 4: Try to delete the test user
    console.log("🗑️ Test 4: Deleting test user...");
    const deleteResult = await db
      .delete(users)
      .where(eq(users.uuid, testUser.uuid))
      .returning();
    console.log("✅ Test user deleted successfully:", deleteResult);

    console.log("🎉 All database tests passed! Database is working correctly.");
    return { success: true, message: "Database is working correctly" };
  } catch (error) {
    console.error("❌ Database test failed:", error);

    if (error instanceof Error && error.message.includes("readonly database")) {
      console.warn("⚠️ Database is readonly - this is expected in Expo Go");
      console.warn("⚠️ For persistent local storage, use a development build");
      console.log("ℹ️ App will continue with cloud-only storage");
      return {
        success: false,
        message: "Database is readonly (expected in Expo Go)",
        error: error.message,
        recommendation:
          "Use a development build for full local storage functionality",
      };
    }

    return {
      success: false,
      message: "Database test failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const getDatabaseInfo = async () => {
  try {
    // Get all users to check database state
    const allUsers = await db.select().from(users);

    console.log("📊 Database Info:");
    console.log(`- Total users: ${allUsers.length}`);
    console.log(`- Users:`, allUsers);

    return {
      totalUsers: allUsers.length,
      users: allUsers,
    };
  } catch (error) {
    console.error("❌ Failed to get database info:", error);
    return {
      totalUsers: 0,
      users: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
