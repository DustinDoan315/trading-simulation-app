# Trading Simulation App

A React Native trading simulation app with real-time crypto data, portfolio management, and secure wallet functionality.

## 🚀 Features

- Real-time cryptocurrency trading simulation
- Portfolio management with profit/loss tracking
- Secure wallet creation and management
- Offline-first architecture with cloud sync
- Multi-language support (English/Vietnamese)
- Beautiful, modern UI with dark/light themes

## 🛠️ Development

### Prerequisites

- Node.js 18+
- Yarn package manager
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd trading-simulation-app

# Install dependencies
yarn install

# Start the development server
yarn start
```

### Available Scripts

```bash
# Development
yarn start          # Start Expo development server
yarn android        # Run on Android
yarn ios           # Run on iOS
yarn web           # Run on web

# Testing
yarn test          # Run tests in watch mode
yarn test:ci       # Run tests for CI

# Code Quality
yarn lint          # Run ESLint
yarn lint:fix      # Run ESLint with auto-fix
yarn type-check    # Run TypeScript type checking
yarn type-check:verbose # Run TypeScript with verbose output

# Code Analysis
yarn check:unused-deps    # Check for unused dependencies
yarn check:console-logs   # Check for console.log statements
yarn check:todo          # Check for TODO comments
yarn check:fixme         # Check for FIXME comments
yarn check:secrets       # Check for potential hardcoded secrets

# CI/CD
yarn ci:full       # Run all CI checks locally
yarn precommit     # Run pre-commit checks
```

## 🔍 Code Quality & CI/CD

This project includes comprehensive code quality checks and CI/CD pipelines:

### Pre-commit Hooks

The project uses Husky and lint-staged to run quality checks before each commit:

- TypeScript type checking
- ESLint with auto-fix
- Console.log statement detection
- TODO comment detection

### GitHub Actions

Two workflows are configured:

#### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `develop` branches:

**Code Quality Checks:**

- ✅ TypeScript type checking (strict mode)
- ✅ ESLint linting and auto-fix
- ✅ Unused dependency detection
- ✅ Console.log statement detection
- ✅ TODO/FIXME comment detection
- ✅ File size analysis

**Testing:**

- ✅ Unit tests with coverage
- ✅ Test coverage reporting to Codecov

**Build Verification:**

- ✅ Web build verification
- ✅ Build artifact validation

**Security:**

- ✅ Security audit
- ✅ Hardcoded secret detection

#### 2. PR Checks Workflow (`.github/workflows/pr-checks.yml`)

Runs on pull requests to provide additional validation:

**PR Validation:**

- ✅ Merge conflict detection
- ✅ Commit message format validation
- ✅ Large file change detection
- ✅ Sensitive file detection

**Code Review Assistant:**

- ✅ Automated code review comments
- ✅ Change summary generation
- ✅ Review checklist

### Local Development

To run the same checks locally that run in CI:

```bash
# Run all CI checks
yarn ci:full

# Run individual checks
yarn type-check
yarn lint
yarn test:ci
```

### Commit Message Format

Follow the conventional commit format:

```
type(scope): description

Examples:
feat(auth): add biometric authentication
fix(trading): resolve order submission bug
docs(readme): update installation instructions
style(ui): improve button styling
refactor(api): simplify user service
test(portfolio): add balance calculation tests
chore(deps): update dependencies
```

## 📱 Platform Support

- ✅ iOS (iPhone/iPad)
- ✅ Android
- ✅ Web (Progressive Web App)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
```

### TypeScript Configuration

The project uses strict TypeScript configuration with:

- Strict mode enabled
- Unused locals/parameters detection
- Implicit return detection
- Path mapping for clean imports

## 🧪 Testing

```bash
# Run tests
yarn test

# Run tests with coverage
yarn test:ci

# Run specific test file
yarn test -- path/to/test.ts
```

## 📦 Building

```bash
# Build for web
yarn expo export:web

# Build for iOS
yarn expo run:ios

# Build for Android
yarn expo run:android
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run quality checks (`yarn ci:full`)
5. Commit your changes with proper format (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Quality Standards

- All code must pass TypeScript strict mode
- No console.log statements in production code
- Follow ESLint rules
- Write tests for new functionality
- Use conventional commit messages
- Keep functions small and focused
- Add proper error handling
- Document complex logic

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem
4. Add relevant error messages and logs
