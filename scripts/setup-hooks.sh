#!/bin/bash

echo "🔧 Setting up development environment..."

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install
fi

# Setup Husky
echo "🐕 Setting up Husky pre-commit hooks..."
npx husky install

# Make the pre-commit hook executable
chmod +x .husky/pre-commit

echo "✅ Setup complete!"
echo ""
echo "🎉 Your development environment is ready!"
echo ""
echo "Available commands:"
echo "  yarn start          - Start development server"
echo "  yarn test           - Run tests"
echo "  yarn lint           - Run linting"
echo "  yarn type-check     - Run TypeScript checks"
echo "  yarn ci:full        - Run all CI checks locally"
echo ""
echo "Pre-commit hooks are now active and will run automatically on each commit." 