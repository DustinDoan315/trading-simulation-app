# iOS Widget Extension Setup Guide

This guide will help you add the iOS Widget Extension target to your Xcode project.

## Prerequisites

- Xcode 14.0 or later
- iOS 14.0+ deployment target
- WidgetKit framework support

## Steps to Add Widget Extension

### 1. Open Xcode Project

```bash
cd ios
open TradeCoinSkills.xcworkspace
```

### 2. Add Widget Extension Target

1. In Xcode, go to **File** → **New** → **Target**
2. Select **Widget Extension** under **iOS** → **Application Extension**
3. Click **Next**
4. Configure the target:
   - **Product Name**: `TradeCoinSkillsWidget`
   - **Organization Identifier**: `com.dustindoan`
   - **Bundle Identifier**: `com.dustindoan.tradecoinskills.widget` (will auto-fill)
   - **Language**: Swift
   - **Include Configuration Intent**: ❌ (unchecked)
5. Click **Finish**
6. When prompted "Activate 'TradeCoinSkillsWidget' scheme?", click **Cancel** (we'll configure it manually)

### 3. Replace Generated Files

The widget extension files have already been created in the `ios/TradeCoinSkillsWidget/` directory. You need to:

1. **Delete** the auto-generated `TradeCoinSkillsWidget.swift` file that Xcode created
2. **Delete** the auto-generated `Info.plist` if it exists
3. **Add** the existing files to the widget target:
   - Right-click on `TradeCoinSkillsWidget` folder in Xcode
   - Select **Add Files to "TradeCoinSkillsWidget"...**
   - Navigate to `ios/TradeCoinSkillsWidget/`
   - Select:
     - `TradeCoinSkillsWidget.swift`
     - `Info.plist`
     - `TradeCoinSkillsWidget.entitlements`
   - Make sure **"Copy items if needed"** is unchecked
   - Make sure **"Add to targets: TradeCoinSkillsWidget"** is checked
   - Click **Add**

### 4. Configure Widget Target Settings

1. Select the **TradeCoinSkillsWidget** target in the project navigator
2. Go to **General** tab:
   - **Display Name**: `Trade Coin Skills`
   - **Bundle Identifier**: `com.dustindoan.tradecoinskills.widget`
   - **Version**: `1.0.1`
   - **Build**: `1`
   - **Deployment Target**: iOS 14.0 or higher

3. Go to **Signing & Capabilities** tab:
   - Enable **Automatically manage signing** (or configure manually)
   - Add **App Groups** capability:
     - Click **+ Capability**
     - Search for "App Groups"
     - Add the group: `group.com.dustindoan.tradecoinskills`
     - Make sure it matches the group in the main app target

4. Go to **Build Settings**:
   - Search for **Swift Language Version**
   - Set to **Swift 5** (or latest supported)
   - Search for **iOS Deployment Target**
   - Set to **14.0** or higher

### 5. Configure Main App Target

1. Select the **TradeCoinSkills** target
2. Go to **Signing & Capabilities** tab:
   - Add **App Groups** capability if not already present:
     - Click **+ Capability**
     - Search for "App Groups"
     - Add the group: `group.com.dustindoan.tradecoinskills`
   - Make sure the entitlements file includes the App Group

### 6. Add WidgetDataManager Files to Main App

1. Make sure `WidgetDataManager.swift` and `WidgetDataManager.m` are added to the main app target:
   - Select `WidgetDataManager.swift` in the project navigator
   - In the **File Inspector** (right panel), check **TradeCoinSkills** under **Target Membership**
   - Do the same for `WidgetDataManager.m`

### 7. Update Bridging Header (if needed)

The `TradeCoinSkills-Bridging-Header.h` should already be configured. If you see Swift compilation errors, verify:
- The bridging header path is set in **Build Settings** → **Swift Compiler - General** → **Objective-C Bridging Header**

### 8. Build and Test

1. Select the **TradeCoinSkills** scheme
2. Build the project (⌘B)
3. If successful, select the **TradeCoinSkillsWidget** scheme
4. Build the widget extension (⌘B)
5. Run the app on a device or simulator
6. Add the widget to your home screen:
   - Long press on home screen
   - Tap the **+** button
   - Search for "Trade Coin Skills"
   - Select a widget size
   - Tap **Add Widget**

## Troubleshooting

### Widget Not Showing Data

1. Verify App Groups are configured correctly in both targets
2. Check that the group identifier matches: `group.com.dustindoan.tradecoinskills`
3. Ensure the app has run at least once to write data to UserDefaults
4. Check Xcode console for any widget errors

### Build Errors

1. **"No such module 'WidgetKit'"**:
   - Make sure you're using iOS 14.0+ deployment target
   - Clean build folder (⌘⇧K) and rebuild

2. **Swift Compilation Errors**:
   - Verify Swift version in Build Settings
   - Check that all Swift files are added to the correct target

3. **Entitlements Errors**:
   - Verify both targets have App Groups capability
   - Check that entitlements files are properly configured

### Widget Not Updating

1. Widgets update on a schedule (every 15 minutes by default)
2. To force update during development:
   - Delete the widget from home screen
   - Re-add it
   - Or wait for the next update cycle

## Testing Widget Data Sharing

To test that data is being shared correctly:

1. Run the app and log in
2. Check that portfolio data is displayed
3. Add the widget to home screen
4. Verify widget shows the same data
5. Make a trade in the app
6. Wait for widget to update (or remove and re-add widget)

## Notes

- Widgets have size limits (systemSmall: ~40KB, systemMedium: ~40KB, systemLarge: ~40KB)
- Widget updates are throttled by iOS
- Widgets run in a separate process from the main app
- Data sharing uses App Groups and UserDefaults

