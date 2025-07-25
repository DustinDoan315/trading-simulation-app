# Crypto Trading Simulator

A React Native application for **virtual cryptocurrency trading simulation** with real-time market data, portfolio management, and social learning features. **This app is for educational purposes only - no real money is involved.**

## ⚠️ Important Notice

**This is a simulation app for educational purposes only:**

- No real money is involved in any transactions
- All trading activities use virtual currency
- Real market prices are used for educational realism only
- No actual cryptocurrency is bought, sold, or stored
- Designed for learning and practice purposes

## Features

- **Virtual Trading Simulation**: Practice trading with virtual money
- Real-time cryptocurrency price tracking (for educational purposes)
- Virtual portfolio management with P&L calculations
- Social learning through collections
- Leaderboards and rankings
- Multi-language support (English/Vietnamese)
- Dark theme UI
- Comprehensive learning modules

## Authentication Fix

### Issue

When users reset their account, the app would throw "User not authenticated" errors because the user state in Redux was cleared but not properly re-initialized.

### Solution

The app now includes automatic user re-initialization:

1. **useDualBalance Hook**: Automatically detects when user authentication is lost and re-initializes user data
2. **UserContext**: Added `reinitializeUser()` method to handle user data restoration
3. **Error Handling**: Enhanced error handling in trading components to automatically retry operations after re-authentication
4. **App Initialization**: Improved app startup to ensure user data is properly loaded

### How It Works

- When a "User not authenticated" error occurs, the system automatically:
  1. Detects the authentication error
  2. Attempts to re-initialize user data using the stored UUID
  3. Fetches existing user data or creates a new user if needed
  4. Retries the original operation

### Usage

The authentication fix is transparent to users. When they reset their account and try to trade, the app will automatically handle the re-authentication process.

## Development

### Prerequisites

- Node.js 18+
- React Native development environment
- Expo CLI

### Installation

```bash
npm install
# or
yarn install
```

### Running the App

```bash
npx expo start
```

### Environment Setup

Make sure to configure your Supabase credentials in the appropriate configuration files.

## Architecture

The app uses:

- **Redux Toolkit** for state management
- **Supabase** for backend services
- **React Native WebView** for charts
- **Expo Router** for navigation
- **TypeScript** for type safety

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
