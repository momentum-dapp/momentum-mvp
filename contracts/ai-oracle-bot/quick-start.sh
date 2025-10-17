#!/bin/bash

echo "🚀 AI Oracle Bot - Quick Start Setup"
echo "====================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️  Setting up environment file..."
    cp env.example .env
    echo "✅ Created .env file from template"
    echo ""
    echo "🔧 Please edit .env file with your configuration:"
    echo "   - RPC_URL: Your Ethereum RPC endpoint"
    echo "   - PRIVATE_KEY: Your wallet private key"
    echo "   - AI_ORACLE_ADDRESS: Your deployed contract address"
    echo ""
    echo "📝 You can edit it with: nano .env"
    echo ""
    read -p "Press Enter after you've configured .env file..."
fi

# Test the setup
echo ""
echo "🧪 Testing setup..."
node test-setup.js

echo ""
echo "🎉 Setup complete! You can now:"
echo "   1. Run locally: npm start"
echo "   2. Deploy to Vercel: npm run deploy"
echo "   3. Read the full guide: DEPLOYMENT_GUIDE.md"
