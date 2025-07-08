#!/usr/bin/env node

/**
 * Production Readiness Checker for CryptoSim Pro
 * 
 * This script automatically checks for common production issues
 * and provides recommendations for app store submission.
 */

const fs = require('fs');
const path = require('path');

class ProductionChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
    this.basePath = process.cwd();
  }

  // ANSI color codes for terminal output
  colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
  };

  log(message, color = 'white') {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  addIssue(category, message, severity = 'error') {
    this.issues.push({ category, message, severity });
  }

  addWarning(category, message) {
    this.warnings.push({ category, message });
  }

  addPassed(category, message) {
    this.passed.push({ category, message });
  }

  // Check for console.log statements
  checkConsoleLogs() {
    this.log('\n📋 Checking for console logs (Store Rejection Risk)...', 'cyan');
    
    const directories = ['components', 'features', 'services', 'hooks', 'utils', 'app'];
    let consoleCount = 0;
    const consoleFiles = [];

    directories.forEach(dir => {
      const dirPath = path.join(this.basePath, dir);
      if (fs.existsSync(dirPath)) {
        this.scanDirectoryForConsole(dirPath, consoleFiles);
      }
    });

    consoleCount = consoleFiles.reduce((sum, file) => sum + file.count, 0);

    if (consoleCount > 0) {
      this.addIssue(
        'Console Logs', 
        `Found ${consoleCount} console statements in ${consoleFiles.length} files. These MUST be removed for store approval.`,
        'critical'
      );
      
      consoleFiles.forEach(file => {
        console.log(`  ${this.colors.red}❌ ${file.path} (${file.count} statements)${this.colors.reset}`);
      });
    } else {
      this.addPassed('Console Logs', 'No console statements found');
    }
  }

  scanDirectoryForConsole(dirPath, results, relativePath = '') {
    try {
      const items = fs.readdirSync(dirPath);
      
      items.forEach(item => {
        const itemPath = path.join(dirPath, item);
        const relativeItemPath = path.join(relativePath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          this.scanDirectoryForConsole(itemPath, results, relativeItemPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          const content = fs.readFileSync(itemPath, 'utf8');
          const consoleMatches = content.match(/console\.(log|warn|error|info|debug)/g);
          
          if (consoleMatches) {
            results.push({
              path: relativeItemPath,
              count: consoleMatches.length
            });
          }
        }
      });
    } catch (error) {
      // Skip directories we can't read
    }
  }

  // Check app.json configuration
  checkAppConfig() {
    this.log('\n📱 Checking app.json configuration...', 'cyan');
    
    try {
      const appJsonPath = path.join(this.basePath, 'app.json');
      if (!fs.existsSync(appJsonPath)) {
        this.addIssue('App Config', 'app.json file not found');
        return;
      }

      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      const expo = appConfig.expo;

      // Check required fields
      const requiredFields = ['name', 'slug', 'version', 'description'];
      requiredFields.forEach(field => {
        if (!expo[field] || expo[field].trim() === '') {
          this.addIssue('App Config', `Missing required field: ${field}`);
        } else {
          this.addPassed('App Config', `${field} is properly set`);
        }
      });

      // Check app name length for home screen
      if (expo.name && expo.name.length > 12) {
        this.addWarning('App Config', `App name "${expo.name}" might be too long for home screen display`);
      }

      // Check for keywords
      if (!expo.keywords || expo.keywords.length === 0) {
        this.addIssue('App Config', 'Missing keywords for app store discoverability');
      } else {
        this.addPassed('App Config', `Keywords configured (${expo.keywords.length} keywords)`);
      }

      // Check privacy setting
      if (!expo.privacy || expo.privacy === 'unlisted') {
        this.addIssue('App Config', 'Privacy should be set to "public" for store submission');
      }

      // Check iOS configuration
      if (expo.ios) {
        if (expo.ios.bundleIdentifier) {
          this.addPassed('iOS Config', 'Bundle identifier configured');
        } else {
          this.addIssue('iOS Config', 'Missing bundle identifier');
        }

        // Check for permission descriptions
        const permissions = expo.ios.infoPlist || {};
        const requiredPermissions = [
          'NSCameraUsageDescription',
          'NSPhotoLibraryUsageDescription'
        ];

        requiredPermissions.forEach(permission => {
          if (permissions[permission]) {
            this.addPassed('iOS Config', `${permission} configured`);
          } else {
            this.addIssue('iOS Config', `Missing ${permission}`);
          }
        });
      }

      // Check Android configuration
      if (expo.android) {
        if (expo.android.package) {
          this.addPassed('Android Config', 'Package name configured');
        } else {
          this.addIssue('Android Config', 'Missing package name');
        }
      }

    } catch (error) {
      this.addIssue('App Config', `Error reading app.json: ${error.message}`);
    }
  }

  // Check for hardcoded values
  checkHardcodedValues() {
    this.log('\n🔢 Checking for hardcoded values...', 'cyan');
    
    try {
      const constantsPath = path.join(this.basePath, 'constants', 'AppConstants.ts');
      if (fs.existsSync(constantsPath)) {
        this.addPassed('Constants', 'AppConstants.ts file exists');
      } else {
        this.addWarning('Constants', 'Consider creating AppConstants.ts for centralized configuration');
      }

      // Check if old constant file is still being used
      const oldConstantPath = path.join(this.basePath, 'utils', 'constant.ts');
      if (fs.existsSync(oldConstantPath)) {
        this.addWarning('Constants', 'Old constant.ts file still exists - consider consolidating');
      }

      // Scan for hardcoded 100000 values
      const directories = ['features', 'services'];
      let hardcodedCount = 0;

      directories.forEach(dir => {
        const dirPath = path.join(this.basePath, dir);
        if (fs.existsSync(dirPath)) {
          hardcodedCount += this.scanForHardcodedValues(dirPath);
        }
      });

      if (hardcodedCount > 5) {
        this.addWarning('Constants', `Found ${hardcodedCount} potential hardcoded values. Consider using constants.`);
      } else {
        this.addPassed('Constants', 'Minimal hardcoded values found');
      }

    } catch (error) {
      this.addWarning('Constants', `Error checking constants: ${error.message}`);
    }
  }

  scanForHardcodedValues(dirPath) {
    let count = 0;
    try {
      const items = fs.readdirSync(dirPath);
      
      items.forEach(item => {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          count += this.scanForHardcodedValues(itemPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          const content = fs.readFileSync(itemPath, 'utf8');
          const matches = content.match(/\b100000\b/g);
          if (matches) {
            count += matches.length;
          }
        }
      });
    } catch (error) {
      // Skip directories we can't read
    }
    return count;
  }

  // Check dependencies
  checkDependencies() {
    this.log('\n📦 Checking dependencies...', 'cyan');
    
    try {
      const packageJsonPath = path.join(this.basePath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        this.addIssue('Dependencies', 'package.json not found');
        return;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for unused dependencies (common ones)
      const potentiallyUnused = ['react-dom', 'dotenv', 'reflect-metadata'];
      potentiallyUnused.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.addWarning('Dependencies', `Consider removing potentially unused dependency: ${dep}`);
        }
      });

      // Check for missing dependencies
      const dependencies = packageJson.dependencies || {};
      if (!dependencies.redux && dependencies['@reduxjs/toolkit']) {
        this.addWarning('Dependencies', 'Consider adding "redux" as explicit dependency');
      }

      this.addPassed('Dependencies', 'Package.json structure is valid');

    } catch (error) {
      this.addIssue('Dependencies', `Error reading package.json: ${error.message}`);
    }
  }

  // Check for error boundaries
  checkErrorBoundaries() {
    this.log('\n🛡️ Checking error boundaries...', 'cyan');
    
    const errorBoundaryPath = path.join(this.basePath, 'components', 'ErrorBoundary.tsx');
    const tradingErrorBoundaryPath = path.join(this.basePath, 'components', 'trading', 'TradingErrorBoundary.tsx');
    
    if (fs.existsSync(errorBoundaryPath)) {
      this.addPassed('Error Boundaries', 'General ErrorBoundary exists');
    } else {
      this.addIssue('Error Boundaries', 'Missing general ErrorBoundary component');
    }

    if (fs.existsSync(tradingErrorBoundaryPath)) {
      this.addPassed('Error Boundaries', 'Trading-specific ErrorBoundary exists');
    } else {
      this.addWarning('Error Boundaries', 'Consider adding trading-specific ErrorBoundary');
    }
  }

  // Check validation utilities
  checkValidation() {
    this.log('\n✅ Checking input validation...', 'cyan');
    
    const validationPath = path.join(this.basePath, 'utils', 'validation.ts');
    if (fs.existsSync(validationPath)) {
      this.addPassed('Validation', 'Validation utilities exist');
    } else {
      this.addIssue('Validation', 'Missing input validation utilities');
    }
  }

  // Check for required assets
  checkAssets() {
    this.log('\n🎨 Checking required assets...', 'cyan');
    
    const assetsPath = path.join(this.basePath, 'assets');
    if (!fs.existsSync(assetsPath)) {
      this.addIssue('Assets', 'Assets directory not found');
      return;
    }

    const requiredAssets = [
      'images/icon.png',
      'images/adaptive-icon.png', 
      'images/splash.png'
    ];

    requiredAssets.forEach(asset => {
      const assetPath = path.join(assetsPath, asset);
      if (fs.existsSync(assetPath)) {
        this.addPassed('Assets', `${asset} exists`);
      } else {
        this.addWarning('Assets', `Missing ${asset}`);
      }
    });
  }

  // Run all checks
  async runChecks() {
    this.log(`${this.colors.bright}${this.colors.magenta}🚀 CryptoSim Pro - Production Readiness Check${this.colors.reset}\n`);
    
    this.checkConsoleLogs();
    this.checkAppConfig();
    this.checkHardcodedValues();
    this.checkDependencies();
    this.checkErrorBoundaries();
    this.checkValidation();
    this.checkAssets();
    
    this.displayResults();
  }

  // Display final results
  displayResults() {
    this.log('\n' + '='.repeat(60), 'bright');
    this.log('📊 PRODUCTION READINESS SUMMARY', 'bright');
    this.log('='.repeat(60), 'bright');

    // Critical issues (store blockers)
    const criticalIssues = this.issues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      this.log(`\n${this.colors.red}🚫 CRITICAL ISSUES (STORE BLOCKERS): ${criticalIssues.length}${this.colors.reset}`);
      criticalIssues.forEach(issue => {
        this.log(`   ❌ [${issue.category}] ${issue.message}`, 'red');
      });
    }

    // Regular issues
    const regularIssues = this.issues.filter(issue => issue.severity !== 'critical');
    if (regularIssues.length > 0) {
      this.log(`\n${this.colors.red}❌ ISSUES TO FIX: ${regularIssues.length}${this.colors.reset}`);
      regularIssues.forEach(issue => {
        this.log(`   • [${issue.category}] ${issue.message}`, 'red');
      });
    }

    // Warnings
    if (this.warnings.length > 0) {
      this.log(`\n${this.colors.yellow}⚠️  WARNINGS: ${this.warnings.length}${this.colors.reset}`);
      this.warnings.forEach(warning => {
        this.log(`   • [${warning.category}] ${warning.message}`, 'yellow');
      });
    }

    // Passed checks
    if (this.passed.length > 0) {
      this.log(`\n${this.colors.green}✅ PASSED CHECKS: ${this.passed.length}${this.colors.reset}`);
      this.passed.forEach(passed => {
        this.log(`   ✓ [${passed.category}] ${passed.message}`, 'green');
      });
    }

    // Overall assessment
    this.log('\n' + '='.repeat(60), 'bright');
    
    if (criticalIssues.length > 0) {
      this.log('🔴 OVERALL STATUS: NOT READY FOR STORE SUBMISSION', 'red');
      this.log('   Fix critical issues before proceeding.', 'red');
    } else if (this.issues.length > 0) {
      this.log('🟡 OVERALL STATUS: NEEDS IMPROVEMENT', 'yellow');
      this.log('   Address remaining issues before store submission.', 'yellow');
    } else if (this.warnings.length > 0) {
      this.log('🟢 OVERALL STATUS: READY WITH RECOMMENDATIONS', 'green');
      this.log('   Consider addressing warnings for better quality.', 'green');
    } else {
      this.log('🎉 OVERALL STATUS: PRODUCTION READY!', 'green');
      this.log('   Your app is ready for store submission.', 'green');
    }

    this.log('\n📋 Next Steps:', 'cyan');
    this.log('1. Fix all critical issues first', 'white');
    this.log('2. Address remaining issues and warnings', 'white');
    this.log('3. Test on physical devices', 'white');
    this.log('4. Run this script again to verify fixes', 'white');
    this.log('5. Prepare store assets (screenshots, descriptions)', 'white');
    
    this.log('\n💡 For detailed guidance, refer to trading-simulation-app-review.md', 'blue');
    this.log('='.repeat(60) + '\n', 'bright');
  }
}

// Run the checker
const checker = new ProductionChecker();
checker.runChecks().catch(console.error);