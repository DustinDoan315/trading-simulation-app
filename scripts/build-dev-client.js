#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Development Client for OTA Testing...\n');

// Check if EAS CLI is installed
try {
  execSync('eas --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ EAS CLI is not installed. Please install it first:');
  console.error('npm install -g @expo/eas-cli');
  process.exit(1);
}

// Check if user is logged in
try {
  execSync('eas whoami', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ You are not logged in to EAS. Please login first:');
  console.error('eas login');
  process.exit(1);
}

const platform = process.argv[2] || 'all';

console.log(`📱 Building for platform: ${platform}`);
console.log('⏳ This may take several minutes...\n');

try {
  // Build development client
  const command = `eas build --platform ${platform} --profile development`;
  console.log(`Running: ${command}\n`);
  
  execSync(command, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\n✅ Development client built successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Install the development build on your device');
  console.log('2. Test OTA updates by publishing to staging:');
  console.log('   yarn publish:staging');
  console.log('3. Check for updates in the app');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
