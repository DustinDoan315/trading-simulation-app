#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting TestFlight deployment process...\n");

// Check if eas-cli is installed
try {
  execSync("eas --version", { stdio: "pipe" });
  console.log("✅ EAS CLI is installed");
} catch (error) {
  console.error("❌ EAS CLI is not installed. Please install it first:");
  console.error("npm install -g @expo/eas-cli");
  process.exit(1);
}

// Check if user is logged in
try {
  execSync("eas whoami", { stdio: "pipe" });
  console.log("✅ Logged into EAS");
} catch (error) {
  console.error("❌ Not logged into EAS. Please login first:");
  console.error("eas login");
  process.exit(1);
}

// Verify environment variables are set
const easConfigPath = path.join(__dirname, "..", "eas.json");
const easConfig = JSON.parse(fs.readFileSync(easConfigPath, "utf8"));

const requiredEnvVars = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
];

let missingVars = [];
requiredEnvVars.forEach((varName) => {
  const hasVar = Object.values(easConfig.build).some(
    (profile) =>
      profile.env &&
      profile.env[varName] &&
      profile.env[varName] !== `YOUR_${varName}_HERE`
  );
  if (!hasVar) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.error("❌ Missing or placeholder environment variables in eas.json:");
  missingVars.forEach((varName) => console.error(`   - ${varName}`));
  console.error(
    "\nPlease update eas.json with your actual Supabase credentials."
  );
  process.exit(1);
}

console.log("✅ Environment variables are configured");

// Build the app
console.log("\n📱 Building iOS app for TestFlight...");
try {
  execSync("eas build --platform ios --profile preview", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
  console.log("✅ Build completed successfully");
} catch (error) {
  console.error("❌ Build failed");
  process.exit(1);
}

// Submit to TestFlight
console.log("\n📤 Submitting to TestFlight...");
try {
  execSync("eas submit --platform ios --profile preview", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
  console.log("✅ App submitted to TestFlight successfully");
} catch (error) {
  console.error("❌ Submission failed");
  process.exit(1);
}

console.log("\n🎉 Deployment completed!");
console.log("📋 Next steps:");
console.log("1. Wait for Apple to process your build (usually 10-30 minutes)");
console.log("2. Check TestFlight for the new build");
console.log("3. Test the app to ensure the crash is fixed");
console.log("\n🔧 If you still experience crashes:");
console.log("- Check the device logs in Xcode");
console.log("- Verify your Supabase credentials are correct");
console.log("- Ensure your Supabase database is accessible");
