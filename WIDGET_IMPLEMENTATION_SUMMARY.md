# iOS Widget Implementation Summary

## Overview

An iOS Widget Extension has been implemented for the Trade Coin Skills app, allowing users to view their portfolio data directly on their home screen.

## What Was Created

### 1. Widget Extension Files

- **`ios/TradeCoinSkillsWidget/TradeCoinSkillsWidget.swift`**

  - Main widget implementation with SwiftUI
  - Supports Small, Medium, and Large widget sizes
  - Displays portfolio value, PnL, win rate, rank, and trades
  - Auto-refreshes every 15 minutes

- **`ios/TradeCoinSkillsWidget/Info.plist`**

  - Widget extension configuration

- **`ios/TradeCoinSkillsWidget/TradeCoinSkillsWidget.entitlements`**
  - App Groups capability for data sharing

### 2. Native Module for Data Sharing

- **`ios/TradeCoinSkills/WidgetDataManager.swift`**

  - Swift class to share portfolio data with widget via App Groups
  - Reloads widget timelines when data is updated

- **`ios/TradeCoinSkills/WidgetDataManager.m`**
  - React Native bridge for WidgetDataManager
  - Exposes `updateWidgetData` and `clearWidgetData` methods

### 3. React Native Integration

- **`utils/widgetDataManager.ts`**

  - TypeScript service to interact with native widget module
  - Provides `updateWidgetData()` and `clearWidgetData()` methods

- **`context/UserContext.tsx`** (updated)
  - Automatically updates widget when user data changes
  - Clears widget data on logout

### 4. App Groups Configuration

- **`ios/TradeCoinSkills/TradeCoinSkills.entitlements`** (updated)
  - Added App Group: `group.com.dustindoan.tradecoinskills`
  - Enables data sharing between app and widget

### 5. Documentation

- **`ios/WIDGET_SETUP.md`**
  - Step-by-step guide to add widget target in Xcode
  - Troubleshooting tips

## Widget Features

### Displayed Information

- **Portfolio Value**: Total portfolio value in USD
- **Total PnL**: Profit/Loss amount and percentage
- **Win Rate**: Percentage of winning trades
- **Global Rank**: User's leaderboard position (if available)
- **Total Trades**: Number of trades executed
- **USDT Balance**: Available USDT for trading
- **Username & Avatar**: User's display name and emoji

### Widget Sizes

- **Small**: Compact view with portfolio value, PnL, and win rate
- **Medium**: Expanded view with additional stats (rank, trades, balance)
- **Large**: Full view with all information and better layout

## Next Steps

### 1. Add Widget Target in Xcode

Follow the instructions in `ios/WIDGET_SETUP.md` to:

1. Create the widget extension target in Xcode
2. Add the existing widget files to the target
3. Configure App Groups for both targets
4. Build and test

### 2. Test the Widget

1. Run the app and log in
2. Add the widget to your home screen
3. Verify data is displayed correctly
4. Make a trade and check if widget updates

### 3. Customize (Optional)

- Adjust widget refresh interval in `TradeCoinSkillsWidget.swift`
- Modify widget UI design and colors
- Add additional portfolio metrics
- Implement widget deep linking to open specific app screens

## Technical Details

### Data Flow

1. User data changes in React Native app
2. `UserContext` detects change via `useEffect`
3. `widgetDataManager.updateWidgetData()` is called
4. Native module writes data to App Group UserDefaults
5. Widget reads data from App Group UserDefaults
6. Widget UI updates automatically

### App Group Identifier

- **Group ID**: `group.com.dustindoan.tradecoinskills`
- **Storage Key**: `portfolioData`
- **Format**: JSON encoded `PortfolioData` structure

### Widget Update Schedule

- **Automatic**: Every 15 minutes (configurable)
- **Manual**: When app updates data via `WidgetCenter.shared.reloadAllTimelines()`

## Requirements

- iOS 14.0+
- Xcode 14.0+
- WidgetKit framework
- App Groups capability enabled

## Notes

- Widgets have size limits (~40KB per widget)
- Widget updates are throttled by iOS
- Widgets run in a separate process
- Data is shared via App Groups and UserDefaults
- Widget only works on iOS (Android widgets require different implementation)
