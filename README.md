# Trading Simulation App

A React Native/Expo application for simulating cryptocurrency trading with real-time market data.
![Preview](https://github.com/user-attachments/assets/0369dc18-4551-4005-b50c-0bdce371a0e2)

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

1. Create a new Supabase project at https://app.supabase.com
2. Go to Project Settings → API
3. Copy:
   - `URL` under Project URL
   - `anon` public key under Project API keys
4. Create `.env` file in project root with:

```
SUPABASE_URL=https://bnlyyaprilekdcyfzybx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubHl5YXByaWxla2RjeWZ6eWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMDM0NzUsImV4cCI6MjA2MDc3OTQ3NX0.EcRI0raZbGU3DtAoAzv3fZGwCu05jLADKEbMCHyCeRE

```

⚠️ Important: Never commit your `.env` file! It's already in `.gitignore` for security.

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
