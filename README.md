![ChartScreen](https://github.com/user-attachments/assets/d1aac859-c5c0-44d8-bd50-d64f5bd64598)# Trading Simulation App

A React Native/Expo application for simulating cryptocurrency trading with real-time market data.

![HomeScreen](https://github.com/user-attachments/assets/7d9a8230-2216-4c57-8812-9960b0aa52af)
![ChartScreen](https://github.com/user-attachments/assets/a8bc85d3-66f6-400c-b6f3-26a53e634bda)
![PortfolioScreen](https://github.com/user-attachments/assets/00cade84-dde1-424c-8feb-0713ed654c0b)
![ListingScreen](https://github.com/user-attachments/assets/d759d0c8-0eb3-4c08-a54d-294ee012fa5d)
![SearchScreen](https://github.com/user-attachments/assets/5afcc575-14e1-4e18-b049-e322fe7ba1a1)

## Features

- Cryptocurrency portfolio tracking
- Real-time price charts
- Trade simulation
- Wallet management
- Supabase integration for data storage

## Tech Stack

- React Native with Expo
- TypeScript
- Expo Router
- Redux Toolkit for state management
- Supabase backend

## Development Setup

1. Install dependencies (using Yarn):

```bash
yarn install
```

2. Start the development server:

```bash
yarn start
```

3. Choose your development environment:
   - iOS Simulator (Mac only)
   - Android Emulator
   - Physical device via Expo Go
   - Web browser

## Project Structure

```
app/               # Main application code
  (auth)/          # Authentication flows
  (onboarding)/    # Onboarding screens
  (subs)/          # Subscription/paid features
  (tabs)/          # Main app tabs
  features/        # Redux slices
  hooks/           # Custom hooks
  types/           # Type definitions
services/          # API/service layers
```

## Testing

Run tests with coverage:

```bash
yarn test --coverage
```

## CI/CD

The project includes GitHub Actions CI that runs on every push/PR to main branch:
- Type checking
- Linting
- Unit tests

## Environment Variables

Create `.env` file with these variables:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## Deployment

For production builds, use Expo Application Services (EAS):

```bash
eas build --platform all
```

## Contributing

1. Create a new branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request
